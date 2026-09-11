import 'dotenv/config';
import mysql from 'mysql2/promise';

// Cấu hình mặc định trực tiếp từ Railway Cloud Database (đảm bảo web online chạy ngay trên Vercel)
const RAILWAY_DEFAULT = {
  host: 'iriguchi.proxy.rlwy.net',
  port: 52957,
  user: 'root',
  password: 'DLyomcHXEjygykSbcQrZTSVoOdhVqUmh',
  database: 'railway',
};

const isVercel = Boolean(process.env.VERCEL);

// Ưu tiên: Biến môi trường Vercel/Render > Cấu hình Railway Cloud mặc định
const dbHost = process.env.MYSQLHOST || process.env.DB_HOST || RAILWAY_DEFAULT.host;
const dbPort = Number(process.env.MYSQLPORT || process.env.DB_PORT || RAILWAY_DEFAULT.port);
const dbUser = process.env.MYSQLUSER || process.env.DB_USER || RAILWAY_DEFAULT.user;
const dbPassword = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || RAILWAY_DEFAULT.password;
const dbDatabase = process.env.MYSQLDATABASE || process.env.DB_NAME || RAILWAY_DEFAULT.database;

const isRemote = dbHost !== '127.0.0.1' && dbHost !== 'localhost';

const ACTIVE_CONFIG = {
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbDatabase,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: isRemote ? { rejectUnauthorized: false } : false,
  connectTimeout: 10000,
};

let pool = mysql.createPool(ACTIVE_CONFIG);
let isUsingFallback = false;

const LOCAL_FALLBACK_CONFIG = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'cham_cong_leader',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: false,
  connectTimeout: 4000,
};

export async function query(sql) {
  try {
    const [rows] = await pool.query(sql);
    return rows;
  } catch (error) {
    // Chỉ fallback về local nếu đang chạy trên máy tính nội bộ (không phải trên Vercel)
    if (!isVercel && !isUsingFallback && isRemote) {
      console.warn(`[DB WARNING] Không thể kết nối tới MySQL Remote (${dbHost}): ${error.message}`);
      console.log(`[DB INFO] Tự động chuyển sang MySQL cục bộ (127.0.0.1:3306 - cham_cong_leader)...`);
      try {
        pool = mysql.createPool(LOCAL_FALLBACK_CONFIG);
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