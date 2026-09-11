import { URL } from 'url';
import { query, escapeString } from './db.js';

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return Promise.resolve(JSON.parse(req.body));
      } catch (e) {
        return Promise.resolve({});
      }
    }
    return Promise.resolve(req.body);
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function formatDateOnly(val) {
  if (!val) return '';
  if (typeof val === 'string') {
    return val.split(/[ T]/)[0];
  }
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val).split(/[ T]/)[0];
}

let offColumnsCache = null;
async function getOffColumns() {
  if (offColumnsCache) return offColumnsCache;
  try {
    const rows = await query('SHOW COLUMNS FROM cham_cong_off;');
    offColumnsCache = rows.map((r) => (r.Field || r.field || '').toLowerCase());
  } catch (e) {
    offColumnsCache = ['id', 'nhan_vien_id', 'ngay_off', 'ghi_chu'];
  }
  return offColumnsCache;
}

export async function handleApiRequest(req, res, next) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  // Chuẩn hóa pathname (hỗ trợ cả /api/xyz và /xyz khi gắn vào Vite middleware)
  const parsedUrl = new URL(req.url, 'http://localhost');
  let pathname = parsedUrl.pathname;
  if (!pathname.startsWith('/api')) {
    pathname = '/api' + pathname;
  }
  const method = req.method;

  try {
    // 1. AUTH: POST /api/auth/login
    if (pathname === '/api/auth/login' && method === 'POST') {
      const { username, password } = await parseBody(req);
      const uTerm = String(username || '').trim().toLowerCase();
      const userCondition =
        uTerm === 'leader' || uTerm === 'leader01'
          ? "username IN ('leader', 'leader01')"
          : `username = ${escapeString(username)}`;

      const rows = await query(
        `SELECT * FROM users WHERE ${userCondition} AND password = ${escapeString(password)} LIMIT 1;`
      );
      if (rows.length === 0) {
        return sendJson(res, 401, { message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
      }
      const u = rows[0];
      return sendJson(res, 200, {
        success: true,
        token: `jwt_token_${u.id}_${Date.now()}`,
        user: {
          id: Number(u.id),
          username: u.username,
          name: u.ho_ten,
          role: String(u.role || 'LEADER').toLowerCase(),
        },
      });
    }

    // 2. EMPLOYEES: /api/employees
    if (pathname === '/api/employees' && method === 'GET') {
      const search = parsedUrl.searchParams.get('search') || '';
      let sql = 'SELECT * FROM nhan_vien WHERE 1=1 ';
      if (search) {
        const s = escapeString(`%${search}%`);
        sql += `AND (ho_ten LIKE ${s} OR ma_nhan_vien LIKE ${s} OR so_dien_thoai LIKE ${s}) `;
      }
      sql += 'ORDER BY id ASC;';
      const rows = await query(sql);
      const employees = rows.map((r) => {
        let pos = r.chuc_vu || 'Phục vụ';
        const p = pos.toLowerCase();
        if (
          p.includes('chef') ||
          p.includes('bếp') ||
          p.includes('trưởng') ||
          p.includes('kỹ thuật') ||
          p.includes('sale') ||
          r.ma_nhan_vien === 'NV001' ||
          r.ma_nhan_vien === 'NV003'
        ) {
          pos = 'Chef';
        } else {
          pos = 'Phục vụ';
        }
        return {
          id: Number(r.id),
          code: r.ma_nhan_vien,
          name: r.ho_ten,
          phone: r.so_dien_thoai || '',
          position: pos,
          dailySalary: Number(r.luong_ngay) || 0,
          status: String(r.trang_thai || 'ACTIVE').toLowerCase(),
          createdAt: formatDateOnly(r.created_at),
        };
      });
      return sendJson(res, 200, employees);
    }

    const empIdMatch = pathname.match(/^\/api\/employees\/(\d+)$/);
    if (empIdMatch && method === 'GET') {
      const id = empIdMatch[1];
      const rows = await query(`SELECT * FROM nhan_vien WHERE id = ${id} LIMIT 1;`);
      if (rows.length === 0) {
        return sendJson(res, 404, { message: 'Không tìm thấy nhân viên' });
      }
      const r = rows[0];
      let pos = r.chuc_vu || 'Phục vụ';
      const p = pos.toLowerCase();
      if (
        p.includes('chef') ||
        p.includes('bếp') ||
        p.includes('trưởng') ||
        p.includes('kỹ thuật') ||
        p.includes('sale') ||
        r.ma_nhan_vien === 'NV001' ||
        r.ma_nhan_vien === 'NV003'
      ) {
        pos = 'Chef';
      } else {
        pos = 'Phục vụ';
      }
      return sendJson(res, 200, {
        id: Number(r.id),
        code: r.ma_nhan_vien,
        name: r.ho_ten,
        phone: r.so_dien_thoai || '',
        position: pos,
        dailySalary: Number(r.luong_ngay) || 0,
        status: String(r.trang_thai || 'ACTIVE').toLowerCase(),
        createdAt: formatDateOnly(r.created_at),
      });
    }

    if (pathname === '/api/employees' && method === 'POST') {
      const body = await parseBody(req);
      const code = body.code || `NV${Date.now().toString().slice(-4)}`;
      const name = body.name || 'Nhân viên mới';
      const phone = body.phone || '';
      const position = body.position || 'Phục vụ';
      const dailySalary = Number(body.dailySalary) || 0;
      const status = (body.status || 'active').toUpperCase();

      await query(
        `INSERT INTO nhan_vien (ma_nhan_vien, ho_ten, so_dien_thoai, chuc_vu, luong_ngay, trang_thai) ` +
          `VALUES (${escapeString(code)}, ${escapeString(name)}, ${escapeString(phone)}, ${escapeString(position)}, ${dailySalary}, ${escapeString(status)});`
      );
      const lastIdRow = await query('SELECT MAX(id) as id FROM nhan_vien;');
      const newId = Number(lastIdRow[0]?.id || Date.now());

      return sendJson(res, 201, {
        id: newId,
        code,
        name,
        phone,
        position,
        dailySalary,
        status: status.toLowerCase(),
        createdAt: new Date().toISOString().split('T')[0],
      });
    }

    if (empIdMatch && method === 'PUT') {
      const id = empIdMatch[1];
      const body = await parseBody(req);
      const name = body.name || '';
      const phone = body.phone || '';
      const position = body.position || 'Phục vụ';
      const dailySalary = Number(body.dailySalary) || 0;
      const status = (body.status || 'active').toUpperCase();

      let updateSql = `UPDATE nhan_vien SET chuc_vu = ${escapeString(position)}, luong_ngay = ${dailySalary}, trang_thai = ${escapeString(status)} `;
      if (name) updateSql += `, ho_ten = ${escapeString(name)} `;
      if (phone !== undefined) updateSql += `, so_dien_thoai = ${escapeString(phone)} `;
      if (body.code) updateSql += `, ma_nhan_vien = ${escapeString(body.code)} `;
      updateSql += `WHERE id = ${id};`;

      await query(updateSql);
      const updatedRows = await query(`SELECT * FROM nhan_vien WHERE id = ${id};`);
      const r = updatedRows[0] || {};
      return sendJson(res, 200, {
        id: Number(id),
        code: r.ma_nhan_vien || body.code,
        name: r.ho_ten || name,
        phone: r.so_dien_thoai || phone,
        position: r.chuc_vu || position,
        dailySalary: Number(r.luong_ngay) || dailySalary,
        status: String(r.trang_thai || status).toLowerCase(),
      });
    }

    if (empIdMatch && method === 'DELETE') {
      const id = empIdMatch[1];
      await query(`DELETE FROM cham_cong_off WHERE nhan_vien_id = ${id};`);
      await query(`DELETE FROM ung_luong WHERE nhan_vien_id = ${id};`);
      await query(`DELETE FROM nhan_vien WHERE id = ${id};`);
      return sendJson(res, 200, { success: true, message: 'Đã xóa nhân viên thành công' });
    }

    // 3. ATTENDANCE: /api/attendance
    if (pathname === '/api/attendance' && method === 'GET') {
      const month = parsedUrl.searchParams.get('month');
      const year = parsedUrl.searchParams.get('year');
      let sql = 'SELECT * FROM cham_cong_off WHERE 1=1 ';
      if (month && year) {
        const monthStr = String(month).padStart(2, '0');
        sql += `AND ngay_off LIKE '${year}-${monthStr}%' `;
      }
      sql += 'ORDER BY ngay_off ASC;';
      const rows = await query(sql);
      const records = rows.map((r) => {
        let status = r.loai || 'off';
        let workHours = Number(r.so_gio_lam) || 0;
        let note = r.ghi_chu || '';

        if (!r.so_gio_lam && note) {
          const match = note.match(/\[(?:LÀM\s*)?(\d+(?:\.\d+)?)h\]/i);
          if (match) {
            status = 'partial';
            workHours = Number(match[1]);
            note = note.replace(/\[(?:LÀM\s*)?(\d+(?:\.\d+)?)h\]\s*/i, '').trim();
          }
        }

        return {
          id: `att_${r.id}`,
          employeeId: Number(r.nhan_vien_id),
          date: formatDateOnly(r.ngay_off),
          status,
          workHours,
          startTime: r.gio_bat_dau || '05:00',
          endTime: r.gio_ket_thuc || '09:00',
          note: note || '',
          reason: note || '',
        };
      });
      return sendJson(res, 200, records);
    }

    if (pathname === '/api/attendance/day' && method === 'POST') {
      const body = await parseBody(req);
      const employeeId = Number(body.employeeId);
      const date = body.date;
      const status = body.status || 'full';
      const workHours = Number(body.workHours) || 0;
      const startTime = body.startTime || '';
      const endTime = body.endTime || '';
      const note = body.note || body.reason || '';

      const cols = await getOffColumns();

      await query(
        `DELETE FROM cham_cong_off WHERE nhan_vien_id = ${employeeId} AND ngay_off = '${date}';`
      );

      if (status === 'off') {
        if (cols.includes('loai')) {
          await query(
            `INSERT INTO cham_cong_off (nhan_vien_id, ngay_off, ghi_chu, loai, so_gio_lam) ` +
              `VALUES (${employeeId}, '${date}', ${escapeString(note || 'Nghỉ phép')}, 'off', 0);`
          );
        } else {
          await query(
            `INSERT INTO cham_cong_off (nhan_vien_id, ngay_off, ghi_chu) ` +
              `VALUES (${employeeId}, '${date}', ${escapeString(note || 'Nghỉ phép')});`
          );
        }
        return sendJson(res, 200, { employeeId, date, status: 'off', note });
      } else if (status === 'partial') {
        if (cols.includes('loai')) {
          await query(
            `INSERT INTO cham_cong_off (nhan_vien_id, ngay_off, ghi_chu, loai, so_gio_lam, gio_bat_dau, gio_ket_thuc) ` +
              `VALUES (${employeeId}, '${date}', ${escapeString(note || `Làm ${workHours}h`)}, 'partial', ${workHours}, ${escapeString(startTime)}, ${escapeString(endTime)});`
          );
        } else {
          const combinedNote = `[${workHours}h] ${note || ''}`.trim();
          await query(
            `INSERT INTO cham_cong_off (nhan_vien_id, ngay_off, ghi_chu) ` +
              `VALUES (${employeeId}, '${date}', ${escapeString(combinedNote)});`
          );
        }
        return sendJson(res, 200, { employeeId, date, status: 'partial', workHours, note });
      } else {
        return sendJson(res, 200, { success: true, message: 'Đã cập nhật đủ ca chuẩn' });
      }
    }

    // 4. SALARY ADVANCES: /api/salary/advances
    if (pathname === '/api/salary/advances' && method === 'GET') {
      const month = parsedUrl.searchParams.get('month');
      const year = parsedUrl.searchParams.get('year');
      const employeeId = parsedUrl.searchParams.get('employeeId');

      let sql =
        'SELECT u.*, n.ma_nhan_vien, n.ho_ten FROM ung_luong u ' +
        'LEFT JOIN nhan_vien n ON u.nhan_vien_id = n.id WHERE 1=1 ';

      if (month && year) {
        const monthStr = String(month).padStart(2, '0');
        sql += `AND u.ngay_ung LIKE '${year}-${monthStr}%' `;
      }
      if (employeeId) {
        sql += `AND u.nhan_vien_id = ${Number(employeeId)} `;
      }
      sql += 'ORDER BY u.ngay_ung DESC, u.id DESC;';

      const rows = await query(sql);
      const advances = rows.map((r) => ({
        id: Number(r.id),
        employeeId: Number(r.nhan_vien_id),
        date: formatDateOnly(r.ngay_ung),
        amount: Number(r.so_tien) || 0,
        note: r.ghi_chu || '',
        employeeCode: r.ma_nhan_vien || 'N/A',
        employeeName: r.ho_ten || 'N/A',
      }));
      return sendJson(res, 200, advances);
    }

    if (pathname === '/api/salary/advances' && method === 'POST') {
      const body = await parseBody(req);
      const employeeId = Number(body.employeeId);
      const date = body.date || new Date().toISOString().split('T')[0];
      const amount = Number(body.amount) || 0;
      const note = body.note || '';

      await query(
        `INSERT INTO ung_luong (nhan_vien_id, ngay_ung, so_tien, ghi_chu) ` +
          `VALUES (${employeeId}, '${date}', ${amount}, ${escapeString(note)});`
      );
      const lastIdRow = await query('SELECT MAX(id) as id FROM ung_luong;');
      const newId = Number(lastIdRow[0]?.id || Date.now());

      const empRows = await query(`SELECT ma_nhan_vien, ho_ten FROM nhan_vien WHERE id = ${employeeId};`);
      const emp = empRows[0] || {};

      return sendJson(res, 201, {
        id: newId,
        employeeId,
        date,
        amount,
        note,
        employeeCode: emp.ma_nhan_vien || '',
        employeeName: emp.ho_ten || '',
      });
    }

    const advIdMatch = pathname.match(/^\/api\/salary\/advances\/(\d+)$/);
    if (advIdMatch && method === 'PUT') {
      const id = advIdMatch[1];
      const body = await parseBody(req);
      const employeeId = Number(body.employeeId);
      const date = body.date;
      const amount = Number(body.amount) || 0;
      const note = body.note || '';

      await query(
        `UPDATE ung_luong SET nhan_vien_id = ${employeeId}, ngay_ung = '${date}', so_tien = ${amount}, ghi_chu = ${escapeString(note)} WHERE id = ${id};`
      );
      return sendJson(res, 200, { id: Number(id), employeeId, date, amount, note });
    }

    if (advIdMatch && method === 'DELETE') {
      const id = advIdMatch[1];
      await query(`DELETE FROM ung_luong WHERE id = ${id};`);
      return sendJson(res, 200, { success: true, message: 'Đã xóa bản ghi tạm ứng' });
    }

    if (next) {
      return next();
    }
    return sendJson(res, 404, { message: `Endpoint not found: ${method} ${pathname}` });
  } catch (err) {
    console.error('API Error:', err);
    return sendJson(res, 500, { message: 'Lỗi máy chủ: ' + err.message });
  }
}
