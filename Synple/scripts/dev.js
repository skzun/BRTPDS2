const { spawn } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('🚀 INICIANDO SYNPLE BACKEND E MOBILE SIMULTANEAMENTE');
console.log('====================================================');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// Inicia o backend
const backend = spawn(npmCmd, ['--prefix', 'backend', 'run', 'start'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname, '..'),
});

// Inicia o mobile (com detecção de IP automática)
const mobile = spawn(npmCmd, ['--prefix', 'mobile', 'run', 'start'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname, '..'),
});

function cleanup() {
  console.log('\n🛑 Encerrando Synple Backend e Mobile...');
  try { backend.kill(); } catch (e) {}
  try { mobile.kill(); } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
