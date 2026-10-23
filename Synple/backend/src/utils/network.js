const fs = require('fs');
const path = require('path');

// A API Docker é publicada na máquina local. Não detectamos nem gravamos IPs
// de rede, para que o projeto possa ser executado em qualquer computador.
function getLocalNetworkIp() {
  return 'localhost';
}

function updateMobileNetworkConfig(_ip = null, port = 3001) {
  const config = {
    serverIp: getLocalNetworkIp(),
    port,
    updatedAt: new Date().toISOString(),
  };

  const targetPath = path.resolve(__dirname, '../../../mobile/src/constants/network.json');
  try {
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(targetPath, JSON.stringify(config, null, 2), 'utf8');
    return config;
  } catch (err) {
    console.warn('[Network] Não foi possível gravar network.json:', err.message);
    return config;
  }
}

module.exports = {
  getLocalNetworkIp,
  updateMobileNetworkConfig,
};
