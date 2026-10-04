module.exports = {
  apps: [
    {
      name: 'deepam-api',
      script: 'server.js',
      exec_mode: 'fork',
      instances: 1,
      // Nginx and deploy/release.sh expect 5050; this wins over PORT in .env.
      env: { NODE_ENV: 'production', PORT: 5050 },
      max_memory_restart: '400M',
      kill_timeout: 10000,
      time: true,
    },
  ],
};
