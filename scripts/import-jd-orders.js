#!/usr/bin/env node

/**
 * Import "JD" To-Do list of customers + Waaree 585 panel orders.
 *
 * Usage:
 *   node scripts/import-jd-orders.js                # validate (no writes): geocode + look up product + print plan
 *   node scripts/import-jd-orders.js --apply        # actually insert contacts/orders/order_items
 *
 * Notes:
 * - Geocoding uses OpenStreetMap Nominatim with addressdetails=1 (no API key needed),
 *   throttled to 1.1s/request per Nominatim policy.
 * - Product is looked up by slug: waaree-585-watt-bifacial-solar-panel-bin-08-585
 * - Each order: status=proposed, order_date=today (script run date), unit price=$200,
 *   total = qty * $200. All contacts tagged with note: "Imported from JD".
 * - Always creates new contacts (no dedup) per the request.
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const APPLY = process.argv.includes('--apply');

const PRODUCT_SLUG = 'waaree-585-watt-bifacial-solar-panel-bin-08-585';
const UNIT_PRICE = 200.00;
const ORDER_STATUS = 'Proposed';
const IMPORT_NOTE = 'Imported from JD';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'PayoffSolar-JDImport/1.0';
const DELAY_MS = 1100;

const STATE_NAME_TO_CODE = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI',
  wyoming: 'WY',
};

// Source rows parsed from the JD To-Do screenshot (confirmed with user).
// staticAddress: skip geocoding; use these fields directly.
// cityOverride:  keep geocode for lat/lng but replace the returned city with this value.
const ROWS = [
  { name: 'Jonathan JD',   qty: 8,  locationHint: 'West Jordan, UT',  phone: '',                notes: 'Next Friday; originally from Nevada' },
  { name: 'Brad Hays JD',  qty: 12, locationHint: 'Fishhook, AK',     phone: '+1 (907) 317-8419', notes: 'Quantity range was 10-12; taking upper', cityOverride: 'Fishhook' },
  { name: 'Danny JD',      qty: 2,  locationHint: 'Palmer, AK',       phone: '(907) 863-0752',  notes: '' },
  { name: 'Barry JD',      qty: 16, locationHint: 'Wasilla, AK',      phone: '(907) 980-3351',  notes: 'Nathan Jackson' },
  { name: 'Cael JD',       qty: 4,  locationHint: '',                 phone: '',                notes: '' },
  { name: 'Ed JD',         qty: 10, locationHint: '',                 phone: '(907) 230-7265',  notes: '',
    staticAddress: { address: '460 Esther', city: '', state: 'AK', zip: '', latitude: null, longitude: null } },
  { name: 'Thomas JD',     qty: 5,  locationHint: 'Susitna, AK',      phone: '(907) 715-7092',  notes: 'Quantity range was 2-5; taking upper', cityOverride: 'Susitna' },
  { name: 'Todd JD',       qty: 2,  locationHint: 'Kenai, AK',        phone: '',                notes: 'Number not yet obtained' },
  { name: 'Gary JD',       qty: 4,  locationHint: 'Chugiak, AK',      phone: '',                notes: '', cityOverride: 'Chugiak' },
  { name: 'John JD',       qty: 3,  locationHint: '',                 phone: '(907) 980-5146',  notes: '',
    staticAddress: { address: '15805 E Riverside Dr', city: 'Palmer', state: 'AK', zip: '', latitude: null, longitude: null } },
  { name: 'Thomas JD',     qty: 5,  locationHint: '',                 phone: '',                notes: 'Different Thomas than the Susitna one' },
  { name: 'Weston JD',     qty: 2,  locationHint: 'Anchorage, AK',    phone: '+1 (907) 854-2641', notes: '' },
  { name: 'Rusty Cox JD',  qty: 2,  locationHint: 'Willow, AK',       phone: '',                notes: 'Asked which panels', cityOverride: 'Willow' },
  { name: 'Kelly Hill JD', qty: 5,  locationHint: 'Anchorage, AK',    phone: '(907) 444-7031',  notes: '580W panels mentioned' },
  { name: 'Max JD',        qty: 8,  locationHint: '',                 phone: '',                notes: '',
    staticAddress: { address: 'Knik Road', city: '', state: 'AK', zip: '', latitude: null, longitude: null } },
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function cleanPhoneDigits(p) { return (p || '').replace(/\D/g, ''); }

function isValidPhone(p) {
  const d = cleanPhoneDigits(p);
  return d.length === 10 || (d.length === 11 && d.startsWith('1'));
}

function stateCode(s) {
  if (!s) return '';
  const v = String(s).trim();
  if (v.length === 2) return v.toUpperCase();
  return STATE_NAME_TO_CODE[v.toLowerCase()] || '';
}

function todayDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function geocodeDetailed(query) {
  const trimmed = (query || '').trim();
  if (!trimmed) return null;
  const url = `${NOMINATIM_BASE}?${new URLSearchParams({
    q: trimmed,
    format: 'json',
    limit: '1',
    addressdetails: '1',
    countrycodes: 'us',
  })}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const r = data[0];
  const a = r.address || {};
  const lat = parseFloat(r.lat);
  const lng = parseFloat(r.lon);
  const houseNumber = a.house_number || '';
  const road = a.road || a.pedestrian || a.path || '';
  const street = [houseNumber, road].filter(Boolean).join(' ').trim();
  const city = a.city || a.town || a.village || a.hamlet || a.suburb || a.county || '';
  const state = stateCode(a.state || a['ISO3166-2-lvl4']?.replace(/^US-/, '') || '');
  const zip = a.postcode || '';
  return {
    address: street,
    city,
    state,
    zip,
    latitude: Number.isNaN(lat) ? null : lat,
    longitude: Number.isNaN(lng) ? null : lng,
    display_name: r.display_name || '',
  };
}

function uuid() { return crypto.randomUUID(); }



function buildContact(row, geo) {
  // staticAddress rows bypass geocoding entirely.
  // cityOverride rows use geocode for lat/lng but substitute the city.
  let addr;
  if (row.staticAddress) {
    addr = row.staticAddress;
  } else {
    addr = geo || { address: '', city: '', state: '', zip: '', latitude: null, longitude: null };
    if (row.cityOverride && addr) addr = { ...addr, city: row.cityOverride };
  }
  const phoneDigits = cleanPhoneDigits(row.phone);
  const notesParts = [IMPORT_NOTE];
  if (row.notes) notesParts.push(row.notes);
  return {
    id: uuid(),
    name: row.name,
    email: '',
    phone: row.phone || '',
    phone_digits: phoneDigits || null,
    address: addr.address || '',
    city: addr.city || '',
    state: addr.state || '',
    zip: addr.zip || '',
    latitude: addr.latitude,
    longitude: addr.longitude,
    notes: notesParts.join(' | '),
  };
}

function printPlan(plans, productInfo) {
  console.log('');
  console.log('=== IMPORT PLAN (Waaree 585 panels) ===');
  console.log(`Product: ${productInfo ? `${productInfo.name} [sku=${productInfo.sku}, id=${productInfo.id}]` : '(NOT FOUND)'}`);
  console.log(`Order status: ${ORDER_STATUS}   Unit price: $${UNIT_PRICE.toFixed(2)}   Order date: ${todayDate()}`);
  console.log('');
  plans.forEach((p, i) => {
    const c = p.contact;
    console.log(`#${String(i + 1).padStart(2, ' ')}  ${c.name}`);
    console.log(`     phone: ${c.phone || '(none)'}${c.phone && !isValidPhone(c.phone) ? '  [INVALID FORMAT]' : ''}`);
    console.log(`     address: ${[c.address, c.city, c.state, c.zip].filter(Boolean).join(', ') || '(none)'}`);
    console.log(`     lat/lng: ${c.latitude ?? '-'}, ${c.longitude ?? '-'}`);
    console.log(`     order:  qty=${p.qty}  total=$${(p.qty * UNIT_PRICE).toFixed(2)}`);
    console.log(`     notes:  ${c.notes}`);
    if (p.staticAddress) console.log(`     [static address — no geocode]`);
    else if (p.geocodeDisplay) console.log(`     geocoded: ${p.geocodeDisplay}`);
    if (p.geocodeFailed) console.log(`     [WARN] geocode returned no result for hint: "${p.locationHint}"`);
    console.log('');
  });
}

async function main() {
  let connection;
  let product = null;
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'payoffsolar',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    });
    const [rows] = await connection.execute(
      'SELECT id, name, sku, slug, price FROM products WHERE slug = ? LIMIT 1',
      [PRODUCT_SLUG]
    );
    product = rows[0] || null;
    if (!product) {
      console.error(`[ERROR] Product slug not found: ${PRODUCT_SLUG}`);
      if (APPLY) { await connection.end(); process.exit(2); }
    } else {
      console.log(`Found product: ${product.name} (sku=${product.sku}, id=${product.id})`);
    }
  } catch (err) {
    if (APPLY) throw err;
    console.warn(`[WARN] Could not connect to DB for product lookup: ${err.message}`);
  }

  const plans = [];
  for (let i = 0; i < ROWS.length; i++) {
    const row = ROWS[i];
    let geo = null;
    let display = '';
    // Skip geocoding for rows with a static address or no location hint.
    if (!row.staticAddress && row.locationHint) {
      try {
        geo = await geocodeDetailed(row.locationHint);
        if (geo) display = geo.display_name;
      } catch (err) {
        console.warn(`[WARN] geocode error for "${row.locationHint}": ${err.message}`);
      }
      if (i < ROWS.length - 1) await sleep(DELAY_MS);
    }
    plans.push({
      qty: row.qty,
      locationHint: row.locationHint,
      staticAddress: !!row.staticAddress,
      contact: buildContact(row, geo),
      geocodeDisplay: display,
      geocodeFailed: !row.staticAddress && Boolean(row.locationHint) && !geo,
    });
  }

  printPlan(plans, product);

  if (!APPLY) {
    console.log('Dry run only. Re-run with --apply to insert into the database.');
    if (connection) await connection.end();
    return;
  }

  if (!product) {
    console.error('[ERROR] Cannot apply without product. Aborting.');
    await connection.end();
    process.exit(2);
  }

  const orderDate = todayDate();
  let inserted = 0;
  for (const p of plans) {
    const c = p.contact;
    await connection.execute(
      `INSERT INTO contacts (id, name, email, phone, phone_digits, address, city, state, zip, latitude, longitude, notes, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [c.id, c.name, c.email, c.phone, c.phone_digits, c.address, c.city, c.state, c.zip, c.latitude, c.longitude, c.notes]
    );
    const orderId = uuid();
    const total = p.qty * UNIT_PRICE;
    await connection.execute(
      `INSERT INTO orders (id, contact_id, status, total, order_date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orderId, c.id, ORDER_STATUS, total, orderDate, IMPORT_NOTE]
    );
    await connection.execute(
      `INSERT INTO order_items (id, order_id, product_id, quantity, price)
       VALUES (?, ?, ?, ?, ?)`,
      [uuid(), orderId, product.id, p.qty, UNIT_PRICE]
    );
    inserted++;
    console.log(`[${inserted}/${plans.length}] inserted ${c.name} (contact=${c.id}, order=${orderId})`);
  }

  console.log(`Done. Inserted ${inserted} contacts/orders.`);
  await connection.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
