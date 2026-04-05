#!/usr/bin/env node

/**
 * Generate Profit & Loss report for the solar business
 * This script queries the database to generate a P&L statement breaking down
 * revenue and expenses (COGS and other expenses) by cost category
 */

const mysql = require('mysql2/promise');

async function generatePLReport() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'password',
      database: process.env.MYSQL_DATABASE || 'payoffsolar'
    });

    console.log('Connected to database\n');
    console.log('='.repeat(80));
    console.log('PROFIT & LOSS STATEMENT');
    console.log('Solar Business');
    console.log('='.repeat(80));
    console.log();

    // Get all cost categories
    const [categories] = await connection.execute(
      'SELECT * FROM cost_categories ORDER BY name'
    );

    console.log('Available Cost Categories:');
    console.log('-'.repeat(80));
    for (const cat of categories) {
      console.log(`- ${cat.name} (${cat.description || 'No description'}) - ${cat.is_active ? 'Active' : 'Inactive'}`);
    }
    console.log();

    // Get revenue by year for complete orders
    const [revenueByYear] = await connection.execute(`
      SELECT 
        YEAR(order_date) as year,
        COUNT(*) as order_count,
        SUM(total) as total_revenue
      FROM orders 
      WHERE status = 'complete'
      GROUP BY YEAR(order_date)
      ORDER BY year DESC
    `);

    console.log('REVENUE (Completed Orders Only):');
    console.log('-'.repeat(80));
    let totalRevenue = 0;
    for (const row of revenueByYear) {
      const revenue = parseFloat(row.total_revenue || 0);
      totalRevenue += revenue;
      console.log(`${row.year}: $${revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${row.order_count} orders)`);
    }
    console.log('-'.repeat(80));
    console.log(`TOTAL REVENUE: $${totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log();

    // Get cost breakdown by category for all years
    const [costsByCategory] = await connection.execute(`
      SELECT 
        cc.name as category_name,
        cc.description,
        SUM(ci.amount) as total_amount,
        COUNT(DISTINCT ci.order_id) as order_count
      FROM cost_items ci
      INNER JOIN cost_categories cc ON ci.category_id = cc.id
      INNER JOIN orders o ON ci.order_id = o.id
      WHERE o.status = 'complete'
      GROUP BY cc.id, cc.name, cc.description
      ORDER BY total_amount DESC
    `);

    console.log('EXPENSES BY CATEGORY (Completed Orders Only):');
    console.log('-'.repeat(80));
    let totalExpenses = 0;
    const expensesByCategory = {};
    
    for (const row of costsByCategory) {
      const amount = parseFloat(row.total_amount || 0);
      totalExpenses += amount;
      expensesByCategory[row.category_name] = amount;
      console.log(`${row.category_name}: $${amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${row.order_count} orders)`);
      if (row.description) {
        console.log(`  Description: ${row.description}`);
      }
    }
    console.log('-'.repeat(80));
    console.log(`TOTAL EXPENSES: $${totalExpenses.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log();

    // Get cost breakdown by category and year
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
      ORDER BY year DESC, total_amount DESC
    `);

    console.log('EXPENSES BY YEAR AND CATEGORY:');
    console.log('-'.repeat(80));
    let currentYear = null;
    let yearTotal = 0;
    
    for (const row of costsByYearAndCategory) {
      if (currentYear !== row.year) {
        if (currentYear !== null) {
          console.log(`  Year ${currentYear} Total: $${yearTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
          console.log();
        }
        currentYear = row.year;
        yearTotal = 0;
        console.log(`Year ${row.year}:`);
      }
      const amount = parseFloat(row.total_amount || 0);
      yearTotal += amount;
      console.log(`  ${row.category_name}: $${amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    }
    
    if (currentYear !== null) {
      console.log(`  Year ${currentYear} Total: $${yearTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    }
    console.log();

    // Calculate gross profit
    const grossProfit = totalRevenue - totalExpenses;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    console.log('='.repeat(80));
    console.log('SUMMARY:');
    console.log('-'.repeat(80));
    console.log(`Total Revenue:    $${totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`Total Expenses:   $${totalExpenses.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`Gross Profit:     $${grossProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`Gross Margin:     ${grossMargin.toFixed(2)}%`);
    console.log('='.repeat(80));
    console.log();

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
