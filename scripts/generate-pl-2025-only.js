#!/usr/bin/env node
require('dotenv').config();
const mysql = require('mysql2/promise');

const COGS_CATEGORIES = [
  'Clear Energy Partners Materials',
  'Signature Solar Materials', 
  'Buy Cheap Solar Materials',
  'Brua Materials',
  'Greentech Renewables',
  'Israel Materials',
  'Todd Materials',
  'Angel Materials',
  'BigBattery Materials',
  'SanTan Materials',
  'Joseph Yokshas',
  'Royal Wholesale Electric',
  'Amazon Materials',
  'Shipping',
  'Freight',
];

const OPERATING_EXPENSE_CATEGORIES = [
  'American Warehouse',
  'Isaac Warehouse',
  'Stripe Fee',
  'StellaVolta',
  'Solar Wholesale',
];

const COMMISSION_CATEGORIES = [
  'JD Commission',
  'Kip Commission',
  'Paul Commission',
  'Charlie Commission',
  'Jeffrey Commission',
  'Ben Commission',
  'Sophie Commission',
  'James Commission',
  'Jade Commission',
  'Wade Commission',
  'Referral Payout',
];

const DELIVERY_CATEGORIES = [
  'Kevin Delivery',
  'Dominique Delivery',
  'Hunter Delivery',
  'JD Delivery',
];

const INSTALLATION_CATEGORIES = [
  'Israel Installation',
];

const EXCLUDED_CATEGORIES = [
  'Matt Profit',
];

