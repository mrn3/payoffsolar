#!/usr/bin/env node

/**
 * Backfill contact latitude/longitude using OpenStreetMap Nominatim.
 *
 * - Selects contacts where latitude IS NULL and address parts are present
 * - Geocodes each (1 request per second to respect Nominatim policy)
 * - Updates contact with latitude, longitude
 *
 * Run after adding latitude/longitude columns: node scripts/backfill-contact-coordinates.js
 */

const mysql = require('mysql2/promise');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'PayoffSolar-Backfill/1.0 (contact-coordinates)';
const DELAY_MS = 1100;

function buildAddressQuery(row) {
  const parts = [row.address, row.city, row.state, row.zip].filter(Boolean).map((s) => String(s).trim());
  return parts.join(', ');
}

async function geocodeAddress(addressQuery) {
  const trimmed = addressQuery?.trim();
  if (!trimmed) return null;
  const url = `${NOMINATIM_BASE}?${new URLSearchParams({ q: trimmed, format: 'json', limit: '1' })}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function backfill() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'payoffsolar',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    });

    const [rows] = await connection.execute(
      `SELECT id, name, address, city, state, zip
       FROM contacts
       WHERE latitude IS NULL
         AND (TRIM(COALESCE(address,'')) != '' OR TRIM(COALESCE(city,'')) != '' OR TRIM(COALESCE(state,'')) != '')
       ORDER BY updated_at ASC`
    );

    console.log(`Found ${rows.length} contacts without coordinates to geocode.`);

    let updated = 0;
    let failed = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const query = buildAddressQuery(row);
      if (!query) {
        console.log(`[${i + 1}/${rows.length}] Skip ${row.id} (no address parts)`);
        continue;
      }
      try {
        const coords = await geocodeAddress(query);
        if (coords) {
          await connection.execute(
            'UPDATE contacts SET latitude = ?, longitude = ? WHERE id = ?',
            [coords.lat, coords.lng, row.id]
          );
          updated++;
          console.log(`[${i + 1}/${rows.length}] ${row.id} -> ${coords.lat}, ${coords.lng}`);
        } else {
          failed++;
          console.log(`[${i + 1}/${rows.length}] ${row.id} -> no result`);
        }
      } catch (err) {
        failed++;
        console.error(`[${i + 1}/${rows.length}] ${row.id} error:`, err.message);
      }
      if (i < rows.length - 1) await sleep(DELAY_MS);
    }

    console.log(`Done. Updated: ${updated}, failed/no result: ${failed}`);
  } finally {
    if (connection) await connection.end();
  }
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
