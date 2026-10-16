const fs = require('fs');
const os = require('os');
const path = require('path');

// Detecta o IPv4 atual do computador para o Expo Go na mesma rede Wi-Fi.
// Nenhum IP fixo da rede doméstica é salvo no código-fonte.
function getLocalNetworkIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [interfaceName, addresses] of Object.entries(interfaces)) {
    for (const address of addresses || []) {
      if (address.family !== 'IPv4' || address.internal || !isPrivateNetwork(address.address)) continue;

      const isVirtual = /vpn|virtual|vbox|vmware|hyper-v|wsl|docker|teredo/i.test(interfaceName)
        || /^0a:00:27/i.test(address.mac || '');

      candidates.push({ address: address.address, isVirtual });
    }
  }

  const physicalNetwork = candidates.find((candidate) => !candidate.isVirtual);
  return physicalNetwork?.address || candidates[0]?.address || 'localhost';
}

function isPrivateNetwork(ip) {
  const [first, second] = ip.split('.').map(Number);
  return first === 10
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168);
}

const serverIp = getLocalNetworkIp();
const config = {
  serverIp,
  port: 3001,
  updatedAt: new Date().toISOString(),
};

// Expo carrega .env.local ao iniciar e o arquivo já é ignorado pelo Git.
// Assim, o IP atual não é versionado junto com o código.
const targetPath = path.resolve(__dirname, '../.env.local');
try {
  fs.writeFileSync(targetPath, `EXPO_PUBLIC_API_URL=http://${serverIp}:${config.port}/api\n`, 'utf8');
  console.log(`[Synple API] Expo Go: http://${serverIp}:3001 | Emulador/Web: localhost:3001`);
} catch (err) {
  console.warn('[Synple API] Erro ao gravar .env.local:', err.message);
}

module.exports = { getLocalNetworkIp };
