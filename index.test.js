/**
 * pecfill test suite
 * Run with: node test/index.test.js
 *
 * Zero external test dependencies — uses only Node built-ins and
 * a tiny assertion helper so the package stays 100% dependency-free.
 */

'use strict';

const pecfill = require('../index');

// ─── Tiny test runner ────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    console.error(`  ✗ ${message} (expected throw, got none)`);
    failed++;
  } catch (e) {
    console.log(`  ✓ ${message}`);
    passed++;
  }
}

function suite(name, fn) {
  console.log(`\n▸ ${name}`);
  fn();
}

// ─────────────────────────────────────────────────────────────────────────────

suite('Seeding & PRNG reproducibility', () => {
  pecfill.seed(42);
  const a1 = pecfill.fullName();
  const a2 = pecfill.uuid();
  const a3 = pecfill.integer(0, 1000);

  pecfill.seed(42);
  const b1 = pecfill.fullName();
  const b2 = pecfill.uuid();
  const b3 = pecfill.integer(0, 1000);

  assert(a1 === b1, `seed(42) fullName is reproducible: "${a1}"`);
  assert(a2 === b2, `seed(42) uuid is reproducible: "${a2}"`);
  assert(a3 === b3, `seed(42) integer is reproducible: ${a3}`);

  pecfill.seed('hello');
  const c1 = pecfill.fullName();
  pecfill.seed('hello');
  const c2 = pecfill.fullName();
  assert(c1 === c2, `String seed 'hello' is reproducible: "${c1}"`);

  assertThrows(() => pecfill.seed(), 'seed() without args throws PecfillError');
});

suite('Identity generators', () => {
  pecfill.resetSeed();
  assert(typeof pecfill.firstName() === 'string', 'firstName() returns string');
  assert(typeof pecfill.lastName() === 'string', 'lastName() returns string');
  assert(pecfill.fullName().includes(' '), 'fullName() has a space');
  assert(['Mr.','Mrs.','Ms.','Dr.','Prof.'].includes(pecfill.namePrefix()), 'namePrefix() valid');
  assert(typeof pecfill.jobTitle() === 'string', 'jobTitle() returns string');
  assert(typeof pecfill.username() === 'string', 'username() returns string');

  const age = pecfill.age(20, 30);
  assert(age >= 20 && age <= 30, `age(20,30) in range: ${age}`);

  assertThrows(() => pecfill.age(50, 20), 'age(50,20) throws when min > max');
});

suite('Location generators', () => {
  assert(typeof pecfill.streetAddress() === 'string', 'streetAddress() returns string');
  assert(typeof pecfill.city() === 'string', 'city() returns string');
  assert(/^\d{5}$/.test(pecfill.zipCode()), 'zipCode() is 5 digits');
  const lat = pecfill.latitude();
  assert(lat >= -90 && lat <= 90, `latitude() in range: ${lat}`);
  const lng = pecfill.longitude();
  assert(lng >= -180 && lng <= 180, `longitude() in range: ${lng}`);
  const coords = pecfill.coordinates();
  assert('latitude' in coords && 'longitude' in coords, 'coordinates() has lat/lng keys');
  const addr = pecfill.address();
  assert('street' in addr && 'city' in addr && 'zip' in addr, 'address() has required fields');
});

suite('Internet generators', () => {
  const email = pecfill.email();
  assert(email.includes('@'), `email() contains @: ${email}`);
  const url = pecfill.url();
  assert(url.startsWith('http'), `url() starts with http: ${url}`);
  const ip = pecfill.ipv4();
  assert(/^\d+\.\d+\.\d+\.\d+$/.test(ip), `ipv4() matches pattern: ${ip}`);
  const mac = pecfill.macAddress();
  assert(/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/.test(mac), `macAddress() matches pattern: ${mac}`);
  const pw = pecfill.password({ length: 20 });
  assert(pw.length === 20, `password(length:20) is 20 chars: ${pw.length}`);
  assertThrows(() => pecfill.password({ length: 2 }), 'password(length:2) throws');
});

