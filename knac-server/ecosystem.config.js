module.exports = {
  apps: [{
    name: 'knac-server',
    script: 'src/app.js',
    watch: false,
    env: { NODE_ENV: 'production' },
    error_file: 'logs/err.log',
    out_file:   'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }],
};
