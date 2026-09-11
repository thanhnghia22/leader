import 'dotenv/config';
import http from 'http';
import { handleApiRequest } from './apiHandler.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  handleApiRequest(req, res);
});

server.listen(PORT, () => {
  console.log(`Backend Server đang chạy tại http://localhost:${PORT}`);
  console.log(`Kết nối MySQL: ${process.env.MYSQLDATABASE || 'cham_cong_leader'} (${process.env.MYSQLHOST || '127.0.0.1'})`);
});