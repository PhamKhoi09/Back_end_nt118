#!/bin/bash

# Script để FIX EC2 khi bị stuck do merge conflict
# Chạy script này TRỰC TIẾP trên EC2 hoặc qua SSH

set -e  # Exit on error

echo "Bắt đầu fix EC2 deployment issue..."

# 1. Di chuyển đến project directory
cd ~/Back_end_nt118 || { echo "Không tìm thấy project"; exit 1; }

echo "Checking git status..."
git status

# 2. Backup file .env (QUAN TRỌNG!)
if [ -f "back-end/.env" ]; then
  echo "Backing up .env file..."
  cp back-end/.env back-end/.env.backup
  echo ".env backed up to back-end/.env.backup"
fi

# 3. HARD RESET - Xóa mọi thay đổi local
echo "WARNING: Sẽ xóa TẤT CẢ thay đổi local!"
echo "Đợi 3 giây để hủy (Ctrl+C)..."
sleep 3

echo "Resetting repository..."
git fetch origin main
git reset --hard origin/main
git clean -fd  # Xóa untracked files

# 4. Restore file .env
if [ -f "back-end/.env.backup" ]; then
  echo "Restoring .env file..."
  cp back-end/.env.backup back-end/.env
  rm back-end/.env.backup
  echo ".env restored"
fi

# 5. Di chuyển vào back-end
cd back-end

# 6. Xóa node_modules và reinstall
echo "Reinstalling dependencies..."
rm -rf node_modules package-lock.json
npm install --only=production

# 7. Restart PM2
echo "Restarting application..."
pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs
pm2 save

# 8. Show logs
echo ""
echo "PM2 Status:"
pm2 status

echo ""
echo "Recent logs (last 20 lines):"
pm2 logs back-end-nt118 --lines 20 --nostream

echo ""
echo "========================================="
echo "Fix completed!"
echo "========================================="
echo ""
echo "Các lệnh hữu ích nên dùng:"
echo "  pm2 logs back-end-nt118        # Xem logs real-time"
echo "  pm2 status                     # Xem status"
echo "  pm2 restart back-end-nt118     # Restart app"
echo ""
