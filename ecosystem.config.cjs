module.exports = {
  apps: [
    {
      name: 'deepam-api',
      script: 'server.js',
      exec_mode: 'fork',
      instances: 1,
      env: { NODE_ENV: 'production' },
      max_memory_restart: '400M',
      kill_timeout: 10000,
      time: true,
    },
  ],
};
