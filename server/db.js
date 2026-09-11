import 'dotenv/config';
import mysql from 'mysql2/promise';

const LOCAL_CONFIG = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'cham_cong_leader',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: false,
  connectTimeout: 4000,
};

const isRemote =
  Boolean(process.env.MYSQLHOST && process.env.MYSQLHOST !== '127.0.0.1' && process.env.MYSQLHOST !== 'localhost') ||
  Boolean(process.env.DB_HOST && process.env.DB_HOST !== '127.0.0.1' && process.env.DB_HOST !== 'localhost');

const REMOTE_CONFIG = {
  host: process.env.MYSQLHOST || process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '123456',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'cham_cong_leader',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: isRemote ? { rejectUnauthorized: false } : false,
  connectTimeout: 8000,
};

let pool = mysql.createPool(REMOTE_CONFIG);
let isUsingFallback = false;

export async function query(sql) {
  try {
    const [rows] = await pool.query(sql);
    return rows;
  } catch (error) {
    // Nếu kết nối remote (như Railway) bị timeout hoặc rớt mạng -> Tự động chuyển về MySQL Workbench cục bộ
    if (!isUsingFallback && REMOTE_CONFIG.host !== '127.0.0.1' && REMOTE_CONFIG.host !== 'localhost') {
      console.warn(`[DB WARNING] Không thể kết nối tới MySQL Remote (${REMOTE_CONFIG.host}): ${error.message}`);
      console.log(`[DB INFO] Tự động chuyển sang MySQL cục bộ (127.0.0.1:3306 - cham_cong_leader)...`);
      try {
        pool = mysql.createPool(LOCAL_CONFIG);
        isUsingFallback = true;
        const [rows] = await pool.query(sql);
        return rows;
      } catch (localError) {
        console.error('Local Database error:', localError.message);
        throw localError;
      }
    }
    console.error('Database error:', error.message);
    throw error;
  }
}

export function escapeString(str) {
  if (str === null || str === undefined) return "''";
  return `'${String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}