# pecfill

**Zero-dependency. Seedable. Production-ready.**  
A premium mock data generator built for developers who care about performance, DX, and reproducible test data.

```bash
npm install pecfill
```

---

## Why pecfill?

| Feature | pecfill | faker.js |
|---|---|---|
| **Dependencies** | 0 | 0 (v8+) |
| **Install size** | ~30 KB | ~3 MB |
| **Seedable PRNG** | ✅ Mulberry32 | ✅ |
| **Schema engine** | ✅ | ❌ |
| **Fluent builder** | ✅ | ❌ |
| **Custom providers** | ✅ | ✅ |
| **Auto type detection** | ✅ | ❌ |
| **Custom generators** | ✅ | ✅ |
| **Node.js** | ≥ 14 | ≥ 14 |
| **Luhn-valid cards** | ✅ | ✅ |

pecfill prioritizes a **tiny footprint**, a **schema-first API**, and a **fluent builder pattern** that faker's functional API doesn't offer. It's purpose-built for test fixtures, database seeding, API mocking, and CI pipelines where deterministic output is non-negotiable.

---

## Quick Start

```js
const pecfill = require('pecfill');

// One-shot generators
pecfill.fullName();       // "Grace Thompson"
pecfill.email();          // "grace.thompson42@gmail.com"
pecfill.uuid();           // "a1b2c3d4-..."
pecfill.creditCard();     // "4539148803436467"

// Seeded — reproducible across runs and machines
pecfill.seed(42);
pecfill.fullName();       // always "Hannah Lewis" for seed 42

// Schema engine
const user = pecfill.generate({
  id: 'uuid',
  name: 'fullName',
  email: 'email',
  age: 'number',
});
// { id: '...', name: 'Karen Martinez', email: 'hank@icloud.com', age: 34 }

// Fluent builder
const profile = pecfill.person()
  .withEmail()
  .withPhone()
  .withAddress()
  .withId()
  .build();
```

---

## Table of Contents

