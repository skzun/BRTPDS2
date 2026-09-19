const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('====================================================');
console.log('🌐 INICIANDO SYNPLE COM SUPORTE A REDE EXTERNA (TÚNEL)');
console.log('====================================================');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const npxCmd = isWin ? 'npx.cmd' : 'npx';
const rootDir = path.resolve(__dirname, '..');
const networkConfigPath = path.join(rootDir, 'mobile/src/constants/network.json');

// 1. Inicia o backend na porta 3001
const backend = spawn(npmCmd, ['--prefix', 'backend', 'run', 'start'], {
  stdio: 'inherit',
  shell: true,
  cwd: rootDir,
});

// 2. Inicia o túnel público para a porta 3001
const tunnel = spawn(npxCmd, ['--yes', 'localtunnel', '--port', '3001'], {
  shell: true,
  cwd: rootDir,
});

let mobile = null;
let tunnelUrl = null;

tunnel.stdout.on('data', (data) => {
  const output = data.toString();
  const match = output.match(/your url is:\s*(https:\/\/[^\s]+)/i);
  if (match && !tunnelUrl) {
    tunnelUrl = `${match[1].trim()}/api`;
    console.log('\n====================================================');
    console.log('🚀 TÚNEL DO BACKEND ONLINE COM SUCESSO:');
    console.log(`🔗 ${tunnelUrl}`);
    console.log('📱 Celulares em 4G/redes de fora salvarão direto no PostgreSQL!');
    console.log('====================================================\n');

    // Grava a URL do túnel no network.json
    try {
      let currentConfig = {};
      if (fs.existsSync(networkConfigPath)) {
        currentConfig = JSON.parse(fs.readFileSync(networkConfigPath, 'utf8'));
      }
      currentConfig.tunnelUrl = tunnelUrl;
      fs.writeFileSync(networkConfigPath, JSON.stringify(currentConfig, null, 2), 'utf8');
    } catch (err) {
      console.warn('Aviso: Não foi possível atualizar network.json com tunnelUrl:', err.message);
    }

    // Inicia o Expo com --tunnel
    mobile = spawn(npxCmd, ['expo', 'start', '--tunnel'], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(rootDir, 'mobile'),
      env: { ...process.env, EXPO_PUBLIC_API_URL: tunnelUrl },
    });
  }
});

tunnel.stderr.on('data', (data) => {
  // Ignora logs informativos de stderr do localtunnel
});

function cleanup() {
  console.log('\n🛑 Encerrando Synple Backend, Túnel e Mobile...');
  try { backend.kill(); } catch (e) {}
  try { tunnel.kill(); } catch (e) {}
  if (mobile) {
    try { mobile.kill(); } catch (e) {}
  }

  // Remove tunnelUrl do network.json
  try {
    if (fs.existsSync(networkConfigPath)) {
      const config = JSON.parse(fs.readFileSync(networkConfigPath, 'utf8'));
      delete config.tunnelUrl;
      fs.writeFileSync(networkConfigPath, JSON.stringify(config, null, 2), 'utf8');
    }
  } catch (e) {}

  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
