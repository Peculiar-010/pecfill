/**
 * pecfill — zero-dependency, seedable, production-ready mock data generator
 *
 * @module pecfill
 * @version 1.0.0
 * @author Peculiar
 * @license MIT
 *
 * @example
 * const pecfill = require('pecfill');
 *
 * // Fluent chaining
 * const user = pecfill.person().email().phone().build();
 *
 * // Schema engine
 * const record = pecfill.generate({ name: 'name', age: 'number', id: 'uuid' });
 *
 * // Seeded (reproducible) output
 * pecfill.seed(42);
 * const same = pecfill.internet.email(); // always the same result for seed 42
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// § 1. PRNG — Mulberry32 (fast, seedable, excellent distribution)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Internal PRNG state. Modified only by `_prng()` and `setSeed()`.
 * @private
 */
let _seed = Date.now() >>> 0;

/**
 * Mulberry32 PRNG — returns a float in [0, 1).
 * Chosen for: tiny footprint, single 32-bit state, excellent randomness
 * characteristics for mock data generation.
 * @private
 * @returns {number} A pseudo-random float in [0, 1)
 */
function _prng() {
  _seed |= 0;
  _seed = (_seed + 0x6d2b79f5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Returns a random integer in the range [min, max] (inclusive).
 * @private
 * @param {number} min - Lower bound (integer)
 * @param {number} max - Upper bound (integer)
 * @returns {number}
 */
function _randInt(min, max) {
  return Math.floor(_prng() * (max - min + 1)) + min;
}

/**
 * Picks a uniformly random element from an array.
 * @private
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
function _pick(arr) {
  return arr[_randInt(0, arr.length - 1)];
}

/**
 * Shuffles an array in-place using Fisher-Yates, driven by the PRNG.
 * @private
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
function _shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = _randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Zero-pads a number to the requested width.
 * @private
 */
function _pad(n, width) {
  return String(n).padStart(width, '0');
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. DATA TABLES (static, zero-dep)
// ─────────────────────────────────────────────────────────────────────────────

const DATA = {
  firstNames: [
    'Alice', 'Bob', 'Carol', 'David', 'Eva', 'Frank', 'Grace', 'Hank',
    'Iris', 'Jack', 'Karen', 'Liam', 'Mia', 'Noah', 'Olivia', 'Paul',
    'Quinn', 'Rachel', 'Sam', 'Tara', 'Uma', 'Victor', 'Wendy', 'Xander',
    'Yara', 'Zoe', 'Aaron', 'Bella', 'Carlos', 'Diana', 'Ethan', 'Fiona',
    'George', 'Hannah', 'Ivan', 'Julia', 'Kevin', 'Laura', 'Marcus', 'Nina',
    'Omar', 'Petra', 'Raj', 'Sofia', 'Tyler', 'Ursula', 'Vincent', 'Willa',
    'Peculiar', 'Sage', 'Remy', 'Phoenix', 'River', 'Sky', 'Jordan', 'Casey',
  ],
  lastNames: [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
    'Davis', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White',
    'Harris', 'Martin', 'Thompson', 'Martinez', 'Robinson', 'Clark',
    'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young',
    'Hernandez', 'King', 'Wright', 'Lopez', 'Scott', 'Green', 'Adams',
    'Baker', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Turner', 'Parker',
    'Collins', 'Edwards', 'Stewart', 'Morris', 'Murphy', 'Cook', 'Rogers',
  ],
  suffixes: ['Jr.', 'Sr.', 'II', 'III', 'IV', 'PhD', 'MD', 'Esq.'],
  prefixes: ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'],
  jobTitles: [
    'Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer',
    'DevOps Engineer', 'QA Engineer', 'Backend Developer', 'Frontend Developer',
    'Full-Stack Developer', 'Engineering Manager', 'CTO', 'CEO', 'COO',
    'Marketing Director', 'Sales Executive', 'Business Analyst', 'Scrum Master',
    'Cloud Architect', 'Security Engineer', 'ML Engineer', 'Staff Engineer',
    'Principal Engineer', 'VP of Engineering', 'Technical Writer', 'SRE',
  ],
  departments: [
    'Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Finance',
    'Human Resources', 'Legal', 'Operations', 'Customer Success', 'Research',
    'Data Science', 'Security', 'Infrastructure', 'Growth',
  ],
  companyNames: [
    'Acme Corp', 'Globex Industries', 'Initech', 'Umbrella Ltd', 'Hooli',
    'Pied Piper', 'Dunder Mifflin', 'Stark Industries', 'Wayne Enterprises',
    'Soylent Corp', 'Vandelay Industries', 'Bluth Company', 'Veridian Dynamics',
    'Massive Dynamics', 'Weyland-Yutani', 'Buy n Large', 'Cyberdyne Systems',
    'Axiom Technologies', 'Northrop Solutions', 'Cascade Digital',
    'Summit Analytics', 'Orbit Labs', 'Meridian Software', 'Apex Systems',
    'Pinnacle Group', 'Stratos Cloud', 'Nexus Ventures', 'Vortex AI',
  ],
  companySuffixes: ['Inc.', 'LLC', 'Ltd.', 'Corp.', 'Group', 'Holdings', 'Solutions', 'Technologies'],
  streetTypes: [
    'Street', 'Avenue', 'Boulevard', 'Road', 'Lane', 'Drive', 'Court',
    'Place', 'Terrace', 'Way', 'Circle', 'Highway', 'Crescent', 'Square',
  ],
  streetNames: [
    'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Willow', 'Birch', 'Main',
    'Park', 'Lake', 'Hill', 'River', 'Sunset', 'Sunrise', 'Forest',
    'Valley', 'Mountain', 'Ocean', 'Prairie', 'Meadow', 'Spring', 'Winter',
    'Summit', 'Canyon', 'Harbor', 'Lighthouse', 'Horizon', 'Clearwater',
  ],
  cities: [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
    'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
    'San Francisco', 'Seattle', 'Denver', 'Nashville', 'Oklahoma City',
    'Portland', 'Las Vegas', 'Louisville', 'Memphis', 'Atlanta', 'Boston',
    'Miami', 'Minneapolis', 'New Orleans', 'Cleveland', 'Raleigh', 'Tampa',
  ],
  states: [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming',
  ],
  stateCodes: [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID',
    'IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS',
    'MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK',
    'OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
    'WI','WY',
  ],
  countries: [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'France', 'Japan', 'India', 'Brazil', 'South Africa', 'Nigeria',
    'Mexico', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway',
    'Denmark', 'Finland', 'Singapore', 'New Zealand', 'Ireland',
    'Portugal', 'Poland', 'Argentina', 'Chile', 'Colombia', 'Kenya',
    'Ghana', 'Egypt', 'Morocco', 'Turkey', 'South Korea', 'Indonesia',
  ],
  countryCodes: [
    'US','GB','CA','AU','DE','FR','JP','IN','BR','ZA','NG','MX',
    'ES','IT','NL','SE','NO','DK','FI','SG','NZ','IE','PT','PL',
    'AR','CL','CO','KE','GH','EG','MA','TR','KR','ID',
  ],
  tlds: ['.com', '.io', '.dev', '.app', '.net', '.org', '.co', '.tech', '.ai'],
  emailProviders: ['gmail.com', 'yahoo.com', 'outlook.com', 'proton.me', 'icloud.com', 'hotmail.com'],
  loremWords: [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing',
    'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore',
    'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam',
    'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
    'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure',
    'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'fugiat',
    'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat',
    'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
    'mollit', 'anim', 'id', 'est', 'laborum',
  ],
  colors: [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
    'cyan', 'magenta', 'brown', 'black', 'white', 'gray', 'silver',
    'gold', 'indigo', 'violet', 'teal', 'maroon', 'navy', 'coral',
    'salmon', 'crimson', 'turquoise', 'lavender', 'beige', 'ivory', 'aqua',
  ],
  animals: [
    'cat', 'dog', 'rabbit', 'hamster', 'parrot', 'snake', 'turtle', 'fish',
    'horse', 'elephant', 'tiger', 'lion', 'bear', 'wolf', 'fox', 'deer',
    'eagle', 'hawk', 'owl', 'penguin', 'dolphin', 'whale', 'shark', 'octopus',
  ],
  currencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'],
  currencySymbols: { USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'CA$', AUD: 'A$', CHF: 'CHF', CNY: '¥', INR: '₹', BRL: 'R$' },
  creditCardTypes: ['Visa', 'Mastercard', 'American Express', 'Discover', 'UnionPay'],
  mimeTypes: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/json', 'application/pdf', 'text/plain', 'text/html',
    'video/mp4', 'audio/mpeg',
  ],
  fileExtensions: ['jpg', 'png', 'pdf', 'docx', 'xlsx', 'csv', 'json', 'mp4', 'mp3', 'txt', 'zip', 'svg', 'webp'],
  statusCodes: [200, 201, 204, 301, 302, 400, 401, 403, 404, 409, 422, 500, 502, 503],
  httpMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  protocols: ['https', 'http'],
  planets: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'],
  weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  genders: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
  timezones: [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
    'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland',
  ],
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// § 3. CUSTOM PROVIDER REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Holds user-injected custom data arrays.
 * @private
 */
const _customProviders = {};

// ─────────────────────────────────────────────────────────────────────────────
// § 4. CORE GENERATORS — pure functions, each returns a value
// ─────────────────────────────────────────────────────────────────────────────

/** @namespace generators */
const generators = {

  // ── § 4.1 Identity ──────────────────────────────────────────────────────

  /**
   * Returns a random first name.
   * @returns {string}
   */
  firstName() {
    const pool = _customProviders.firstNames || DATA.firstNames;
    return _pick(pool);
  },

  /**
   * Returns a random last name.
   * @returns {string}
   */
  lastName() {
    const pool = _customProviders.lastNames || DATA.lastNames;
    return _pick(pool);
  },

  /**
   * Returns a full name (first + last).
   * @returns {string}
   */
  fullName() {
    return `${generators.firstName()} ${generators.lastName()}`;
  },

  /**
   * Returns a name prefix (e.g., "Dr.", "Ms.").
   * @returns {string}
   */
  namePrefix() {
    return _pick(DATA.prefixes);
  },

  /**
   * Returns a name suffix (e.g., "Jr.", "PhD").
   * @returns {string}
   */
  nameSuffix() {
    return _pick(DATA.suffixes);
  },

  /**
   * Returns a random job title.
   * @returns {string}
   */
  jobTitle() {
    return _pick(DATA.jobTitles);
  },

  /**
   * Returns a random department name.
   * @returns {string}
   */
  department() {
    return _pick(DATA.departments);
  },

  /**
   * Returns a random gender label.
   * @returns {string}
   */
  gender() {
    return _pick(DATA.genders);
  },

  /**
   * Returns a random blood type.
   * @returns {string}
   */
  bloodType() {
    return _pick(DATA.bloodTypes);
  },

  /**
   * Returns a random age between min and max (defaults: 18–90).
   * @param {number} [min=18]
   * @param {number} [max=90]
   * @returns {number}
   */
  age(min = 18, max = 90) {
    if (typeof min !== 'number' || typeof max !== 'number' || min > max) {
      throw new PecfillError(`age(): min (${min}) must be ≤ max (${max}) and both must be numbers.`);
    }
    return _randInt(min, max);
  },

  /**
   * Returns a random date of birth as a Date object.
   * @param {number} [minAge=18]
   * @param {number} [maxAge=90]
   * @returns {Date}
   */
  dateOfBirth(minAge = 18, maxAge = 90) {
    const age = generators.age(minAge, maxAge);
    const now = new Date();
    const year = now.getFullYear() - age;
    return new Date(year, _randInt(0, 11), _randInt(1, 28));
  },

  // ── § 4.2 Location ──────────────────────────────────────────────────────

  /**
   * Returns a random street address.
   * @returns {string}
   */
  streetAddress() {
    return `${_randInt(1, 9999)} ${_pick(DATA.streetNames)} ${_pick(DATA.streetTypes)}`;
  },

  /**
   * Returns a random city name.
   * @returns {string}
   */
  city() {
    return _pick(DATA.cities);
  },

  /**
   * Returns a random US state name.
   * @returns {string}
   */
  state() {
    return _pick(DATA.states);
  },

  /**
   * Returns a random two-letter US state code.
   * @returns {string}
   */
  stateCode() {
    return _pick(DATA.stateCodes);
  },

  /**
   * Returns a random country name.
   * @returns {string}
   */
  country() {
    return _pick(DATA.countries);
  },

  /**
   * Returns a random ISO 3166-1 alpha-2 country code.
   * @returns {string}
   */
  countryCode() {
    return _pick(DATA.countryCodes);
  },

  /**
   * Returns a random US ZIP code.
   * @returns {string}
   */
  zipCode() {
    return _pad(_randInt(10000, 99999), 5);
  },

  /**
   * Returns a random latitude in the range [-90, 90].
   * @param {number} [precision=6]
   * @returns {number}
   */
  latitude(precision = 6) {
    return parseFloat((_prng() * 180 - 90).toFixed(precision));
  },

  /**
   * Returns a random longitude in the range [-180, 180].
   * @param {number} [precision=6]
   * @returns {number}
   */
  longitude(precision = 6) {
    return parseFloat((_prng() * 360 - 180).toFixed(precision));
  },

  /**
   * Returns a { latitude, longitude } coordinate pair.
   * @returns {{ latitude: number, longitude: number }}
   */
  coordinates() {
    return { latitude: generators.latitude(), longitude: generators.longitude() };
  },

  /**
   * Returns a random timezone string.
   * @returns {string}
   */
  timezone() {
    return _pick(DATA.timezones);
  },

  /**
   * Returns a full address object.
   * @returns {{ street: string, city: string, state: string, zip: string, country: string }}
   */
  address() {
    return {
      street: generators.streetAddress(),
      city: generators.city(),
      state: generators.state(),
      zip: generators.zipCode(),
      country: 'United States',
    };
  },

  // ── § 4.3 Internet ──────────────────────────────────────────────────────

  /**
   * Returns a random email address derived from a name.
   * @param {string} [firstName]
   * @param {string} [lastName]
   * @returns {string}
   */
  email(firstName, lastName) {
    const first = (firstName || generators.firstName()).toLowerCase().replace(/\s+/g, '');
    const last = (lastName || generators.lastName()).toLowerCase().replace(/\s+/g, '');
    const provider = _pick(DATA.emailProviders);
    const separators = ['', '.', '_'];
    const sep = _pick(separators);
    const suffix = _prng() > 0.5 ? String(_randInt(1, 999)) : '';
    return `${first}${sep}${last}${suffix}@${provider}`;
  },

  /**
   * Returns a random username.
   * @returns {string}
   */
  username() {
    const first = generators.firstName().toLowerCase();
    const last = generators.lastName().toLowerCase();
    const num = _randInt(1, 9999);
    const patterns = [
      `${first}${last}`,
      `${first}_${last}`,
      `${first}${num}`,
      `${first}.${last}`,
      `${last}${num}`,
    ];
    return _pick(patterns);
  },

  /**
   * Returns a random URL.
   * @param {object} [options]
   * @param {string} [options.protocol='https']
   * @returns {string}
   */
  url({ protocol } = {}) {
    const proto = protocol || _pick(DATA.protocols);
    const company = generators.companyName().toLowerCase().replace(/\s+|[^a-z0-9]/g, '');
    const tld = _pick(DATA.tlds);
    return `${proto}://${company}${tld}`;
  },

  /**
   * Returns a random domain name.
   * @returns {string}
   */
  domain() {
    const name = generators.companyName().toLowerCase().replace(/\s+|[^a-z0-9]/g, '');
    return `${name}${_pick(DATA.tlds)}`;
  },

  /**
   * Returns a random IPv4 address.
   * @returns {string}
   */
  ipv4() {
    return [_randInt(1, 254), _randInt(0, 255), _randInt(0, 255), _randInt(1, 254)].join('.');
  },

  /**
   * Returns a random IPv6 address.
   * @returns {string}
   */
  ipv6() {
    const seg = () => _pad(_randInt(0, 65535).toString(16), 4);
    return Array.from({ length: 8 }, seg).join(':');
  },

  /**
   * Returns a random MAC address.
   * @returns {string}
   */
  macAddress() {
    const seg = () => _pad(_randInt(0, 255).toString(16), 2);
    return Array.from({ length: 6 }, seg).join(':');
  },

  /**
   * Returns a random User-Agent string.
   * @returns {string}
   */
  userAgent() {
    return _pick(DATA.userAgents);
  },

  /**
   * Returns a random HTTP method.
   * @returns {string}
   */
  httpMethod() {
    return _pick(DATA.httpMethods);
  },

  /**
   * Returns a random HTTP status code.
   * @returns {number}
   */
  httpStatus() {
    return _pick(DATA.statusCodes);
  },

  /**
   * Returns a random MIME type.
   * @returns {string}
   */
  mimeType() {
    return _pick(DATA.mimeTypes);
  },

  /**
   * Returns a random file extension.
   * @returns {string}
   */
  fileExtension() {
    return _pick(DATA.fileExtensions);
  },

  /**
   * Returns a random file name with extension.
   * @returns {string}
   */
  fileName() {
    const base = generators.username().replace(/\./g, '_');
    const ext = generators.fileExtension();
    return `${base}.${ext}`;
  },

  /**
   * Returns a random port number (1024–65535).
   * @returns {number}
   */
  port() {
    return _randInt(1024, 65535);
  },

  /**
   * Generates a random password.
   * @param {object} [options]
   * @param {number} [options.length=16]
   * @param {boolean} [options.uppercase=true]
   * @param {boolean} [options.numbers=true]
   * @param {boolean} [options.symbols=true]
   * @returns {string}
   */
  password({ length = 16, uppercase = true, numbers = true, symbols = true } = {}) {
    if (length < 4 || length > 128) {
      throw new PecfillError(`password(): length must be between 4 and 128. Got: ${length}`);
    }
    let chars = 'abcdefghijklmnopqrstuvwxyz';
    if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (numbers) chars += '0123456789';
    if (symbols) chars += '!@#$%^&*()-_=+[]{}|;:,.<>?';
    return Array.from({ length }, () => chars[_randInt(0, chars.length - 1)]).join('');
  },

  // ── § 4.4 Finance ───────────────────────────────────────────────────────

  /**
   * Returns a random credit card number (Luhn-valid for Visa/MC patterns).
   * @param {string} [type] - Optional: 'Visa' | 'Mastercard' | 'American Express'
   * @returns {string}
   */
  creditCard(type) {
    const t = type || _pick(['Visa', 'Mastercard', 'American Express']);
    let prefix, length;
    if (t === 'American Express') { prefix = _pick(['34', '37']); length = 15; }
    else if (t === 'Mastercard') { prefix = String(_randInt(51, 55)); length = 16; }
    else { prefix = '4'; length = 16; } // Visa

    let num = prefix;
    while (num.length < length - 1) num += _randInt(0, 9);

    // Luhn check digit
    const digits = num.split('').map(Number);
    let sum = 0;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = digits[i];
      if ((digits.length - i) % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    const check = (10 - (sum % 10)) % 10;
    return num + check;
  },

  /**
   * Returns a random CVV code.
   * @param {number} [digits=3]
   * @returns {string}
   */
  cvv(digits = 3) {
    return _pad(_randInt(0, Math.pow(10, digits) - 1), digits);
  },

  /**
   * Returns a random card expiry date as "MM/YY".
   * @returns {string}
   */
  cardExpiry() {
    const month = _pad(_randInt(1, 12), 2);
    const year = (_randInt(1, 6) + new Date().getFullYear()) % 100;
    return `${month}/${_pad(year, 2)}`;
  },

  /**
   * Returns a random credit card type.
   * @returns {string}
   */
  creditCardType() {
    return _pick(DATA.creditCardTypes);
  },

  /**
   * Returns a random amount as a float, rounded to 2 decimal places.
   * @param {number} [min=0]
   * @param {number} [max=10000]
   * @param {number} [decimals=2]
   * @returns {number}
   */
  amount(min = 0, max = 10000, decimals = 2) {
    return parseFloat((_prng() * (max - min) + min).toFixed(decimals));
  },

  /**
   * Returns a random currency code (e.g., "USD").
   * @returns {string}
   */
  currency() {
    return _pick(DATA.currencies);
  },

  /**
   * Returns a random currency symbol (e.g., "$").
   * @returns {string}
   */
  currencySymbol() {
    const code = generators.currency();
    return DATA.currencySymbols[code] || code;
  },

  /**
   * Returns a random IBAN-style bank account string.
   * @returns {string}
   */
  iban() {
    const cc = generators.countryCode();
    const check = _pad(_randInt(10, 99), 2);
    const bban = Array.from({ length: 16 }, () => _randInt(0, 9)).join('');
    return `${cc}${check}${bban}`;
  },

  /**
   * Returns a random BTC wallet address (P2PKH format).
   * @returns {string}
   */
  bitcoinAddress() {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const len = _randInt(26, 34);
    return '1' + Array.from({ length: len - 1 }, () => chars[_randInt(0, chars.length - 1)]).join('');
  },

  // ── § 4.5 Company / Commerce ─────────────────────────────────────────────

  /**
   * Returns a random company name.
   * @returns {string}
   */
  companyName() {
    const pool = _customProviders.companyNames || DATA.companyNames;
    return _pick(pool);
  },

  /**
   * Returns a random company name with suffix.
   * @returns {string}
   */
  company() {
    return `${generators.companyName()} ${_pick(DATA.companySuffixes)}`;
  },

  /**
   * Returns a random product name.
   * @returns {string}
   */
  product() {
    const adj = _pick(['Pro', 'Max', 'Ultra', 'Prime', 'Elite', 'Core', 'Edge', 'Lite', 'Smart', 'Turbo']);
    const noun = _pick(['Widget', 'Platform', 'Solution', 'Suite', 'Hub', 'Flow', 'Tool', 'Kit', 'Drive', 'Pulse']);
    return `${adj} ${noun}`;
  },

  // ── § 4.6 Dates & Times ──────────────────────────────────────────────────

  /**
   * Returns a random Date in the past N years.
   * @param {number} [years=1]
   * @returns {Date}
   */
  pastDate(years = 1) {
    const now = Date.now();
    const ago = years * 365 * 24 * 60 * 60 * 1000;
    return new Date(now - _prng() * ago);
  },

  /**
   * Returns a random Date in the future N years.
   * @param {number} [years=1]
   * @returns {Date}
   */
  futureDate(years = 1) {
    const now = Date.now();
    const ahead = years * 365 * 24 * 60 * 60 * 1000;
    return new Date(now + _prng() * ahead);
  },

  /**
   * Returns a random Date between two dates.
   * @param {Date|string} start
   * @param {Date|string} end
   * @returns {Date}
   */
  dateRange(start, end) {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e) || s > e) {
      throw new PecfillError('dateRange(): start must be a valid date before end.');
    }
    return new Date(s + _prng() * (e - s));
  },

  /**
   * Returns the current timestamp as an ISO 8601 string.
   * @returns {string}
   */
  isoDate() {
    return generators.pastDate(_randInt(0, 3)).toISOString();
  },

  /**
   * Returns a random Unix timestamp (seconds since epoch).
   * @returns {number}
   */
  unixTimestamp() {
    return Math.floor(generators.pastDate(5).getTime() / 1000);
  },

  /**
   * Returns a random weekday name.
   * @returns {string}
   */
  weekday() {
    return _pick(DATA.weekdays);
  },

  /**
   * Returns a random month name.
   * @returns {string}
   */
  month() {
    return _pick(DATA.months);
  },

  /**
   * Returns a time string as "HH:MM:SS".
   * @returns {string}
   */
  time() {
    return `${_pad(_randInt(0, 23), 2)}:${_pad(_randInt(0, 59), 2)}:${_pad(_randInt(0, 59), 2)}`;
  },

  // ── § 4.7 Text / Lorem ───────────────────────────────────────────────────

  /**
   * Returns N random lorem ipsum words.
   * @param {number} [count=5]
   * @returns {string}
   */
  words(count = 5) {
    if (count < 1 || count > 500) {
      throw new PecfillError(`words(): count must be between 1 and 500. Got: ${count}`);
    }
    return Array.from({ length: count }, () => _pick(DATA.loremWords)).join(' ');
  },

  /**
   * Returns N lorem ipsum sentences.
   * @param {number} [count=3]
   * @returns {string}
   */
  sentences(count = 3) {
    return Array.from({ length: count }, () => {
      const wordCount = _randInt(6, 14);
      const text = generators.words(wordCount);
      return text.charAt(0).toUpperCase() + text.slice(1) + '.';
    }).join(' ');
  },

  /**
   * Returns N lorem ipsum paragraphs.
   * @param {number} [count=2]
   * @returns {string}
   */
  paragraphs(count = 2) {
    return Array.from({ length: count }, () => generators.sentences(_randInt(3, 6))).join('\n\n');
  },

  /**
   * Returns a random slug (URL-safe lowercase string).
   * @param {number} [wordCount=3]
   * @returns {string}
   */
  slug(wordCount = 3) {
    return Array.from({ length: wordCount }, () => _pick(DATA.loremWords)).join('-');
  },

  /**
   * Returns a random hashtag string.
   * @returns {string}
   */
  hashtag() {
    return '#' + generators.slug(1);
  },

  // ── § 4.8 Numbers & IDs ──────────────────────────────────────────────────

  /**
   * Returns a random integer between min and max (inclusive).
   * @param {number} [min=0]
   * @param {number} [max=100]
   * @returns {number}
   */
  integer(min = 0, max = 100) {
    if (typeof min !== 'number' || typeof max !== 'number' || min > max) {
      throw new PecfillError(`integer(): min (${min}) must be ≤ max (${max}).`);
    }
    return _randInt(min, max);
  },

  /**
   * Returns a random float between min and max.
   * @param {number} [min=0]
   * @param {number} [max=1]
   * @param {number} [precision=4]
   * @returns {number}
   */
  float(min = 0, max = 1, precision = 4) {
    return parseFloat((_prng() * (max - min) + min).toFixed(precision));
  },

  /**
   * Returns a random boolean.
   * @param {number} [probability=0.5] - Probability of returning true (0–1).
   * @returns {boolean}
   */
  boolean(probability = 0.5) {
    return _prng() < probability;
  },

  /**
   * Returns a RFC 4122 v4 UUID.
   * @returns {string}
   */
  uuid() {
    const hex = () => _randInt(0, 15).toString(16);
    const seg = (n) => Array.from({ length: n }, hex).join('');
    return `${seg(8)}-${seg(4)}-4${seg(3)}-${_pick(['8','9','a','b'])}${seg(3)}-${seg(12)}`;
  },

  /**
   * Returns a short NanoID-style unique ID.
   * @param {number} [size=21]
   * @returns {string}
   */
  nanoid(size = 21) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    return Array.from({ length: size }, () => alphabet[_randInt(0, alphabet.length - 1)]).join('');
  },

  /**
   * Returns a random hexadecimal color string (e.g., "#a3f2b1").
   * @returns {string}
   */
  hexColor() {
    const c = () => _pad(_randInt(0, 255).toString(16), 2);
    return `#${c()}${c()}${c()}`;
  },

  /**
   * Returns a random RGB color object.
   * @returns {{ r: number, g: number, b: number }}
   */
  rgb() {
    return { r: _randInt(0, 255), g: _randInt(0, 255), b: _randInt(0, 255) };
  },

  /**
   * Returns a random named color.
   * @returns {string}
   */
  color() {
    return _pick(DATA.colors);
  },

  /**
   * Returns a random percentage (0–100).
   * @returns {number}
   */
  percent() {
    return _randInt(0, 100);
  },

  // ── § 4.9 Phone ──────────────────────────────────────────────────────────

  /**
   * Returns a random US-formatted phone number.
   * @param {object} [options]
   * @param {string} [options.format='dashes'] - 'dashes' | 'dots' | 'spaces' | 'raw'
   * @returns {string}
   */
  phone({ format = 'dashes' } = {}) {
    const area = _randInt(200, 999);
    const prefix = _randInt(200, 999);
    const line = _pad(_randInt(0, 9999), 4);
    const separators = { dashes: '-', dots: '.', spaces: ' ', raw: '' };
    const sep = separators[format] !== undefined ? separators[format] : '-';
    return `${area}${sep}${prefix}${sep}${line}`;
  },

  // ── § 4.10 Misc ──────────────────────────────────────────────────────────

  /**
   * Returns a random element from the provided array.
   * @template T
   * @param {T[]} arr
   * @returns {T}
   */
  fromArray(arr) {
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new PecfillError('fromArray(): argument must be a non-empty array.');
    }
    return _pick(arr);
  },

  /**
   * Returns a random element from the provided enum object values.
   * @param {object} enumObj
   * @returns {*}
   */
  fromEnum(enumObj) {
    const values = Object.values(enumObj);
    if (values.length === 0) throw new PecfillError('fromEnum(): enum object must have at least one value.');
    return _pick(values);
  },

  /**
   * Returns a random animal name.
   * @returns {string}
   */
  animal() {
    return _pick(DATA.animals);
  },

  /**
   * Returns a random planet name.
   * @returns {string}
   */
  planet() {
    return _pick(DATA.planets);
  },

  /**
   * Returns a random emoji from a set of common ones.
   * @returns {string}
   */
  emoji() {
    const emojis = ['😀','🎉','🚀','🌍','💡','🔥','⚡','🎯','🛡️','🌈','🦄','🍀','💎','🏆','⭐'];
    return _pick(emojis);
  },

  /**
   * Returns a random US Social Security Number pattern (XXX-XX-XXXX).
   * @returns {string}
   */
  ssn() {
    const a = _pad(_randInt(100, 899), 3);
    const b = _pad(_randInt(10, 99), 2);
    const c = _pad(_randInt(1000, 9999), 4);
    return `${a}-${b}-${c}`;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// § 5. ERROR CLASS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Custom error class for friendly pecfill error messages.
 * @extends Error
 */
class PecfillError extends Error {
  constructor(message) {
    super(`[pecfill] ${message}`);
    this.name = 'PecfillError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6. SCHEMA ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Auto-detects the intended generator from a string type hint.
 * Applies smart heuristics: 'email' → generators.email(), 'created_at' → generators.isoDate(), etc.
 * @private
 * @param {string} hint
 * @returns {*}
 */
function _resolveHint(hint) {
  if (typeof hint !== 'string') {
    throw new PecfillError(`generate(): schema values must be strings or generator functions. Got: ${typeof hint}`);
  }

  const h = hint.toLowerCase().trim();

  // Direct generator name match
  if (generators[h]) return generators[h]();

  // Smart alias map
  const aliases = {
    // identity
    name: 'fullName', fullname: 'fullName', firstname: 'firstName', first_name: 'firstName',
    lastname: 'lastName', last_name: 'lastName', username: 'username',
    job: 'jobTitle', jobtitle: 'jobTitle', job_title: 'jobTitle',
    title: 'jobTitle', role: 'jobTitle', position: 'jobTitle',
    // contact
    mail: 'email', e_mail: 'email',
    tel: 'phone', telephone: 'phone', mobile: 'phone', cell: 'phone',
    // location
    street: 'streetAddress', city: 'city', state: 'state', zip: 'zipCode',
    zipcode: 'zipCode', postal: 'zipCode', country: 'country',
    lat: 'latitude', lng: 'longitude', lon: 'longitude',
    // id
    id: 'uuid', uid: 'uuid', guid: 'uuid', _id: 'uuid',
    // primitives
    string: 'words', str: 'words', text: 'sentences',
    number: 'integer', num: 'integer', int: 'integer', integer: 'integer',
    float: 'float', decimal: 'float',
    bool: 'boolean', boolean: 'boolean', flag: 'boolean',
    // dates
    date: 'isoDate', datetime: 'isoDate', timestamp: 'unixTimestamp',
    created_at: 'isoDate', updated_at: 'isoDate', createdAt: 'isoDate', updatedAt: 'isoDate',
    // finance
    price: 'amount', cost: 'amount', salary: 'amount', balance: 'amount',
    card: 'creditCard', credit_card: 'creditCard',
    // internet
    url: 'url', website: 'url', link: 'url',
    ip: 'ipv4', ipaddress: 'ipv4', ip_address: 'ipv4',
    color: 'hexColor', colour: 'hexColor',
    // content
    paragraph: 'paragraphs', body: 'paragraphs', description: 'sentences', bio: 'sentences',
    summary: 'sentences', slug: 'slug', tag: 'hashtag',
  };

  const key = h.replace(/[-\s]/g, '_');
  const resolved = aliases[key] || aliases[h];
  if (resolved && generators[resolved]) return generators[resolved]();

  // Fallback: if it starts with a known prefix, try partial match
  for (const [alias, fn] of Object.entries(aliases)) {
    if (h.includes(alias)) {
      if (generators[fn]) return generators[fn]();
    }
  }

  // Last resort: return a random word
  console.warn(`[pecfill] Unknown type hint "${hint}" — falling back to generators.words()`);
  return generators.words();
}

/**
 * Recursively resolves a schema definition into a populated data object.
 * @private
 */
function _resolveSchema(schema) {
  if (Array.isArray(schema)) {
    return schema.map(_resolveSchema);
  }
  if (schema !== null && typeof schema === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(schema)) {
      if (typeof value === 'function') {
        out[key] = value();
      } else if (typeof value === 'string') {
        out[key] = _resolveHint(value);
      } else if (Array.isArray(value)) {
        // Array descriptor: [type, count] or [schemaObj, count]
        if (value.length === 2 && typeof value[1] === 'number') {
          const [itemDef, count] = value;
          out[key] = Array.from({ length: count }, () =>
            typeof itemDef === 'string' ? _resolveHint(itemDef) : _resolveSchema(itemDef)
          );
        } else {
          out[key] = value.map(_resolveSchema);
        }
      } else if (value !== null && typeof value === 'object') {
        out[key] = _resolveSchema(value);
      } else {
        out[key] = value; // pass through literals (numbers, bools, null)
      }
    }
    return out;
  }
  if (typeof schema === 'string') return _resolveHint(schema);
  return schema;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 7. BULK GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates an array of N populated objects from a schema.
 * @param {object} schema - A schema definition object.
 * @param {number} count - Number of records to generate.
 * @returns {object[]}
 * @throws {PecfillError} If count is < 1.
 */
function _many(schema, count) {
  if (!Number.isInteger(count) || count < 1) {
    throw new PecfillError(`many(): count must be a positive integer. Got: ${count}`);
  }
  return Array.from({ length: count }, () => _resolveSchema(schema));
}

// ─────────────────────────────────────────────────────────────────────────────
// § 8. FLUENT BUILDER (Chaining API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builder class that enables fluent method chaining.
 * Returned by `pecfill.person()`, `pecfill.company()`, etc.
 *
 * @class PecfillBuilder
 * @example
 * const user = pecfill.person()
 *   .withEmail()
 *   .withPhone()
 *   .withAddress()
 *   .build();
 */
class PecfillBuilder {
  constructor(initial = {}) {
    this._data = { ...initial };
  }

  /**
   * Adds or overrides a key on the built object with a raw value or generator.
   * @param {string} key
   * @param {*|Function} valueOrFn
   * @returns {PecfillBuilder}
   */
  set(key, valueOrFn) {
    this._data[key] = typeof valueOrFn === 'function' ? valueOrFn() : valueOrFn;
    return this;
  }

  /**
   * Appends an email address to the object.
   * @returns {PecfillBuilder}
   */
  withEmail() {
    this._data.email = generators.email(this._data.firstName, this._data.lastName);
    return this;
  }

  /**
   * Appends a phone number to the object.
   * @returns {PecfillBuilder}
   */
  withPhone() {
    this._data.phone = generators.phone();
    return this;
  }

  /**
   * Appends a full address object.
   * @returns {PecfillBuilder}
   */
  withAddress() {
    this._data.address = generators.address();
    return this;
  }

  /**
   * Appends a UUID field named `id`.
   * @returns {PecfillBuilder}
   */
  withId() {
    this._data.id = generators.uuid();
    return this;
  }

  /**
   * Appends a company name.
   * @returns {PecfillBuilder}
   */
  withCompany() {
    this._data.company = generators.company();
    return this;
  }

  /**
   * Appends a job title.
   * @returns {PecfillBuilder}
   */
  withJobTitle() {
    this._data.jobTitle = generators.jobTitle();
    return this;
  }

  /**
   * Appends an avatar URL (placeholder service).
   * @returns {PecfillBuilder}
   */
  withAvatar() {
    const seed = generators.nanoid(8);
    this._data.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    return this;
  }

  /**
   * Appends ISO createdAt / updatedAt timestamps.
   * @returns {PecfillBuilder}
   */
  withTimestamps() {
    const created = generators.pastDate(2);
    this._data.createdAt = created.toISOString();
    this._data.updatedAt = generators.dateRange(created, new Date()).toISOString();
    return this;
  }

  /**
   * Applies a custom transform function to the accumulated data object.
   * @param {function(object): object} fn
   * @returns {PecfillBuilder}
   */
  transform(fn) {
    if (typeof fn !== 'function') throw new PecfillError('transform(): argument must be a function.');
    this._data = fn(this._data);
    return this;
  }

  /**
   * Returns the fully built data object.
   * @returns {object}
   */
  build() {
    return { ...this._data };
  }

  /**
   * Returns the built object as a pretty-printed JSON string.
   * @returns {string}
   */
  toJSON() {
    return JSON.stringify(this._data, null, 2);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 9. NAMESPACE MODULES
// ─────────────────────────────────────────────────────────────────────────────

const identity = {
  firstName: generators.firstName,
  lastName: generators.lastName,
  fullName: generators.fullName,
  prefix: generators.namePrefix,
  suffix: generators.nameSuffix,
  username: generators.username,
  email: generators.email,
  phone: generators.phone,
  age: generators.age,
  gender: generators.gender,
  bloodType: generators.bloodType,
  ssn: generators.ssn,
  jobTitle: generators.jobTitle,
  department: generators.department,
  dateOfBirth: generators.dateOfBirth,
};

const location = {
  streetAddress: generators.streetAddress,
  city: generators.city,
  state: generators.state,
  stateCode: generators.stateCode,
  zipCode: generators.zipCode,
  country: generators.country,
  countryCode: generators.countryCode,
  address: generators.address,
  latitude: generators.latitude,
  longitude: generators.longitude,
  coordinates: generators.coordinates,
  timezone: generators.timezone,
};

const internet = {
  email: generators.email,
  username: generators.username,
  url: generators.url,
  domain: generators.domain,
  ipv4: generators.ipv4,
  ipv6: generators.ipv6,
  macAddress: generators.macAddress,
  userAgent: generators.userAgent,
  httpMethod: generators.httpMethod,
  httpStatus: generators.httpStatus,
  mimeType: generators.mimeType,
  fileExtension: generators.fileExtension,
  fileName: generators.fileName,
  port: generators.port,
  password: generators.password,
};

const finance = {
  creditCard: generators.creditCard,
  creditCardType: generators.creditCardType,
  cvv: generators.cvv,
  cardExpiry: generators.cardExpiry,
  amount: generators.amount,
  currency: generators.currency,
  currencySymbol: generators.currencySymbol,
  iban: generators.iban,
  bitcoinAddress: generators.bitcoinAddress,
};

const commerce = {
  company: generators.company,
  companyName: generators.companyName,
  product: generators.product,
};

const date = {
  past: generators.pastDate,
  future: generators.futureDate,
  range: generators.dateRange,
  iso: generators.isoDate,
  unix: generators.unixTimestamp,
  weekday: generators.weekday,
  month: generators.month,
  time: generators.time,
};

const text = {
  words: generators.words,
  sentences: generators.sentences,
  paragraphs: generators.paragraphs,
  slug: generators.slug,
  hashtag: generators.hashtag,
  lorem: generators.paragraphs,
};

const number = {
  integer: generators.integer,
  float: generators.float,
  boolean: generators.boolean,
  percent: generators.percent,
};

const misc = {
  uuid: generators.uuid,
  nanoid: generators.nanoid,
  hexColor: generators.hexColor,
  rgb: generators.rgb,
  color: generators.color,
  animal: generators.animal,
  planet: generators.planet,
  emoji: generators.emoji,
  fromArray: generators.fromArray,
  fromEnum: generators.fromEnum,
};

// ─────────────────────────────────────────────────────────────────────────────
// § 10. PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

const pecfill = {

  // ── Namespaced modules ───────────────────────────────────────────────────
  identity,
  location,
  internet,
  finance,
  commerce,
  date,
  text,
  number,
  misc,

  // ── Direct shortcuts (most common generators) ────────────────────────────
  ...generators,

  // ── Seeding ──────────────────────────────────────────────────────────────

  /**
   * Sets the PRNG seed for reproducible output. Pass any integer or string.
   * @param {number|string} seed
   * @returns {pecfill} The pecfill object (chainable).
   * @example
   * pecfill.seed(42);
   * console.log(pecfill.fullName()); // Always the same name for seed 42
   */
  seed(seed) {
    if (seed === undefined || seed === null) {
      throw new PecfillError('seed(): a seed value (integer or string) is required.');
    }
    if (typeof seed === 'string') {
      // Simple DJB2 hash for string seeds
      let hash = 5381;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) + hash) + seed.charCodeAt(i);
        hash = hash >>> 0;
      }
      _seed = hash;
    } else {
      _seed = seed >>> 0;
    }
    return pecfill;
  },

  /**
   * Resets the PRNG to a random seed based on current time.
   * @returns {pecfill}
   */
  resetSeed() {
    _seed = Date.now() >>> 0;
    return pecfill;
  },

  // ── Schema Engine ─────────────────────────────────────────────────────────

  /**
   * Generates a single object populated according to the schema definition.
   *
   * Schema values can be:
   *  - A **string** type hint: 'name', 'email', 'uuid', 'number', 'date', etc.
   *  - A **function**: called with no args; its return value is used.
   *  - A **nested object**: recursively resolved.
   *  - A **tuple** `[type, count]`: generates an array of that type.
   *
   * @param {object} schema
   * @returns {object}
   * @example
   * const user = pecfill.generate({
   *   id: 'uuid',
   *   name: 'fullName',
   *   email: 'email',
   *   age: 'number',
   *   address: { city: 'city', country: 'country' },
   *   tags: ['slug', 3],
   * });
   */
  generate(schema) {
    if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) {
      throw new PecfillError('generate(): schema must be a plain object.');
    }
    return _resolveSchema(schema);
  },

  /**
   * Generates an array of N objects populated according to the schema.
   * @param {object} schema
   * @param {number} count
   * @returns {object[]}
   * @example
   * const users = pecfill.many({ name: 'fullName', email: 'email' }, 50);
   */
  many(schema, count) {
    if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) {
      throw new PecfillError('many(): schema must be a plain object.');
    }
    return _many(schema, count);
  },

  // ── Fluent Builder Factories ──────────────────────────────────────────────

  /**
   * Creates a fluent builder pre-populated with a random person.
   * @param {object} [overrides] - Optional field overrides.
   * @returns {PecfillBuilder}
   * @example
   * const user = pecfill.person()
   *   .withEmail()
   *   .withPhone()
   *   .withAddress()
   *   .withId()
   *   .build();
   */
  person(overrides = {}) {
    const firstName = generators.firstName();
    const lastName = generators.lastName();
    return new PecfillBuilder({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      age: generators.age(),
      gender: generators.gender(),
      ...overrides,
    });
  },

  /**
   * Creates a fluent builder pre-populated with a random company.
   * @param {object} [overrides]
   * @returns {PecfillBuilder}
   * @example
   * const biz = pecfill.business()
   *   .withAddress()
   *   .set('employees', () => pecfill.integer(10, 50000))
   *   .build();
   */
  business(overrides = {}) {
    return new PecfillBuilder({
      name: generators.company(),
      industry: generators.department(),
      founded: String(_randInt(1950, 2023)),
      ...overrides,
    });
  },

  /**
   * Creates a fluent builder pre-populated with a random product.
   * @param {object} [overrides]
   * @returns {PecfillBuilder}
   */
  productBuilder(overrides = {}) {
    return new PecfillBuilder({
      id: generators.uuid(),
      name: generators.product(),
      price: generators.amount(1, 9999),
      currency: generators.currency(),
      sku: generators.nanoid(10).toUpperCase(),
      inStock: generators.boolean(0.8),
      ...overrides,
    });
  },

  // ── Custom Providers ──────────────────────────────────────────────────────

  /**
   * Replaces (or extends) an internal data pool with a custom array.
   * Supported keys: `firstNames`, `lastNames`, `companyNames`.
   * @param {string} key - The data pool to override.
   * @param {string[]} values - Your custom array.
   * @returns {pecfill}
   * @example
   * pecfill.addProvider('firstNames', ['Peculiar', 'Sage', 'River']);
   * pecfill.firstName(); // now only returns from your list
   */
  addProvider(key, values) {
    if (typeof key !== 'string') throw new PecfillError('addProvider(): key must be a string.');
    if (!Array.isArray(values) || values.length === 0) {
      throw new PecfillError(`addProvider(): values must be a non-empty array. Got: ${typeof values}`);
    }
    _customProviders[key] = values;
    return pecfill;
  },

  /**
   * Removes a previously registered custom provider, restoring default data.
   * @param {string} key
   * @returns {pecfill}
   */
  removeProvider(key) {
    delete _customProviders[key];
    return pecfill;
  },

  /**
   * Registers a custom generator function under a name, callable via `generate()`.
   * @param {string} name
   * @param {function} fn
   * @returns {pecfill}
   * @example
   * pecfill.addGenerator('tier', () => pecfill.fromArray(['free', 'pro', 'enterprise']));
   * pecfill.generate({ plan: 'tier' }); // { plan: 'pro' }
   */
  addGenerator(name, fn) {
    if (typeof name !== 'string') throw new PecfillError('addGenerator(): name must be a string.');
    if (typeof fn !== 'function') throw new PecfillError('addGenerator(): fn must be a function.');
    generators[name] = fn;
    pecfill[name] = fn;
    return pecfill;
  },

  // ── Utilities ─────────────────────────────────────────────────────────────

  /**
   * Picks a random element from an array (alias for generators.fromArray).
   * @template T
   * @param {T[]} arr
   * @returns {T}
   */
  pick: generators.fromArray,

  /**
   * Returns a shuffled copy of an array.
   * @template T
   * @param {T[]} arr
   * @returns {T[]}
   */
  shuffle(arr) {
    if (!Array.isArray(arr)) throw new PecfillError('shuffle(): argument must be an array.');
    return _shuffle(arr);
  },

  /**
   * Samples N unique elements from an array.
   * @template T
   * @param {T[]} arr
   * @param {number} n
   * @returns {T[]}
   */
  sample(arr, n) {
    if (!Array.isArray(arr)) throw new PecfillError('sample(): first argument must be an array.');
    if (!Number.isInteger(n) || n < 1 || n > arr.length) {
      throw new PecfillError(`sample(): n must be between 1 and ${arr.length}. Got: ${n}`);
    }
    return _shuffle(arr).slice(0, n);
  },

  /**
   * The PecfillBuilder class, exposed for instanceof checks and extension.
   */
  Builder: PecfillBuilder,

  /**
   * The PecfillError class, exposed for instanceof checks in try/catch.
   */
  Error: PecfillError,

  /**
   * Library version.
   * @type {string}
   */
  version: '1.0.0',
};

// ─────────────────────────────────────────────────────────────────────────────
// § 11. EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = pecfill;
module.exports.default = pecfill; // ESM compat via bundlers
