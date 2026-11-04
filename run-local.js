const { spawn } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('🏛️  Starting AI Court System (Local Development)     ');
console.log('====================================================\n');

// 1. Start AI Agent Module (Port 5001)
const ai = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'ai-module'),
  stdio: 'inherit',
  shell: true
});

// 2. Start Backend Express API (Port 5000)
const server = spawn('node', ['src/app.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// 3. Start Frontend Client (Vite on Port 5173)
const client = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

console.log('Services started:');
console.log('  🌐 Frontend Application : http://localhost:5173');
console.log('  ⚙️  Backend Express API  : http://localhost:5000');
console.log('  🧠 AI Agent Service     : http://localhost:5001');
console.log('\nPress Ctrl+C to terminate all services.\n');

process.on('SIGINT', () => {
  console.log('\nStopping all services...');
  ai.kill();
  server.kill();
  client.kill();
  process.exit(0);
});

