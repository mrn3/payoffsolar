#!/usr/bin/env node

/**
 * Backfill orders.affiliate_code_id using Stripe payment intent metadata.
 *
 * This script:
 *  - Finds orders with NULL affiliate_code_id but with a Stripe Payment ID in notes
 *  - Retrieves each payment intent from Stripe
 *  - Reads metadata.affiliate_code_id (and falls back to metadata.affiliate_code)
 *  - Updates orders.affiliate_code_id so the dashboard can list orders by affiliate code
 */

const mysql = require('mysql2/promise');
const Stripe = require('stripe');

// Load environment variables from .env.local first, then .env as fallback
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey || stripeSecretKey === 'your-stripe-secret-key') {
  console.error('Stripe is not properly configured. Please set STRIPE_SECRET_KEY in your .env/.env.local file.');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-05-28.basil',
});

function extractPaymentIntentId(notes) {
  if (!notes) return null;
  const match = notes.match(/Payment ID:\s*([^,\n\r]+)/);
  return match ? match[1].trim() : null;
}

async function backfillAffiliateCodeOrders() {
  let connection;

  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'payoffsolar',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
    });

    console.log('Connected to MySQL database');

    const [orders] = await connection.execute(
      `SELECT id, notes
       FROM orders
       WHERE affiliate_code_id IS NULL
         AND notes LIKE '%Payment ID:%'
       ORDER BY created_at ASC`
    );

    console.log(`Found ${orders.length} orders with a Payment ID in notes and no affiliate_code_id`);

    if (orders.length === 0) {
      console.log('Nothing to backfill.');
      return;
    }

    let updatedCount = 0;
    let skippedNoPaymentId = 0;
    let skippedNoAffiliate = 0;

    for (const order of orders) {
      const paymentIntentId = extractPaymentIntentId(order.notes);

      if (!paymentIntentId) {
        skippedNoPaymentId++;
        console.warn(`Skipping order ${order.id}: could not extract payment intent ID from notes`);
        continue;
      }

      console.log(`Processing order ${order.id} (payment intent ${paymentIntentId})`);

      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      } catch (err) {
        console.error(`Error retrieving payment intent ${paymentIntentId} for order ${order.id}:`, err.message);
        continue;
      }

      const metadata = paymentIntent.metadata || {};
      let affiliateCodeId = metadata.affiliate_code_id || null;
      const affiliateCode = metadata.affiliate_code || null;

      // Fallback: if we only have the affiliate code string, resolve it to an ID
      if (!affiliateCodeId && affiliateCode) {
        const [rows] = await connection.execute(
          'SELECT id FROM affiliate_codes WHERE code = ? LIMIT 1',
          [affiliateCode]
        );
        if (rows.length > 0) {
          affiliateCodeId = rows[0].id;
          console.log(`Resolved affiliate code ${affiliateCode} to ID ${affiliateCodeId}`);
        }
      }

      if (!affiliateCodeId) {
        skippedNoAffiliate++;
        console.log(
          `Order ${order.id}: payment intent ${paymentIntentId} has no affiliate_code_id or resolvable affiliate_code; skipping`
        );
        continue;
      }

      await connection.execute(
        'UPDATE orders SET affiliate_code_id = ? WHERE id = ? AND affiliate_code_id IS NULL',
        [affiliateCodeId, order.id]
      );

      updatedCount++;
      console.log(
        `✅ Updated order ${order.id} with affiliate_code_id ${affiliateCodeId}` +
          (affiliateCode ? ` (code ${affiliateCode})` : '')
      );
    }

    console.log('\nBackfill complete.');
    console.log(`Updated orders: ${updatedCount}`);
    console.log(`Skipped (no payment intent ID in notes): ${skippedNoPaymentId}`);
    console.log(`Skipped (no affiliate code on payment intent): ${skippedNoAffiliate}`);
  } catch (error) {
    console.error('Error during backfill:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('MySQL connection closed');
    }
  }
}

backfillAffiliateCodeOrders();

