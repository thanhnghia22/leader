@echo off
chcp 65001 >nul
title Khởi Động Quản Lý Chấm Công Leader
echo =======================================================
echo   HỆ THỐNG QUẢN LÝ CHẤM CÔNG & TÍNH LƯƠNG CHO LEADER
echo =======================================================
echo.
echo [1/2] Đang khởi động Backend kết nối MySQL...
start "Backend MySQL Server" cmd /k "cd /d "%~dp0" && node server/index.js"

timeout /t 2 /nobreak >nul

echo [2/2] Đang khởi động Giao diện Web...
start "Frontend Web React" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo =======================================================
echo   ĐÃ KHỞI ĐỘNG XONG!
echo   - Backend API: http://localhost:5000
echo   - Website:     http://localhost:3000
echo   - Tài khoản:   leader / 123456
echo =======================================================
timeout /t 5 >nul