async function generatePL2025() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'password',
      database: process.env.MYSQL_DATABASE || 'payoffsolar'
    });

    console.log('Connected to database\n');
    
    // Get revenue for 2025
    const [revenueData] = await connection.execute(`
      SELECT 
        COUNT(*) as order_count,
        SUM(total) as total_revenue
      FROM orders 
      WHERE status = 'complete'
        AND YEAR(order_date) = 2025
    `);

    // Get costs by category for 2025
    const [costsByCategory] = await connection.execute(`
      SELECT 
        cc.name as category_name,
        SUM(ci.amount) as total_amount
      FROM cost_items ci
      INNER JOIN cost_categories cc ON ci.category_id = cc.id
      INNER JOIN orders o ON ci.order_id = o.id
      WHERE o.status = 'complete'
        AND YEAR(o.order_date) = 2025
      GROUP BY cc.id, cc.name
      ORDER BY total_amount DESC
    `);

    const revenue = parseFloat(revenueData[0].total_revenue || 0);
    const orderCount = revenueData[0].order_count;

    // Categorize costs
    const cogs = {};
    const delivery = {};
    const commissions = {};
    const installation = {};
    const opex = {};

    for (const row of costsByCategory) {
      const amount = parseFloat(row.total_amount || 0);
      const category = row.category_name;

      if (EXCLUDED_CATEGORIES.includes(category)) {
        continue;
      }

      if (COGS_CATEGORIES.includes(category)) {
        cogs[category] = amount;
      } else if (DELIVERY_CATEGORIES.includes(category)) {
        delivery[category] = amount;
      } else if (COMMISSION_CATEGORIES.includes(category)) {
        commissions[category] = amount;
      } else if (INSTALLATION_CATEGORIES.includes(category)) {
        installation[category] = amount;
      } else if (OPERATING_EXPENSE_CATEGORIES.includes(category)) {
        opex[category] = amount;
      } else {
        opex[category] = amount;
      }
    }

    // Generate the report
    console.log('='.repeat(80));
    console.log('PROFIT & LOSS STATEMENT - 2025');
    console.log('Solar Business');
    console.log('Generated: ' + new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    console.log('='.repeat(80));
    console.log();
    
    // Revenue
    console.log('REVENUE:');
    console.log(`  Sales Revenue (${orderCount} completed orders)  $${revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log('  '.padEnd(75, '-'));
    console.log(`  Total Revenue:  $${revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log();
    
    // COGS
    console.log('COST OF GOODS SOLD (COGS):');
    let totalCOGS = 0;
    const cogsEntries = Object.entries(cogs).sort((a, b) => b[1] - a[1]);
    for (const [category, amount] of cogsEntries) {
      console.log(`  ${category.padEnd(50)}  $${amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
      totalCOGS += amount;
    }
    console.log('  '.padEnd(75, '-'));
    console.log(`  Total COGS:  $${totalCOGS.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log();

    // Gross Profit
    const grossProfit = revenue - totalCOGS;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    console.log(`GROSS PROFIT:  $${grossProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${grossMargin.toFixed(2)}%)`);
    console.log();

    // Operating Expenses
    console.log('OPERATING EXPENSES:');
    console.log();

    // Delivery & Installation
    console.log('  Delivery & Installation Labor:');
    let totalDelivery = 0;
    const deliveryEntries = Object.entries(delivery).sort((a, b) => b[1] - a[1]);
    for (const [category, amount] of deliveryEntries) {
      console.log(`    ${category.padEnd(48)}  $${amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
      totalDelivery += amount;
    }
    if (deliveryEntries.length > 0) {
      console.log(`    ${'Subtotal Delivery & Installation'.padEnd(48)}  $${totalDelivery.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    }
    console.log();

    // Commissions
    console.log('  Commissions & Sales Expenses:');
    let totalCommissions = 0;
    const commissionEntries = Object.entries(commissions).sort((a, b) => b[1] - a[1]);
    for (const [category, amount] of commissionEntries) {
      console.log(`    ${category.padEnd(48)}  $${amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
      totalCommissions += amount;
    }
    if (commissionEntries.length > 0) {
      console.log(`    ${'Subtotal Commissions'.padEnd(48)}  $${totalCommissions.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    }
    console.log();

    // Installation Services
    console.log('  Installation Services:');
    let totalInstallation = 0;
    const installationEntries = Object.entries(installation).sort((a, b) => b[1] - a[1]);
    for (const [category, amount] of installationEntries) {
      console.log(`    ${category.padEnd(48)}  $${amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
      totalInstallation += amount;
    }
    if (installationEntries.length > 0) {
      console.log(`    ${'Subtotal Installation Services'.padEnd(48)}  $${totalInstallation.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    }
    console.log();

    // Other Operating Expenses
    console.log('  Other Operating Expenses:');
    let totalOpex = 0;
    const opexEntries = Object.entries(opex).sort((a, b) => b[1] - a[1]);
    for (const [category, amount] of opexEntries) {
      console.log(`    ${category.padEnd(48)}  $${amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
      totalOpex += amount;
    }
    if (opexEntries.length > 0) {
      console.log(`    ${'Subtotal Other Operating Expenses'.padEnd(48)}  $${totalOpex.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    }
    console.log();

    const totalOperatingExpenses = totalDelivery + totalCommissions + totalInstallation + totalOpex;
    console.log('  '.padEnd(75, '-'));
    console.log(`  Total Operating Expenses:  $${totalOperatingExpenses.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log();

    // Net Income
    const netIncome = grossProfit - totalOperatingExpenses;
    const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
    console.log('='.repeat(80));
    console.log(`NET INCOME:  $${netIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${netMargin.toFixed(2)}%)`);
    console.log('='.repeat(80));
    console.log();

    console.log('NOTES:');
    console.log('-'.repeat(80));
    console.log('1. All figures are based on COMPLETED orders only (status = "complete")');
    console.log('   - Does not include proposed, pending, or cancelled orders');
    console.log();
    console.log('2. Revenue is total invoice amount collected from customers');
    console.log();
    console.log('3. COGS includes:');
    console.log('   - Direct material costs from all suppliers');
    console.log('   - Freight/shipping costs to deliver products to customers');
    console.log();
    console.log('4. Operating Expenses include:');
    console.log('   - Commissions paid to sales team and affiliates');
    console.log('   - Warehousing and storage costs');
    console.log('   - Delivery/installation labor costs');
    console.log('   - Installation services');
    console.log('   - Payment processing fees (Stripe)');
    console.log('   - Website/platform fees');
    console.log();
    console.log('5. "Matt Profit" category has been EXCLUDED from expenses');
    console.log('   This represents the actual business profit, not an operating expense');
    console.log();
    console.log('='.repeat(80));

    await connection.end();

  } catch (error) {
    console.error('Error generating P&L report:', error);
    if (connection) await connection.end();
    process.exit(1);
  }
}

generatePL2025();
