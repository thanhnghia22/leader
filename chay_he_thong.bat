@echo off
chcp 65001 >nul
title Khởi Động Quản Lý Chấm Công Leader
echo =======================================================
echo   HỆ THỐNG QUẢN LÝ CHẤM CÔNG & TÍNH LƯƠNG CHO LEADER
echo =======================================================
echo.
echo Đang kết nối trực tiếp MySQL Workbench...
echo Mở trình duyệt tại http://localhost:3000
echo.
cd /d "%~dp0"
npm run dev