suite('Finance generators', () => {
  const cc = pecfill.creditCard('Visa');
  assert(cc.startsWith('4'), `Visa card starts with 4: ${cc}`);
  assert(cc.length === 16, `Visa card is 16 digits: ${cc.length}`);
  const amount = pecfill.amount(10, 100);
  assert(amount >= 10 && amount <= 100, `amount(10,100) in range: ${amount}`);
  const iban = pecfill.iban();
  assert(typeof iban === 'string' && iban.length > 10, `iban() is a string: ${iban}`);
});

suite('Date generators', () => {
  const past = pecfill.pastDate(1);
  assert(past instanceof Date, 'pastDate() returns Date');
  assert(past <= new Date(), 'pastDate() is in the past');
  const future = pecfill.futureDate(1);
  assert(future > new Date(), 'futureDate() is in the future');
  const iso = pecfill.isoDate();
  assert(!isNaN(Date.parse(iso)), `isoDate() is valid ISO string: ${iso}`);
  assertThrows(
    () => pecfill.dateRange('2025-01-01', '2020-01-01'),
    'dateRange() with inverted dates throws'
  );
});

suite('Text generators', () => {
  const words = pecfill.words(10);
  assert(words.split(' ').length === 10, `words(10) returns 10 words`);
  assertThrows(() => pecfill.words(0), 'words(0) throws');
  assertThrows(() => pecfill.words(501), 'words(501) throws');
  const sent = pecfill.sentences(3);
  assert(typeof sent === 'string' && sent.length > 0, 'sentences(3) returns string');
  const slug = pecfill.slug(2);
  assert(slug.includes('-'), `slug(2) has a dash: ${slug}`);
});

suite('Number generators', () => {
  const n = pecfill.integer(5, 10);
  assert(n >= 5 && n <= 10, `integer(5,10) in range: ${n}`);
  assertThrows(() => pecfill.integer(10, 5), 'integer(10,5) throws when min > max');
  const f = pecfill.float(0, 1, 2);
  assert(f >= 0 && f <= 1, `float(0,1) in range: ${f}`);
  const b = pecfill.boolean();
  assert(typeof b === 'boolean', 'boolean() returns boolean');
  const pct = pecfill.percent();
  assert(pct >= 0 && pct <= 100, `percent() in range: ${pct}`);
});

suite('UUID & IDs', () => {
  const uuid = pecfill.uuid();
  assert(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid),
    `uuid() matches RFC4122 v4 pattern: ${uuid}`);
  const nano = pecfill.nanoid(10);
  assert(nano.length === 10, `nanoid(10) is 10 chars: ${nano}`);
  const hex = pecfill.hexColor();
  assert(/^#[0-9a-f]{6}$/.test(hex), `hexColor() matches pattern: ${hex}`);
});

suite('Schema engine — generate()', () => {
  const schema = {
    id: 'uuid',
    name: 'fullName',
    email: 'email',
    age: 'number',
    city: 'city',
    joined: 'isoDate',
    tags: ['slug', 3],
    address: { street: 'streetAddress', zip: 'zipCode' },
  };
  const obj = pecfill.generate(schema);
  assert(typeof obj.id === 'string' && obj.id.includes('-'), `generate: id is UUID: ${obj.id}`);
  assert(obj.name.includes(' '), `generate: name has space: ${obj.name}`);
  assert(obj.email.includes('@'), `generate: email valid: ${obj.email}`);
  assert(typeof obj.age === 'number', `generate: age is number: ${obj.age}`);
  assert(Array.isArray(obj.tags) && obj.tags.length === 3, `generate: tags is array of 3`);
  assert(typeof obj.address.street === 'string', `generate: nested address.street`);
  assertThrows(() => pecfill.generate(null), 'generate(null) throws');
  assertThrows(() => pecfill.generate('string'), 'generate("string") throws');
});

