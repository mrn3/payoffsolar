#!/usr/bin/env node
/**
 * Import JD To-Do list #2 — Waaree 585 (580w) and DMEGC 460 (405w/440w) panels.
 * Usage:
 *   node scripts/import-jd-orders-2.js           # dry-run (validate)
 *   node scripts/import-jd-orders-2.js --apply   # insert into DB
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const APPLY = process.argv.includes('--apply');

const PRODUCT_SLUGS = {
  waaree: 'waaree-585-watt-bifacial-solar-panel-bin-08-585',
  dmegc:  'dmegc-460-watt-bifacial-solar-panels-dm460m10rt-b54hbt-l',
};
const UNIT_PRICE   = 200.00;
const ORDER_STATUS = 'Proposed';
const IMPORT_NOTE  = 'Imported from JD';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT     = 'PayoffSolar-JDImport/1.0';
const DELAY_MS       = 1100;

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

// product: 'waaree' = Waaree 585 Watt Bifacial  (580w or plain "Waree/Waaree")
//          'dmegc'  = DMEGC 460 Watt Bifacial   (405w / 440w)
const ROWS = [
  { name: 'Alex JD',           qty:  1, product: 'waaree', locationHint: 'Anchorage, AK',                phone: '907-227-1046',      notes: '580w' },
  { name: 'Daniel JD',         qty:  1, product: 'waaree', locationHint: 'Soldotna, AK',                 phone: '',                  notes: '580w' },
  { name: 'Alok Gwali JD',     qty: 10, product: 'waaree', locationHint: '',                              phone: '907-744-4231',      notes: '10 panels 580w' },
  { name: 'Andrei JD',         qty:  4, product: 'dmegc',  locationHint: 'Anchorage, AK',                phone: '907-205-2728',      notes: '4 panels 405w' },
  { name: 'Larry Wilmarth JD', qty:  1, product: 'waaree', locationHint: '',                              phone: '907-440-2007',      notes: '' },
  { name: 'Ed JD',             qty: 10, product: 'dmegc',  locationHint: 'Anchorage, AK',                phone: '+1 (907) 230-7265', notes: '10 panels; 440 or 405w' },
  { name: 'Frank Horizons JD', qty:  3, product: 'waaree', locationHint: 'Wasilla, AK',                  phone: '',                  notes: '3 Waaree' },
  { name: 'Wilbert JD',        qty:  8, product: 'waaree', locationHint: 'Wasilla, AK',                  phone: '907-631-1177',      notes: '8 waree' },
  { name: 'Andrei Nikolav JD', qty:  2, product: 'dmegc',  locationHint: 'Anchorage, AK',                phone: '',                  notes: '2 panels 405w' },
  { name: 'Shy JD',            qty:  4, product: 'waaree', locationHint: 'Girdwood, AK',                 phone: '',                  notes: '4 panels 580w', cityOverride: 'Girdwood' },
  { name: 'Marcus JD',         qty:  2, product: 'dmegc',  locationHint: 'Matanuska-Susitna Valley, AK', phone: '',                  notes: '2 panels 405w; The Valley' },
  { name: 'Brittany JD',       qty:  3, product: 'waaree', locationHint: 'Wasilla, AK',                  phone: '',                  notes: '3 panels 580w' },
  { name: 'Reece JD',          qty:  1, product: 'waaree', locationHint: 'Anchorage, AK',                phone: '',                  notes: "1 panel 580w; 440's" },
  { name: 'Eric Jewkes JD',    qty:  2, product: 'waaree', locationHint: 'Fairbanks, AK',                phone: '+1 (907) 388-9891', notes: '' },
  { name: 'Rob JD',            qty:  2, product: 'waaree', locationHint: 'Homer, AK',                    phone: '+1 (303) 907-0643', notes: '2 panels 580w' },
  { name: 'Brian JD',          qty: 20, product: 'waaree', locationHint: 'Anchorage, AK',                phone: '1 (907) 602-9022',  notes: '20 panels 580w' },
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function uuid()    { return crypto.randomUUID(); }
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
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

async function geocodeDetailed(query) {
  const trimmed = (query || '').trim();
  if (!trimmed) return null;
  const url = `${NOMINATIM_BASE}?${new URLSearchParams({
    q: trimmed, format: 'json', limit: '1', addressdetails: '1', countrycodes: 'us',
  })}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const r = data[0];
  const a = r.address || {};
  const lat = parseFloat(r.lat);
  const lng = parseFloat(r.lon);
  const street = [a.house_number || '', a.road || a.pedestrian || a.path || ''].filter(Boolean).join(' ').trim();
  const city = a.city || a.town || a.village || a.hamlet || a.suburb || a.county || '';
  const state = stateCode(a.state || (a['ISO3166-2-lvl4'] || '').replace(/^US-/, '') || '');
  return {
    address: street, city, state, zip: a.postcode || '',
    latitude:  Number.isNaN(lat) ? null : lat,
    longitude: Number.isNaN(lng) ? null : lng,
    display_name: r.display_name || '',
  };
}

function buildContact(row, geo) {
  let addr = geo || { address: '', city: '', state: '', zip: '', latitude: null, longitude: null };
  if (row.cityOverride && addr) addr = { ...addr, city: row.cityOverride };
  const phoneDigits = cleanPhoneDigits(row.phone);
  const notesParts = [IMPORT_NOTE];
  if (row.notes) notesParts.push(row.notes);
  return {
    id: uuid(), name: row.name, email: '',
    phone: row.phone || '', phone_digits: phoneDigits || null,
    address: addr.address || '', city: addr.city || '', state: addr.state || '', zip: addr.zip || '',
    latitude: addr.latitude, longitude: addr.longitude,
    notes: notesParts.join(' | '),
  };
}


function printPlan(plans, products) {
  console.log('');
  console.log('=== IMPORT PLAN (JD list #2) ===');
  for (const [key, p] of Object.entries(products)) {
    console.log(`Product [${key}]: ${p ? `${p.name} [sku=${p.sku}, id=${p.id}]` : '(NOT FOUND)'}`);
  }
  console.log(`Order status: ${ORDER_STATUS}   Unit price: $${UNIT_PRICE.toFixed(2)}   Order date: ${todayDate()}`);
  console.log('');
  plans.forEach((p, i) => {
    const c = p.contact;
    const prod = products[p.productKey];
    console.log(`#${String(i + 1).padStart(2, ' ')}  ${c.name}  [${p.productKey}: ${prod ? prod.sku : 'NOT FOUND'}]`);
    console.log(`     phone: ${c.phone || '(none)'}${c.phone && !isValidPhone(c.phone) ? '  [INVALID FORMAT]' : ''}`);
    console.log(`     address: ${[c.address, c.city, c.state, c.zip].filter(Boolean).join(', ') || '(none)'}`);
    console.log(`     lat/lng: ${c.latitude ?? '-'}, ${c.longitude ?? '-'}`);
    console.log(`     order:  qty=${p.qty}  total=$${(p.qty * UNIT_PRICE).toFixed(2)}`);
    console.log(`     notes:  ${c.notes}`);
    if (p.geocodeDisplay) console.log(`     geocoded: ${p.geocodeDisplay}`);
    if (p.geocodeFailed)  console.log(`     [WARN] geocode returned no result for: "${p.locationHint}"`);
    console.log('');
  });
}

async function main() {
  let connection;
  const products = { waaree: null, dmegc: null };

  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    });
    for (const [key, slug] of Object.entries(PRODUCT_SLUGS)) {
      const [rows] = await connection.execute(
        'SELECT id, name, sku, slug FROM products WHERE slug = ? LIMIT 1', [slug]
      );
      products[key] = rows[0] || null;
      if (products[key]) {
        console.log(`Found [${key}]: ${products[key].name} (sku=${products[key].sku})`);
      } else {
        console.error(`[ERROR] Product not found for slug [${key}]: ${slug}`);
      }
    }
  } catch (err) {
    if (APPLY) throw err;
    console.warn(`[WARN] DB connect failed: ${err.message}`);
  }

  if (APPLY && Object.values(products).some((p) => !p)) {
    console.error('[ERROR] One or more products missing. Aborting.');
    if (connection) await connection.end();
    process.exit(2);
  }

  const plans = [];
  for (let i = 0; i < ROWS.length; i++) {
    const row = ROWS[i];
    let geo = null;
    let display = '';
    if (row.locationHint) {
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
      productKey: row.product,
      locationHint: row.locationHint,
      contact: buildContact(row, geo),
      geocodeDisplay: display,
      geocodeFailed: Boolean(row.locationHint) && !geo,
    });
  }

  printPlan(plans, products);

  if (!APPLY) {
    console.log('Dry run only. Re-run with --apply to insert.');
    if (connection) await connection.end();
    return;
  }

  const orderDate = todayDate();
  let inserted = 0;
  for (const p of plans) {
    const c = p.contact;
    const prod = products[p.productKey];
    await connection.execute(
      `INSERT INTO contacts (id, name, email, phone, phone_digits, address, city, state, zip, latitude, longitude, notes, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [c.id, c.name, c.email, c.phone, c.phone_digits, c.address, c.city, c.state, c.zip, c.latitude, c.longitude, c.notes]
    );
    const orderId = uuid();
    const total = p.qty * UNIT_PRICE;
    await connection.execute(
      `INSERT INTO orders (id, contact_id, status, total, order_date, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [orderId, c.id, ORDER_STATUS, total, orderDate, IMPORT_NOTE]
    );
    await connection.execute(
      `INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)`,
      [uuid(), orderId, prod.id, p.qty, UNIT_PRICE]
    );
    inserted++;
    console.log(`[${inserted}/${plans.length}] inserted ${c.name} (contact=${c.id}, order=${orderId})`);
  }

  console.log(`Done. Inserted ${inserted} contacts/orders.`);
  await connection.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
