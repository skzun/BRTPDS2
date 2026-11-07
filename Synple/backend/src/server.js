const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Importação das rotas modulares
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');
const usersRoutes = require('./routes/users');
const organizationsRoutes = require('./routes/organizations');
const commissionsRoutes = require('./routes/commissions');
const meetingsRoutes = require('./routes/meetings');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '8mb' }));
const security = require('./services/security');
const { authorize } = require('./services/authorization');
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || /^\/auth\/(login|register|google|forgot-password|reset-password|verify-email|resend-activation)$/.test(req.path)) return next();
  security.authenticate(req, res, next);
});
app.use('/api', (req, res, next) => req.auth ? security.bindActor(req, res, next) : next());
app.use('/api', (req, res, next) => req.auth ? authorize(req, res, next) : next());
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[HTTP] ${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Registro dos endpoints da API
app.use('/api/health', healthRoutes);
app.use('/api/system', require('./routes/system'));
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/commissions', commissionsRoutes);
app.use('/api/meetings', meetingsRoutes);

app.use((error, req, res, next) => {
  console.error('[API]', error.message);
  if (!res.headersSent) res.status(500).json({ error: 'Não foi possível concluir a operação.' });
});

// Rota raiz informativa
app.get('/', (req, res) => {
  res.json({
    name: 'Synple API Backend',
    version: '1.0.0',
    database: process.env.DB_NAME || 'Banco_synple',
    endpoints: [
      '/api/health',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/change-password',
      '/api/sync',
      '/api/users/:id',
      '/api/organizations',
      '/api/commissions',
      '/api/meetings',
    ],
  });
});

// Detecção dinâmica de IP da máquina local
const { getLocalNetworkIp, updateMobileNetworkConfig } = require('./utils/network');

// Inicialização do servidor
if (require.main === module) {
  const { migrateSchema } = require('./db/migrate');
  migrateSchema().then(() => {
    const localIp = getLocalNetworkIp();
    updateMobileNetworkConfig(localIp, PORT);
    app.listen(PORT, '0.0.0.0', () => {
      console.log('----------------------------------------------------');
      console.log(`🚀 SYNPLE BACKEND ONLINE EM: http://${localIp}:${PORT}`);
      console.log(`🗄️  CONECTADO AO POSTGRESQL: ${process.env.DB_NAME || 'Banco_synple'}`);
      console.log(`📱 IP CONFIGURADO AUTOMATICAMENTE: ${localIp}`);
      console.log('----------------------------------------------------');
    });
  }).catch(async (error) => {
    console.error('[Banco] Não foi possível preparar o schema:', error.message);
    await require('./db/connection').pool.end();
    process.exitCode = 1;
  });
}

module.exports = app;