- [Installation](#installation)
- [Seeding (Reproducible Data)](#seeding-reproducible-data)
- [Direct Generators](#direct-generators)
  - [Identity](#identity)
  - [Location](#location)
  - [Internet](#internet)
  - [Finance](#finance)
  - [Dates & Times](#dates--times)
  - [Text / Lorem](#text--lorem)
  - [Numbers & IDs](#numbers--ids)
  - [Misc](#misc)
- [Schema Engine](#schema-engine)
  - [generate()](#generate)
  - [many()](#many)
  - [Auto Type Detection](#auto-type-detection)
- [Fluent Builder](#fluent-builder)
- [Namespaced API](#namespaced-api)
- [Custom Providers](#custom-providers)
- [Custom Generators](#custom-generators)
- [Utilities](#utilities)
- [Error Handling](#error-handling)
- [Advanced Patterns](#advanced-patterns)

---

## Installation

```bash
# npm
npm install pecfill

# yarn
yarn add pecfill

# pnpm
pnpm add pecfill
```

**No build step required.** Works with CommonJS `require()` and bundlers that handle the `module` field (Vite, Webpack, Rollup, esbuild).

```js
// CommonJS
const pecfill = require('pecfill');

// ESM (via bundler)
import pecfill from 'pecfill';
```

---

## Seeding (Reproducible Data)

pecfill uses the **Mulberry32** PRNG — a fast, single-state 32-bit algorithm with excellent distribution characteristics. Pass any integer or string as a seed.

```js
const pecfill = require('pecfill');

// Integer seed
pecfill.seed(42);
console.log(pecfill.fullName());  // "Hannah Lewis"   — always
console.log(pecfill.uuid());      // "da2849d7-..."   — always

// String seed (hashed internally via DJB2)
pecfill.seed('my-test-suite');
console.log(pecfill.email());     // deterministic

// Reset to random behavior
pecfill.resetSeed();
```

**Best Practice — per-test seeding:**

```js
const pecfill = require('pecfill');

beforeEach(() => {
  pecfill.seed(Date.now()); // or a fixed value per test
});

test('creates valid user', () => {
  const user = pecfill.generate({ name: 'fullName', email: 'email' });
  expect(user.email).toContain('@');
});
```

---

## Direct Generators

Every generator is also available as a top-level method and via namespaced modules.

### Identity

```js
pecfill.firstName()          // "Alice"
pecfill.lastName()           // "Johnson"
pecfill.fullName()           // "Alice Johnson"
pecfill.namePrefix()         // "Dr."
pecfill.nameSuffix()         // "PhD"
pecfill.username()           // "alice.johnson42"
pecfill.jobTitle()           // "Senior Software Engineer"
pecfill.department()         // "Engineering"
pecfill.gender()             // "Female"
pecfill.bloodType()          // "O+"
pecfill.ssn()                // "123-45-6789"
pecfill.age()                // 34
pecfill.age(18, 25)          // random between 18–25
pecfill.dateOfBirth()        // Date object
```

### Location

```js
pecfill.streetAddress()      // "742 Elm Street"
pecfill.city()               // "San Francisco"
pecfill.state()              // "California"
pecfill.stateCode()          // "CA"
pecfill.zipCode()            // "94102"
pecfill.country()            // "United States"
pecfill.countryCode()        // "US"
pecfill.latitude()           // -37.812456
pecfill.longitude()          // 144.963159
pecfill.coordinates()        // { latitude: ..., longitude: ... }
pecfill.timezone()           // "America/New_York"

// Full address object
pecfill.address()
// { street: "...", city: "...", state: "...", zip: "...", country: "..." }
```

### Internet

```js
pecfill.email()              // "alice.johnson42@gmail.com"
pecfill.email('Alice', 'Smith')  // "alice_smith@outlook.com"
pecfill.url()                // "https://globexindustries.io"
pecfill.url({ protocol: 'https' })
pecfill.domain()             // "initech.dev"
pecfill.ipv4()               // "192.168.1.104"
pecfill.ipv6()               // "2001:0db8:..."
pecfill.macAddress()         // "a1:b2:c3:d4:e5:f6"
pecfill.userAgent()          // "Mozilla/5.0 (Windows NT ..."
pecfill.httpMethod()         // "POST"
pecfill.httpStatus()         // 404
pecfill.mimeType()           // "application/json"
pecfill.fileExtension()      // "png"
pecfill.fileName()           // "alice_johnson.pdf"
pecfill.port()               // 8432
pecfill.password()           // "K#9mN@pL2vQ!wRtZ"
pecfill.password({ length: 32, symbols: false })
```

### Finance

```js
pecfill.creditCard()         // "4539148803436467" (Luhn-valid)
pecfill.creditCard('Mastercard')
pecfill.creditCard('American Express')
pecfill.creditCardType()     // "Visa"
pecfill.cvv()                // "473"
pecfill.cardExpiry()         // "09/27"
pecfill.amount()             // 4821.67
pecfill.amount(10, 500)      // 142.39
pecfill.currency()           // "EUR"
pecfill.currencySymbol()     // "€"
pecfill.iban()               // "DE29 1234 5678 9012 3456 78"
pecfill.bitcoinAddress()     // "1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf..."
```

### Dates & Times

```js
pecfill.pastDate()           // Date in the past year
pecfill.pastDate(5)          // Date in the past 5 years
pecfill.futureDate()         // Date in the next year
pecfill.futureDate(2)        // Date in the next 2 years
pecfill.dateRange('2020-01-01', '2024-12-31')  // Date in range
pecfill.isoDate()            // "2023-04-15T10:23:11.000Z"
pecfill.unixTimestamp()      // 1681555391
pecfill.weekday()            // "Tuesday"
pecfill.month()              // "October"
pecfill.time()               // "14:35:09"
```

### Text / Lorem

```js
pecfill.words(5)             // "lorem ipsum dolor sit amet"
pecfill.sentences(3)         // "Lorem ipsum dolor sit amet..."
pecfill.paragraphs(2)        // Multi-paragraph lorem
pecfill.slug(3)              // "dolor-sit-amet"
pecfill.hashtag()            // "#lorem"
```

### Numbers & IDs

```js
pecfill.integer(1, 100)      // 42
pecfill.float(0, 1, 4)       // 0.7341
pecfill.boolean()            // true
pecfill.boolean(0.9)         // true 90% of the time
pecfill.percent()            // 73
pecfill.uuid()               // RFC 4122 v4 UUID
pecfill.nanoid()             // "V1StGXR8_Z5jdHi6B-myT"
pecfill.nanoid(10)           // 10-char NanoID
pecfill.hexColor()           // "#a3f2b1"
pecfill.rgb()                // { r: 255, g: 120, b: 47 }
pecfill.color()              // "teal"
```

### Misc

```js
pecfill.phone()              // "415-867-5309"
pecfill.phone({ format: 'dots' })   // "415.867.5309"
pecfill.animal()             // "dolphin"
pecfill.planet()             // "Jupiter"
pecfill.emoji()              // "🚀"
pecfill.product()            // "Pro Widget"
pecfill.company()            // "Globex Industries LLC"
pecfill.companyName()        // "Globex Industries"
```

---

## Schema Engine

### generate()

Define the shape of your data object and pecfill fills it in. Schema values can be:

- A **string** type hint (see [Auto Type Detection](#auto-type-detection))
- A **generator function** `() => value`
- A **nested object** (recursively resolved)
- A **tuple** `[type, count]` to generate an array

```js
const userSchema = {
  id: 'uuid',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  age: 'number',
  joinedAt: 'isoDate',
  address: {
    street: 'streetAddress',
    city: 'city',
    zip: 'zipCode',
  },
  tags: ['slug', 3],                          // array of 3 slugs
  score: () => pecfill.float(0, 100, 1),      // custom generator
};

const user = pecfill.generate(userSchema);
/*
{
  id: "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
  firstName: "Grace",
  lastName: "Thompson",
  email: "grace.thompson42@gmail.com",
  age: 31,
  joinedAt: "2023-07-12T15:04:22.000Z",
  address: { street: "742 Maple Avenue", city: "Denver", zip: "80201" },
  tags: ["lorem-ipsum", "dolor-sit", "amet-consectetur"],
  score: 87.3
}
*/
```

### many()

Generate an array of N objects from a schema:

```js
// 50 users in one line
const users = pecfill.many({
  id: 'uuid',
  name: 'fullName',
  email: 'email',
  role: () => pecfill.fromArray(['admin', 'editor', 'viewer']),
}, 50);
```

### Auto Type Detection

When you use a field key as the type hint, or use common aliases, pecfill intelligently resolves the correct generator. All of these work:

```js
pecfill.generate({
  // Direct name matches
  firstName: 'firstName',
  email: 'email',
  uuid: 'uuid',

  // Smart aliases
  name: 'name',          // → fullName()
  id: 'id',             // → uuid()
  phone: 'phone',       // → phone()
  tel: 'tel',           // → phone()
  mobile: 'mobile',     // → phone()
  created_at: 'created_at',  // → isoDate()
  updatedAt: 'updatedAt',    // → isoDate()
  price: 'price',       // → amount()
  url: 'url',           // → url()
  ip: 'ip',             // → ipv4()
  color: 'color',       // → hexColor()
  bio: 'bio',           // → sentences()
  description: 'description', // → sentences()
  body: 'body',         // → paragraphs()
  slug: 'slug',         // → slug()
});
```

---

## Fluent Builder

The builder API lets you compose rich objects with readable, chainable calls.

```js
// Person builder
const user = pecfill.person()
  .withEmail()
  .withPhone()
  .withAddress()
  .withId()
  .withCompany()
  .withJobTitle()
  .withAvatar()
  .withTimestamps()
  .build();

// Override specific fields
const admin = pecfill.person({ firstName: 'Peculiar', age: 30 })
  .withEmail()
  .set('role', 'admin')
  .set('permissions', () => ['read', 'write', 'delete'])
  .build();

// Business builder
const company = pecfill.business()
  .withAddress()
  .set('employees', () => pecfill.integer(10, 50000))
  .set('revenue', () => pecfill.amount(100000, 10000000))
  .withTimestamps()
  .build();

// Product builder
const product = pecfill.productBuilder()
  .set('category', () => pecfill.fromArray(['Electronics', 'Clothing', 'Books']))
  .withTimestamps()
  .build();

// Custom transform at the end
const transformed = pecfill.person()
  .withEmail()
  .transform(data => ({
    ...data,
    displayName: data.firstName.toUpperCase(),
    isActive: true,
  }))
  .build();

// Export to JSON string
const json = pecfill.person().withEmail().withPhone().toJSON();
```

---

## Namespaced API

Every generator is available under a namespaced module for cleaner imports in large projects:

```js
const { identity, location, internet, finance, date, text, number, misc, commerce } = pecfill;

identity.fullName()      // "Alice Johnson"
location.address()       // { street, city, state, zip, country }
internet.email()         // "alice@gmail.com"
finance.creditCard()     // "4539..."
date.past(3)             // Date 3 years ago
text.paragraphs(2)       // lorem paragraphs
number.integer(1, 100)   // 42
misc.uuid()              // RFC 4122 v4
commerce.company()       // "Globex Industries LLC"
```

---

## Custom Providers

Replace internal data pools with your own arrays. Useful when you need domain-specific names or values.

```js
// Override first names
pecfill.addProvider('firstNames', ['Peculiar', 'Sage', 'River', 'Phoenix']);
pecfill.firstName(); // Only ever returns from your list

// Override company names
pecfill.addProvider('companyNames', ['Acme', 'Globex', 'Initech']);
pecfill.companyName(); // "Acme" | "Globex" | "Initech"

// Restore defaults
pecfill.removeProvider('firstNames');
pecfill.firstName(); // Back to the built-in pool

// Supported provider keys:
// 'firstNames', 'lastNames', 'companyNames'
```

---

## Custom Generators

Register a custom generator function and use it anywhere in the schema engine:

```js
pecfill.addGenerator('tier', () =>
  pecfill.fromArray(['free', 'pro', 'enterprise'])
);

pecfill.addGenerator('statusCode', () =>
  pecfill.fromArray([200, 201, 400, 401, 403, 404, 500])
);

pecfill.addGenerator('rating', () =>
  pecfill.float(1, 5, 1)
);

// Now use them in schemas
const product = pecfill.generate({
  id: 'uuid',
  name: 'product',
  plan: 'tier',           // uses your custom generator
  rating: 'rating',       // 4.3
  lastStatus: 'statusCode',
});
```

---

## Utilities

```js
// Pick a random item from any array
pecfill.pick(['red', 'green', 'blue']);   // "green"
pecfill.fromArray([1, 2, 3, 4, 5]);       // 3

// Pick from an enum object
const Status = { ACTIVE: 'active', INACTIVE: 'inactive', PENDING: 'pending' };
pecfill.fromEnum(Status);  // "pending"

// Shuffle a copy of an array (original unchanged)
pecfill.shuffle([1, 2, 3, 4, 5]);  // [3, 1, 5, 2, 4]

// Sample N unique elements
pecfill.sample(['a', 'b', 'c', 'd', 'e'], 3);  // ['c', 'a', 'e']
```

---

## Error Handling

pecfill throws a `PecfillError` (extends `Error`) for invalid inputs, with descriptive messages.

```js
const { Error: PecfillError } = require('pecfill');

try {
  pecfill.many({ name: 'fullName' }, 0);
} catch (err) {
  if (err instanceof PecfillError) {
    console.error(err.message);
    // "[pecfill] many(): count must be a positive integer. Got: 0"
  }
}

// Errors are thrown for:
// - seed() with no argument
// - age(min, max) where min > max
// - words() with count < 1 or > 500
// - password() with length < 4 or > 128
// - integer(min, max) where min > max
// - dateRange() with inverted dates
// - generate() with non-object schema
// - many() with count < 1
// - fromArray([]) with empty array
// - sample(arr, n) where n > arr.length
// - addProvider() with empty array
// - addGenerator() with non-function
```

---

## Advanced Patterns

### Database seed script

```js
const pecfill = require('pecfill');

pecfill.seed('my-app-v1'); // same data every time you run the seed

const users = pecfill.many({
  id: 'uuid',
  email: 'email',
  name: 'fullName',
  role: () => pecfill.fromArray(['user', 'admin']),
  createdAt: 'created_at',
}, 100);

const products = pecfill.many({
  id: 'uuid',
  sku: () => pecfill.nanoid(10).toUpperCase(),
  name: 'product',
  price: 'price',
  stock: () => pecfill.integer(0, 500),
}, 50);

console.log(`Seeding ${users.length} users and ${products.length} products...`);
// await db.insert(users)
// await db.insert(products)
```

### API mock server

```js
const http = require('http');
const pecfill = require('pecfill');

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/users') {
    const users = pecfill.many({
      id: 'uuid',
      name: 'fullName',
      email: 'email',
      avatar: () => `https://i.pravatar.cc/150?u=${pecfill.nanoid(6)}`,
    }, 10);
    res.end(JSON.stringify(users));
  }
});

server.listen(3001);
```

### CI pipeline fixture factory

```js
// fixtures/factory.js
const pecfill = require('pecfill');

function createUser(overrides = {}) {
  return pecfill.person(overrides)
    .withEmail()
    .withPhone()
    .withId()
    .withTimestamps()
    .build();
}

function createAdmin(overrides = {}) {
  return createUser({ role: 'admin', ...overrides });
}

module.exports = { createUser, createAdmin };
```

---

## API Reference

| Method | Returns | Description |
|---|---|---|
| `seed(value)` | `pecfill` | Set PRNG seed (int or string) |
| `resetSeed()` | `pecfill` | Randomize seed from Date.now() |
| `generate(schema)` | `object` | Populate an object from schema |
| `many(schema, n)` | `object[]` | Generate N populated objects |
| `person(overrides?)` | `PecfillBuilder` | Fluent person builder |
| `business(overrides?)` | `PecfillBuilder` | Fluent company builder |
| `productBuilder(overrides?)` | `PecfillBuilder` | Fluent product builder |
| `addProvider(key, arr)` | `pecfill` | Override internal data pool |
| `removeProvider(key)` | `pecfill` | Restore default data pool |
| `addGenerator(name, fn)` | `pecfill` | Register custom generator |
| `pick(arr)` | `T` | Random element from array |
| `shuffle(arr)` | `T[]` | Shuffled copy of array |
| `sample(arr, n)` | `T[]` | N unique elements from array |

---

## License

MIT © [Peculiar](https://github.com/peculiar)
