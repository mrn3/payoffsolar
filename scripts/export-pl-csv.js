#!/usr/bin/env node

/**
 * Export P&L data to CSV format for accountant
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Define which cost categories are COGS vs Operating Expenses
const CATEGORY_MAPPING = {
  'Clear Energy Partners Materials': 'COGS - Materials',
  'Signature Solar Materials': 'COGS - Materials',
  'Buy Cheap Solar Materials': 'COGS - Materials',
  'Brua Materials': 'COGS - Materials',
  'Greentech Renewables': 'COGS - Materials',
  'Israel Materials': 'COGS - Materials',
  'Todd Materials': 'COGS - Materials',
  'Angel Materials': 'COGS - Materials',
  'BigBattery Materials': 'COGS - Materials',
  'SanTan Materials': 'COGS - Materials',
  'Joseph Yokshas': 'COGS - Materials',
  'Royal Wholesale Electric': 'COGS - Materials',
  'Amazon Materials': 'COGS - Materials',
  'Shipping': 'COGS - Shipping',
  'American Warehouse': 'Operating Expense - Warehousing',
  'Isaac Warehouse': 'Operating Expense - Warehousing',
  'Stripe Fee': 'Operating Expense - Payment Processing',
  'StellaVolta': 'Operating Expense - Website/Platform',
  'Matt Profit': 'EXCLUDED - Business Profit',
  'JD Commission': 'Operating Expense - Commissions',
  'Kip Commission': 'Operating Expense - Commissions',
  'Paul Commission': 'Operating Expense - Commissions',
  'Charlie Commission': 'Operating Expense - Commissions',
  'Jeffrey Commission': 'Operating Expense - Commissions',
  'Ben Commission': 'Operating Expense - Commissions',
  'Sophie Commission': 'Operating Expense - Commissions',
  'James Commission': 'Operating Expense - Commissions',
  'Jade Commission': 'Operating Expense - Commissions',
  'Wade Commission': 'Operating Expense - Commissions',
  'Referral Payout': 'Operating Expense - Commissions',
  'Kevin Delivery': 'Operating Expense - Delivery',
  'Dominique Delivery': 'Operating Expense - Delivery',
  'Hunter Delivery': 'Operating Expense - Delivery',
  'JD Delivery': 'Operating Expense - Delivery',
  'Israel Installation': 'Operating Expense - Installation',
  'Solar Wholesale': 'Operating Expense - Labor',
};

async function exportPLtoCSV() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'password',
      database: process.env.MYSQL_DATABASE || 'payoffsolar'
    });

    console.log('Connected to database');
    
    // Get revenue by year and month
    const [revenueData] = await connection.execute(`
      SELECT 
        YEAR(order_date) as year,
        MONTH(order_date) as month,
        COUNT(*) as order_count,
        SUM(total) as total_revenue
      FROM orders 
      WHERE status = 'complete'
      GROUP BY YEAR(order_date), MONTH(order_date)
      ORDER BY year, month
    `);

    // Get expenses by year, month, and category
    const [expenseData] = await connection.execute(`
      SELECT 
        YEAR(o.order_date) as year,
        MONTH(o.order_date) as month,
        cc.name as category_name,
        SUM(ci.amount) as total_amount
      FROM cost_items ci
      INNER JOIN cost_categories cc ON ci.category_id = cc.id
      INNER JOIN orders o ON ci.order_id = o.id
      WHERE o.status = 'complete'
      GROUP BY YEAR(o.order_date), MONTH(o.order_date), cc.id, cc.name
      ORDER BY year, month, total_amount DESC
    `);

    // Create CSV for summary by year
    const summaryCSV = [];
    summaryCSV.push(['Year', 'Revenue', 'COGS', 'Gross Profit', 'Operating Expenses', 'Net Income']);

    // Organize data by year
    const yearlyData = {};
    
    for (const row of revenueData) {
      const year = row.year;
      if (!yearlyData[year]) {
        yearlyData[year] = { revenue: 0, cogs: 0, opex: 0 };
      }
      yearlyData[year].revenue += parseFloat(row.total_revenue || 0);
    }

    for (const row of expenseData) {
      const year = row.year;
      if (!yearlyData[year]) continue;

      const amount = parseFloat(row.total_amount || 0);
      const accountType = CATEGORY_MAPPING[row.category_name] || 'Operating Expense - Other';

      // Skip excluded categories (like Matt Profit)
      if (accountType.startsWith('EXCLUDED')) {
        continue;
      }

      if (accountType.startsWith('COGS')) {
        yearlyData[year].cogs += amount;
      } else {
        yearlyData[year].opex += amount;
      }
    }

    for (const [year, data] of Object.entries(yearlyData).sort()) {
      const grossProfit = data.revenue - data.cogs;
      const netIncome = grossProfit - data.opex;
      summaryCSV.push([
        year,
        data.revenue.toFixed(2),
        data.cogs.toFixed(2),
        grossProfit.toFixed(2),
        data.opex.toFixed(2),
        netIncome.toFixed(2)
      ]);
    }

    // Create CSV for detailed expenses
    const detailCSV = [];
    detailCSV.push(['Year', 'Month', 'Category', 'Account Type', 'Amount']);

    for (const row of expenseData) {
      const accountType = CATEGORY_MAPPING[row.category_name] || 'Operating Expense - Other';

      // Skip excluded categories
      if (accountType.startsWith('EXCLUDED')) {
        continue;
      }

      detailCSV.push([
        row.year,
        row.month,
        row.category_name,
        accountType,
        parseFloat(row.total_amount || 0).toFixed(2)
      ]);
    }

    // Write CSV files
    const summaryPath = path.join(__dirname, '..', 'pl-summary.csv');
    const detailPath = path.join(__dirname, '..', 'pl-detail.csv');
    
    fs.writeFileSync(summaryPath, summaryCSV.map(row => row.join(',')).join('\n'));
    fs.writeFileSync(detailPath, detailCSV.map(row => row.join(',')).join('\n'));
    
    console.log(`\nExported P&L Summary to: ${summaryPath}`);
    console.log(`Exported P&L Detail to: ${detailPath}`);
    
  } catch (error) {
    console.error('Error exporting P&L to CSV:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the export
exportPLtoCSV();
