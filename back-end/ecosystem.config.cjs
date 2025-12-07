// PM2 Configuration file for production deployment

module.exports = {
  apps: [
    {
      name: "back-end-nt118",
      script: "src/server.js",
      instances: 1, // Sử dụng 1 instance cho free tier
      exec_mode: "fork", // fork mode cho 1 instance
      autorestart: true,
      watch: false, // Không watch files trong production
      max_memory_restart: "300M", // Restart nếu vượt quá 300MB (phù hợp free tier)
      env: {
        NODE_ENV: "production",
        PORT: 5001
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      // Cấu hình restart khi crash
      min_uptime: "10s",
      max_restarts: 10,
      // Cấu hình cho Node.js ESM
      node_args: ""
    }
  ]
};
