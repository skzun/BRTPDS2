const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * Filtra adaptadores virtuais e identifica o IP real da máquina na rede local.
 * Descarta:
 * - VirtualBox (192.168.56.x, MAC 0a:00:27/08:00:27, nomes com vbox/virtual)
 * - Radmin VPN (26.x.x.x, nomes com radmin)
 * - APIPA (169.254.x.x)
 * - Hyper-V, WSL, Docker (nomes com vethernet, wsl, docker)
 * - VMware (MAC 00:05:69, 00:0c:29, 00:50:56, nomes com vmware)
 * - Tailscale, ZeroTier, Hamachi, Teredo, etc.
 */
function getLocalNetworkIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  const virtualKeywords = [
    'virtual', 'vbox', 'radmin', 'vmware', 'loopback',
    'vethernet', 'wsl', 'docker', 'tailscale', 'zerotier',
    'hamachi', 'tap', 'tun', 'teredo', 'bluetooth', 'pseudo'
  ];

  for (const [name, addrs] of Object.entries(interfaces)) {
    const lowerName = name.toLowerCase();
    if (virtualKeywords.some((k) => lowerName.includes(k))) {
      continue;
    }

    for (const addr of addrs) {
      if (addr.family !== 'IPv4' || addr.internal) continue;
      const ip = addr.address;

      // Descartar IPs reservados, virtuais e de link-local
      if (
        ip.startsWith('127.') ||
        ip.startsWith('169.254.') ||
        ip.startsWith('192.168.56.') || // Sub-rede host-only default do VirtualBox
        ip.startsWith('26.') // Radmin VPN
      ) {
        continue;
      }

      // Descartar MACs conhecidos de hipervisores
      const mac = (addr.mac || '').toLowerCase();
      if (
        mac.startsWith('0a:00:27') ||
        mac.startsWith('08:00:27') ||
        mac.startsWith('00:05:69') ||
        mac.startsWith('00:0c:29') ||
        mac.startsWith('00:50:56')
      ) {
        continue;
      }

      // Redes privadas padrão: 192.168.x.x, 10.x.x.x, 172.16-31.x.x
      if (ip.startsWith('192.168.')) {
        candidates.push({ ip, priority: 1 }); // Prioridade máxima: LAN comum / Wi-Fi / Ethernet
      } else if (ip.startsWith('10.') || ip.startsWith('172.')) {
        candidates.push({ ip, priority: 2 });
      } else {
        candidates.push({ ip, priority: 3 });
      }
    }
  }

  candidates.sort((a, b) => a.priority - b.priority);
  return candidates[0]?.ip || 'localhost';
}

const serverIp = getLocalNetworkIp();
const config = {
  serverIp,
  port: 3001,
  updatedAt: new Date().toISOString(),
};

const targetPath = path.resolve(__dirname, '../src/constants/network.json');
try {
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.writeFileSync(targetPath, JSON.stringify(config, null, 2), 'utf8');
  console.log(`[Synple IP Detector] Configurado IP automático da máquina: http://${serverIp}:3001`);
} catch (err) {
  console.warn('[Synple IP Detector] Erro ao gravar network.json:', err.message);
}

module.exports = { getLocalNetworkIp };
