#!/usr/bin/env node

/**
 * Generate Profit & Loss report for accountant
 * This script generates a proper P&L statement with COGS separated from operating expenses
 */

const mysql = require('mysql2/promise');

// Define which cost categories are COGS vs Operating Expenses
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
  'Shipping', // Cost to ship product to customer
];

const OPERATING_EXPENSE_CATEGORIES = [
  'American Warehouse', // Warehousing
  'Isaac Warehouse',
  'Stripe Fee', // Payment processing
  'StellaVolta', // Website/platform fees
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

// Matt Profit should be excluded from expenses as it represents the actual profit
const EXCLUDED_CATEGORIES = [
  'Matt Profit',
];

const DELIVERY_CATEGORIES = [
  'Kevin Delivery',
  'Dominique Delivery',
  'Hunter Delivery',
  'JD Delivery',
];

async function generatePLReport() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'password',
      database: process.env.MYSQL_DATABASE || 'payoffsolar'
    });

    console.log('Connected to database\n');
    
    // Get revenue and costs by year
    const [revenueByYear] = await connection.execute(`
      SELECT 
        YEAR(order_date) as year,
        COUNT(*) as order_count,
        SUM(total) as total_revenue
      FROM orders 
      WHERE status = 'complete'
      GROUP BY YEAR(order_date)
      ORDER BY year
    `);

    const [costsByYearAndCategory] = await connection.execute(`
      SELECT 
        YEAR(o.order_date) as year,
        cc.name as category_name,
        SUM(ci.amount) as total_amount
      FROM cost_items ci
      INNER JOIN cost_categories cc ON ci.category_id = cc.id
      INNER JOIN orders o ON ci.order_id = o.id
      WHERE o.status = 'complete'
      GROUP BY YEAR(o.order_date), cc.id, cc.name
      ORDER BY year, total_amount DESC
    `);

    // Organize data by year
    const yearlyData = {};
    
    for (const row of revenueByYear) {
      yearlyData[row.year] = {
        revenue: parseFloat(row.total_revenue || 0),
        orderCount: row.order_count,
        cogs: {},
        opex: {},
        commissions: {},
        delivery: {},
      };
    }

    for (const row of costsByYearAndCategory) {
      if (!yearlyData[row.year]) continue;

      const amount = parseFloat(row.total_amount || 0);
      const category = row.category_name;

      // Skip excluded categories (like Matt Profit which is the actual profit, not an expense)
      if (EXCLUDED_CATEGORIES.includes(category)) {
        continue;
      }

      if (COGS_CATEGORIES.includes(category)) {
        yearlyData[row.year].cogs[category] = amount;
      } else if (OPERATING_EXPENSE_CATEGORIES.includes(category)) {
        yearlyData[row.year].opex[category] = amount;
      } else if (COMMISSION_CATEGORIES.includes(category)) {
        yearlyData[row.year].commissions[category] = amount;
      } else if (DELIVERY_CATEGORIES.includes(category)) {
        yearlyData[row.year].delivery[category] = amount;
      } else {
        yearlyData[row.year].opex[category] = amount; // Default to OPEX
      }
    }

    // Generate report for each year
    const years = Object.keys(yearlyData).sort();
    
    for (const year of years) {
      const data = yearlyData[year];
      
      console.log('='.repeat(80));
      console.log(`PROFIT & LOSS STATEMENT - ${year}`);
      console.log('Solar Business');
      console.log('='.repeat(80));
      console.log();
      
      // Revenue
      console.log('REVENUE:');
      console.log(`  Sales Revenue (${data.orderCount} completed orders)  $${data.revenue.toFixed(2)}`);
      console.log('  '.padEnd(60, '-'));
      console.log(`  Total Revenue:  $${data.revenue.toFixed(2)}`);
      console.log();
      
      // COGS
      console.log('COST OF GOODS SOLD (COGS):');
      let totalCOGS = 0;
      const cogsEntries = Object.entries(data.cogs).sort((a, b) => b[1] - a[1]);
      for (const [category, amount] of cogsEntries) {
        console.log(`  ${category.padEnd(50)}  $${amount.toFixed(2)}`);
        totalCOGS += amount;
      }
      console.log('  '.padEnd(60, '-'));
      console.log(`  Total COGS:  $${totalCOGS.toFixed(2)}`);
      console.log();

      // Gross Profit
      const grossProfit = data.revenue - totalCOGS;
      const grossMargin = data.revenue > 0 ? (grossProfit / data.revenue) * 100 : 0;
      console.log(`GROSS PROFIT:  $${grossProfit.toFixed(2)} (${grossMargin.toFixed(2)}%)`);
      console.log();

      // Operating Expenses - Delivery/Installation
      console.log('OPERATING EXPENSES:');
      console.log();
      console.log('  Delivery & Installation:');
      let totalDelivery = 0;
      const deliveryEntries = Object.entries(data.delivery).sort((a, b) => b[1] - a[1]);
      for (const [category, amount] of deliveryEntries) {
        console.log(`    ${category.padEnd(48)}  $${amount.toFixed(2)}`);
        totalDelivery += amount;
      }
      if (deliveryEntries.length > 0) {
        console.log(`    ${'Subtotal Delivery'.padEnd(48)}  $${totalDelivery.toFixed(2)}`);
      }
      console.log();

      // Commissions/Sales Expenses
      console.log('  Commissions & Sales Expenses:');
      let totalCommissions = 0;
      const commissionEntries = Object.entries(data.commissions).sort((a, b) => b[1] - a[1]);
      for (const [category, amount] of commissionEntries) {
        console.log(`    ${category.padEnd(48)}  $${amount.toFixed(2)}`);
        totalCommissions += amount;
      }
      if (commissionEntries.length > 0) {
        console.log(`    ${'Subtotal Commissions'.padEnd(48)}  $${totalCommissions.toFixed(2)}`);
      }
      console.log();

      // Other Operating Expenses
      console.log('  Other Operating Expenses:');
      let totalOpex = 0;
      const opexEntries = Object.entries(data.opex).sort((a, b) => b[1] - a[1]);
      for (const [category, amount] of opexEntries) {
        console.log(`    ${category.padEnd(48)}  $${amount.toFixed(2)}`);
        totalOpex += amount;
      }
      if (opexEntries.length > 0) {
        console.log(`    ${'Subtotal Other Operating Expenses'.padEnd(48)}  $${totalOpex.toFixed(2)}`);
      }
      console.log();

      const totalOperatingExpenses = totalDelivery + totalCommissions + totalOpex;
      console.log('  '.padEnd(60, '-'));
      console.log(`  Total Operating Expenses:  $${totalOperatingExpenses.toFixed(2)}`);
      console.log();

      // Net Income
      const netIncome = grossProfit - totalOperatingExpenses;
      const netMargin = data.revenue > 0 ? (netIncome / data.revenue) * 100 : 0;
      console.log('='.repeat(80));
      console.log(`NET INCOME:  $${netIncome.toFixed(2)} (${netMargin.toFixed(2)}%)`);
      console.log('='.repeat(80));
      console.log();
      console.log();
    }

    // Overall summary across all years
    console.log('='.repeat(80));
    console.log('OVERALL SUMMARY - ALL YEARS');
    console.log('='.repeat(80));
    console.log();

    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalDelivery = 0;
    let totalCommissions = 0;
    let totalOpex = 0;

    for (const year of years) {
      const data = yearlyData[year];
      totalRevenue += data.revenue;

      for (const amount of Object.values(data.cogs)) totalCOGS += amount;
      for (const amount of Object.values(data.delivery)) totalDelivery += amount;
      for (const amount of Object.values(data.commissions)) totalCommissions += amount;
      for (const amount of Object.values(data.opex)) totalOpex += amount;
    }

    const totalOperatingExpenses = totalDelivery + totalCommissions + totalOpex;
    const totalExpenses = totalCOGS + totalOperatingExpenses;
    const grossProfit = totalRevenue - totalCOGS;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netIncome = grossProfit - totalOperatingExpenses;
    const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    console.log(`Total Revenue:                    $${totalRevenue.toFixed(2)}`);
    console.log(`Total COGS:                       $${totalCOGS.toFixed(2)}`);
    console.log(`Gross Profit:                     $${grossProfit.toFixed(2)} (${grossMargin.toFixed(2)}%)`);
    console.log();
    console.log('Operating Expenses:');
    console.log(`  Delivery & Installation:        $${totalDelivery.toFixed(2)}`);
    console.log(`  Commissions & Sales:            $${totalCommissions.toFixed(2)}`);
    console.log(`  Other Operating Expenses:       $${totalOpex.toFixed(2)}`);
    console.log(`  Total Operating Expenses:       $${totalOperatingExpenses.toFixed(2)}`);
    console.log();
    console.log(`NET INCOME:                       $${netIncome.toFixed(2)} (${netMargin.toFixed(2)}%)`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error generating P&L report:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the report
generatePLReport();
