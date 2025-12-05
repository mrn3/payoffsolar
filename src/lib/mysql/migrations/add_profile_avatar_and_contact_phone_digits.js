const mysql = require('mysql2/promise');

/**
 * Migration: add_profile_avatar_and_contact_phone_digits
 *
 * - Adds avatar_url to profiles if it does not exist
 * - Adds phone_digits to contacts if it does not exist
 * - Adds an index on contacts(phone_digits)
 */

async function columnExists(connection, tableName, columnName) {
  const [columns] = await connection.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [process.env.MYSQL_DATABASE || 'payoffsolar', tableName, columnName]
  );

  return columns.length > 0;
}

async function indexExists(connection, tableName, indexName) {
  const [indexes] = await connection.execute(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [process.env.MYSQL_DATABASE || 'payoffsolar', tableName, indexName]
  );

  return indexes.length > 0;
}

async function up(connection) {
  // Add avatar_url to profiles
  const hasAvatarUrl = await columnExists(connection, 'profiles', 'avatar_url');
  if (!hasAvatarUrl) {
    await connection.execute(
      `ALTER TABLE profiles ADD COLUMN avatar_url VARCHAR(500) AFTER phone`
    );
  }

  // Add phone_digits to contacts
  const hasPhoneDigits = await columnExists(connection, 'contacts', 'phone_digits');
  if (!hasPhoneDigits) {
    await connection.execute(
      `ALTER TABLE contacts ADD COLUMN phone_digits VARCHAR(20) AFTER phone`
    );
  }

  // Add index on contacts(phone_digits)
  const hasPhoneDigitsIndex = await indexExists(connection, 'contacts', 'idx_contacts_phone_digits');
  if (!hasPhoneDigitsIndex) {
    await connection.execute(
      `CREATE INDEX idx_contacts_phone_digits ON contacts(phone_digits)`
    );
  }
}

async function down(connection) {
  // Drop index first
  const hasPhoneDigitsIndex = await indexExists(connection, 'contacts', 'idx_contacts_phone_digits');
  if (hasPhoneDigitsIndex) {
    await connection.execute(
      `DROP INDEX idx_contacts_phone_digits ON contacts`
    );
  }

  // Drop phone_digits from contacts
  const hasPhoneDigits = await columnExists(connection, 'contacts', 'phone_digits');
  if (hasPhoneDigits) {
    await connection.execute(
      `ALTER TABLE contacts DROP COLUMN phone_digits`
    );
  }

  // Drop avatar_url from profiles
  const hasAvatarUrl = await columnExists(connection, 'profiles', 'avatar_url');
  if (hasAvatarUrl) {
    await connection.execute(
      `ALTER TABLE profiles DROP COLUMN avatar_url`
    );
  }
}

module.exports = { up, down };

