const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('🌐 INICIANDO SYNPLE COM SUPORTE A REDE EXTERNA (TÚNEL)');
console.log('====================================================');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const npxCmd = isWin ? 'npx.cmd' : 'npx';
const rootDir = path.resolve(__dirname, '..');
const expoLaunchTarget = process.argv.includes('--go') ? '--go' : '--dev-client';
const localCloudflared = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, 'Synple', 'cloudflared.exe')
  : '';
const cloudflaredCmd = localCloudflared && fs.existsSync(localCloudflared)
  ? localCloudflared
  : (isWin ? 'cloudflared.exe' : 'cloudflared');

console.log(`Destino do QR do Expo: ${expoLaunchTarget === '--go' ? 'Expo Go (Google Login indisponível)' : 'development build do Synple'}`);

let backend = null;
let tunnel = null;
let mobile = null;
let tunnelUrl = null;

async function isSynpleBackendReady() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch('http://127.0.0.1:3001/api/health', {
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const health = await response.json();
    return health?.status === 'OK' || health?.status === 'DEGRADED';
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function start() {
  if (await isSynpleBackendReady()) {
    console.log('[Backend] API Synple já está ativa na porta 3001; reutilizando o processo existente.');
  } else {
    // 1. Inicia o backend quando ainda não existe uma API Synple na porta 3001.
    backend = spawn(npmCmd, ['--prefix', 'backend', 'run', 'start'], {
      stdio: 'inherit',
      shell: true,
      cwd: rootDir,
    });
  }

  // 2. Inicia um Cloudflare Quick Tunnel para a API local.
  tunnel = spawn(cloudflaredCmd, ['tunnel', '--url', 'http://127.0.0.1:3001', '--no-autoupdate'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    cwd: rootDir,
  });

  function handleTunnelOutput(data) {
    const output = data.toString();
    process.stdout.write(data);
    const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (match && !tunnelUrl) {
      tunnelUrl = `${match[0].trim()}/api`;
      console.log('\n====================================================');
      console.log('🚀 TÚNEL DO BACKEND ONLINE COM SUCESSO:');
      console.log(`🔗 ${tunnelUrl}`);
      console.log('📱 Celulares em 4G/redes de fora salvarão direto no PostgreSQL!');
      console.log('====================================================\n');

      mobile = spawn(npxCmd, ['expo', 'start', '--tunnel', expoLaunchTarget], {
        stdio: 'inherit',
        shell: true,
        cwd: path.join(rootDir, 'mobile'),
        env: { ...process.env, EXPO_PUBLIC_API_URL: tunnelUrl },
      });
      mobile.on('error', (err) => {
        console.error('[Expo] Não foi possível iniciar o Expo:', err.message);
        cleanup(1);
      });
      mobile.on('exit', (code) => {
        if (!isCleaningUp) cleanup(code || 0);
      });
    }
  }

  tunnel.stdout.on('data', handleTunnelOutput);
  tunnel.stderr.on('data', handleTunnelOutput);

  tunnel.on('error', (err) => {
    console.error('[API tunnel] Não foi possível iniciar o túnel:', err.message);
    cleanup(1);
  });

  tunnel.on('exit', (code) => {
    if (!isCleaningUp && !mobile) {
      console.error(`[API tunnel] O processo terminou antes de disponibilizar a API (código ${code ?? 'desconhecido'}).`);
      cleanup(code || 1);
    }
  });

  if (backend) {
    backend.on('error', (err) => {
      console.error('[Backend] Não foi possível iniciar o servidor:', err.message);
      cleanup(1);
    });

    backend.on('exit', (code) => {
      if (!isCleaningUp && code !== 0) {
        console.error(`[Backend] O servidor terminou com código ${code ?? 'desconhecido'}.`);
        cleanup(code || 1);
      }
    });
  }
}

let isCleaningUp = false;
start().catch((err) => {
  console.error('[Synple] Não foi possível inicializar o túnel:', err.message);
  cleanup(1);
});

function cleanup(exitCode = 0) {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\n🛑 Encerrando Synple Backend, Túnel e Mobile...');
  try { backend?.kill(); } catch (e) {}
  try { tunnel?.kill(); } catch (e) {}
  if (mobile) {
    try { mobile.kill(); } catch (e) {}
  }

  process.exit(exitCode);
}

process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));
