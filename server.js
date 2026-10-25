const { spawn } = require('child_process');

const port = process.env.PORT || 8081;
console.log(`[DGShop Server] Launching Expo production server on port ${port}...`);

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['expo', 'serve', '--port', String(port)], {
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (err) => {
  console.error('[DGShop Server] Failed to start server:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
