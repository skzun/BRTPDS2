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

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Registro dos endpoints da API
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/commissions', commissionsRoutes);

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
    ],
  });
});

// Inicialização do servidor
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('----------------------------------------------------');
    console.log(`🚀 SYNPLE BACKEND ONLINE EM: http://localhost:${PORT}`);
    console.log(`🗄️  CONECTADO AO POSTGRESQL: ${process.env.DB_NAME || 'Banco_synple'}`);
    console.log('----------------------------------------------------');
  });
}

module.exports = app;
