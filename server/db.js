import { execFile } from 'child_process';

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'cham_cong_leader',
};

/**
 * Thực thi câu lệnh SQL trực tiếp vào MySQL Server 8.0 (MySQL Workbench)
 * Hỗ trợ 100% tiếng Việt UTF-8 không lỗi font.
 */
export function query(sql) {
  return new Promise((resolve, reject) => {
    execFile(
      'mysql.exe',
      [
        '--default-character-set=utf8mb4',
        '-u',
        DB_CONFIG.user,
        `-p${DB_CONFIG.password}`,
        '-D',
        DB_CONFIG.database,
        '--batch',
        '-e',
        sql,
      ],
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          // Bỏ qua cảnh báo password insecure trên stderr của MySQL
          if (stderr && !stderr.includes('Using a password') && !stderr.includes('Switching to')) {
            return reject(new Error(stderr));
          }
        }
        if (!stdout || !stdout.trim()) {
          return resolve([]);
        }

        const lines = stdout
          .split('\n')
          .map((l) => l.replace(/\r$/, ''))
          .filter((l) => Boolean(l.trim()) && !l.startsWith('mysql:'));

        if (lines.length === 0) return resolve([]);

        const headers = lines[0].split('\t').map((h) => h.trim());
        const rows = lines.slice(1).map((line) => {
          const vals = line.split('\t');
          const obj = {};
          headers.forEach((h, i) => {
            const v = vals[i] !== undefined ? vals[i].trim() : '';
            obj[h] = v === 'NULL' ? null : v;
          });
          return obj;
        });

        resolve(rows);
      }
    );
  });
}

/**
 * Thoát chuỗi an toàn chống SQL Injection cơ bản
 */
export function escapeString(str) {
  if (str === null || str === undefined) return "''";
  return `'${String(str).replace(/'/g, "\\'")}'`;
}
