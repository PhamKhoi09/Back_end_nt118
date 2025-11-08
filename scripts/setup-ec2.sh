#!/bin/bash

# Script để setup ban đầu trên EC2
# Chạy script này MỘT LẦN đầu tiên khi setup EC2

set -e  # Exit nếu có lỗi

echo "Bắt đầu setup Back-end NT118 trên EC2..."

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x (LTS)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# Install Git nếu chưa có
echo "Installing Git..."
sudo apt install -y git

# Clone repository
echo "Cloning repository..."
cd ~
if [ -d "Back_end_nt118" ]; then
  echo "Directory Back_end_nt118 đã tồn tại, skip clone"
  cd Back_end_nt118
  git pull origin main
else
  git clone https://github.com/KienNgo-o/Back_end_nt118.git
  cd Back_end_nt118
fi

# Di chuyển vào thư mục back-end
cd back-end

# Tạo thư mục logs cho PM2
mkdir -p logs

# Copy .env.example thành .env
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cp .env.example .env
  echo "VUI LÒNG chỉnh sửa file .env với các giá trị thực tế:"
  echo "   nano ~/.env"
else
  echo "File .env đã tồn tại"
fi

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Setup PM2 to start on boot
echo "Setting up PM2 startup..."
pm2 startup systemd -u ubuntu --hp /home/ubuntu
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Start application with PM2
echo "Starting application..."
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Show PM2 status
pm2 status

echo ""
echo "========================================="
echo "Setup hoàn tất!"
echo "========================================="
echo ""
echo "Các bước tiếp theo:"
echo "1. Chỉnh sửa file .env:"
echo "   cd ~/Back_end_nt118/back-end"
echo "   nano .env"
echo ""
echo "2. Restart ứng dụng sau khi chỉnh sửa .env:"
echo "   pm2 restart back-end-nt118"
echo ""
echo "3. Xem logs:"
echo "   pm2 logs back-end-nt118"
echo ""
echo "4. Xem status:"
echo "   pm2 status"
echo ""
echo "5. Stop ứng dụng:"
echo "   pm2 stop back-end-nt118"
echo ""