suite('Schema engine — many()', () => {
  const users = pecfill.many({ name: 'fullName', email: 'email' }, 5);
  assert(Array.isArray(users) && users.length === 5, 'many() returns array of 5');
  assert(users[0].name !== undefined, 'many() first item has name');
  assertThrows(() => pecfill.many({ x: 'uuid' }, 0), 'many(schema, 0) throws');
  assertThrows(() => pecfill.many({ x: 'uuid' }, -1), 'many(schema, -1) throws');
});

suite('Custom providers', () => {
  pecfill.addProvider('firstNames', ['Peculiar', 'Sage']);
  const name = pecfill.firstName();
  assert(name === 'Peculiar' || name === 'Sage', `addProvider: firstName is from custom list: ${name}`);
  pecfill.removeProvider('firstNames');
  const defaultName = pecfill.firstName();
  assert(defaultName !== undefined, `removeProvider: firstName still works: ${defaultName}`);

  pecfill.addGenerator('tier', () => pecfill.fromArray(['free', 'pro', 'enterprise']));
  const obj = pecfill.generate({ plan: 'tier' });
  assert(['free','pro','enterprise'].includes(obj.plan), `addGenerator: custom 'tier' in schema: ${obj.plan}`);

  assertThrows(() => pecfill.addProvider('x', []), 'addProvider(key, []) throws on empty array');
  assertThrows(() => pecfill.addGenerator('y', 'notAFunction'), 'addGenerator with non-fn throws');
});

suite('Fluent builder (person)', () => {
  const user = pecfill.person()
    .withEmail()
    .withPhone()
    .withAddress()
    .withId()
    .withJobTitle()
    .withCompany()
    .withTimestamps()
    .build();

  assert(typeof user.firstName === 'string', `builder: firstName set: ${user.firstName}`);
  assert(user.email.includes('@'), `builder: email valid: ${user.email}`);
  assert(/\d/.test(user.phone), `builder: phone has digits: ${user.phone}`);
  assert('street' in user.address, 'builder: address.street present');
  assert(user.id && user.id.includes('-'), `builder: id is UUID: ${user.id}`);
  assert(typeof user.createdAt === 'string', `builder: createdAt is ISO string`);
  assert(new Date(user.createdAt) <= new Date(user.updatedAt), 'builder: createdAt ≤ updatedAt');

  const json = pecfill.person().withEmail().toJSON();
  assert(typeof JSON.parse(json).email === 'string', 'builder.toJSON() is valid JSON');
});

suite('Utilities — pick / shuffle / sample', () => {
  const arr = [1, 2, 3, 4, 5];
  const picked = pecfill.pick(arr);
  assert(arr.includes(picked), `pick() returns element from array: ${picked}`);
  const shuffled = pecfill.shuffle(arr);
  assert(shuffled.length === arr.length, 'shuffle() preserves length');
  assert(JSON.stringify(shuffled.sort()) === JSON.stringify(arr.sort()), 'shuffle() preserves elements');
  const sampled = pecfill.sample([10,20,30,40,50], 3);
  assert(sampled.length === 3, `sample(arr, 3) returns 3 elements`);
  assertThrows(() => pecfill.fromArray([]), 'fromArray([]) throws on empty array');
  assertThrows(() => pecfill.shuffle('string'), 'shuffle("string") throws');
  assertThrows(() => pecfill.sample([1,2], 5), 'sample(n > arr.length) throws');
});

suite('Misc generators', () => {
  const ssn = pecfill.ssn();
  assert(/^\d{3}-\d{2}-\d{4}$/.test(ssn), `ssn() format correct: ${ssn}`);
  const btc = pecfill.bitcoinAddress();
  assert(btc.startsWith('1'), `bitcoinAddress() starts with 1: ${btc}`);
  assert(typeof pecfill.planet() === 'string', 'planet() returns string');
  assert(typeof pecfill.animal() === 'string', 'animal() returns string');
  assert(typeof pecfill.emoji() === 'string', 'emoji() returns string');
});

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log('─'.repeat(50));

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n  All tests passed! 🎉\n');
}
