const mysql = require('mysql2/promise');

/**
 * Migration: add_latitude_longitude_to_contacts
 *
 * Adds latitude and longitude columns to contacts for map display.
 * Used for orders map and maintained when contact address changes.
 */

async function columnExists(connection, tableName, columnName) {
  const [columns] = await connection.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [process.env.MYSQL_DATABASE || 'payoffsolar', tableName, columnName]
  );
  return columns.length > 0;
}

async function up(connection) {
  const hasLatitude = await columnExists(connection, 'contacts', 'latitude');
  if (!hasLatitude) {
    await connection.execute(
      `ALTER TABLE contacts ADD COLUMN latitude DOUBLE NULL AFTER zip`
    );
  }

  const hasLongitude = await columnExists(connection, 'contacts', 'longitude');
  if (!hasLongitude) {
    await connection.execute(
      `ALTER TABLE contacts ADD COLUMN longitude DOUBLE NULL AFTER latitude`
    );
  }
}

async function down(connection) {
  const hasLongitude = await columnExists(connection, 'contacts', 'longitude');
  if (hasLongitude) {
    await connection.execute(`ALTER TABLE contacts DROP COLUMN longitude`);
  }

  const hasLatitude = await columnExists(connection, 'contacts', 'latitude');
  if (hasLatitude) {
    await connection.execute(`ALTER TABLE contacts DROP COLUMN latitude`);
  }
}

module.exports = { up, down };
