module.exports = {
  apps: [
    {
      name: "beautyup-admin",
      script: "node_modules/.bin/next",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        ADMIN_API_URL: "http://localhost:3001/api",
        SECURE_COOKIE: "false",
      },
    },
  ],
};
