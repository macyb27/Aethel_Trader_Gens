module.exports = {
  apps: [
    {
      name: 'aether-trader',
      script: 'npx',
      args: 'vite --host 0.0.0.0 --port 3000',
      cwd: __dirname + '/apps/web',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 3
    }
  ]
};
