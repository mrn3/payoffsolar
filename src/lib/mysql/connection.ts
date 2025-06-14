import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'payoffsolar',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection function
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ MySQL connection successful');
    return true;
  } catch (_error) {
    console.error('❌ MySQL connection failed:', _error);
    return false;
  }
}

// Execute query function
export async function executeQuery<T = any>(
  _query: string,
  params: unknown[] = []
): Promise<T[]> {
  try {
    const [rows] = await pool.execute(_query, params);
    return rows as T[];
  } catch (_error) {
    console.error('Database query _error:', _error);
    throw _error;
  }
}

// Execute single query (for INSERT, UPDATE, DELETE)
export async function executeSingle(
  _query: string,
  params: unknown[] = []
): Promise<mysql.ResultSetHeader> {
  try {
    const [result] = await pool.execute(_query, params);
    return result as mysql.ResultSetHeader;
  } catch (_error) {
    console.error('Database query _error:', _error);
    throw _error;
  }
}

// Get single record
export async function getOne<T = any>(
  _query: string,
  params: unknown[] = []
): Promise<T | null> {
  const results = await executeQuery<T>(_query, params);
  return results.length > 0 ? results[0] : null;
}

// Transaction helper
export async function withTransaction<T>(
  _callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await _callback(connection);
    await connection.commit();
    return result;
  } catch (_error) {
    await connection.rollback();
    throw _error;
  } finally {
    connection.release();
  }
}

export default pool;
