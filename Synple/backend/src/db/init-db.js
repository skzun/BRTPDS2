const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || '123';
const DB_NAME = process.env.DB_NAME || 'Banco_synple';

async function initDatabase() {
  console.log('====================================================');
  console.log('🔄 INICIANDO CONFIGURAÇÃO DO BANCO DE DADOS SYNPLE');
  console.log('====================================================');
  console.log(`🔌 Conectando ao PostgreSQL em ${DB_HOST}:${DB_PORT} como '${DB_USER}'...`);

  // Passo 1: Conectar ao banco padrão 'postgres' para verificar/criar o banco 'Banco_synple'
  const rootClient = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: 'postgres',
  });

  try {
    await rootClient.connect();
    console.log('✅ Conexão inicial com PostgreSQL estabelecida.');

    const checkDbRes = await rootClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1 OR datname = $2',
      [DB_NAME, DB_NAME.toLowerCase()]
    );

    if (checkDbRes.rowCount === 0) {
      console.log(`📦 Criando banco de dados "${DB_NAME}"...`);
      await rootClient.query(`CREATE DATABASE "${DB_NAME}" WITH ENCODING 'UTF8';`);
      console.log(`✅ Banco de dados "${DB_NAME}" criado com sucesso!`);
    } else {
      console.log(`ℹ️ Banco de dados "${DB_NAME}" já existe.`);
    }
  } catch (err) {
    console.error('❌ Erro na verificação do banco de dados:', err.message);
    throw err;
  } finally {
    await rootClient.end();
  }

  // Passo 2: Conectar ao banco 'Banco_synple' para criar tabelas e inserir seeds
  console.log(`\n📂 Conectando ao banco de dados "${DB_NAME}"...`);
  const appClient = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  try {
    await appClient.connect();
    console.log(`✅ Conectado a "${DB_NAME}".`);

    // Executa schema.sql
    console.log('📜 Executando script DDL (schema.sql)...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await appClient.query(schemaSql);
    console.log('✅ Todas as tabelas e índices foram criados com sucesso!');

    // Passo 3: Inserir seeds iniciais
    console.log('\n🌱 Verificando dados iniciais (Seed)...');

    const adminHash = bcrypt.hashSync('Admin@123', 10);
    const marinaHash = bcrypt.hashSync('Marina@123', 10);
    const joaoHash = bcrypt.hashSync('Joao@123', 10);

    // Inserir Administrador
    const adminUser = await appClient.query(`
      INSERT INTO users (name, email, phone, password_hash, system_role, theme)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id, name, email;
    `, ['Administrador do Sistema', 'admin@synple.com', '(11) 99999-1111', adminHash, 'SYSTEM_ADMIN', 'LIGHT']);

    // Inserir Marina Costa
    const marinaUser = await appClient.query(`
      INSERT INTO users (name, email, phone, password_hash, system_role, theme)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id, name, email;
    `, ['Marina Costa', 'marina@synple.com', '(11) 99999-0000', marinaHash, 'USER', 'LIGHT']);

    // Inserir João Silva
    const joaoUser = await appClient.query(`
      INSERT INTO users (name, email, phone, password_hash, system_role, theme)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id, name, email;
    `, ['João Silva', 'joao@synple.com', '(11) 98888-2222', joaoHash, 'USER', 'LIGHT']);

    const marinaId = marinaUser.rows[0].id;
    const joaoId = joaoUser.rows[0].id;

    // Inserir Organizações pertencentes à Marina
    const orgAurora = await appClient.query(`
      INSERT INTO organizations (name, document, owner_id, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (document) DO UPDATE SET status = 'APPROVED'
      RETURNING id, name;
    `, ['Estúdio Aurora', '12.345.678/0001-90', marinaId, 'APPROVED']);

    await appClient.query(`
      INSERT INTO organizations (name, document, owner_id, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (document) DO NOTHING;
    `, ['Coletivo Horizonte', '98.765.432/0001-10', marinaId, 'APPROVED']);

    const orgAuroraId = orgAurora.rows[0].id;

    // Inserir Solicitação de Acesso pendente do João
    await appClient.query(`
      INSERT INTO access_requests (organization_id, user_id, status, organization_role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (organization_id, user_id) DO NOTHING;
    `, [orgAuroraId, joaoId, 'PENDING', 'MEMBER']);

    // Inserir Comissão inicial
    const commRes = await appClient.query(`
      SELECT id FROM commissions WHERE organization_id = $1 AND name = $2;
    `, [orgAuroraId, 'Comunicação']);

    let commId;
    if (commRes.rowCount === 0) {
      const newComm = await appClient.query(`
        INSERT INTO commissions (organization_id, name, type, description, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `, [orgAuroraId, 'Comunicação', 'Comissão', 'Divulgação e relacionamento com a comunidade.', 'ACTIVE']);
      commId = newComm.rows[0].id;
    } else {
      commId = commRes.rows[0].id;
    }

    // Associar Marina como membro coordenador da comissão
    await appClient.query(`
      INSERT INTO commission_members (commission_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (commission_id, user_id) DO NOTHING;
    `, [commId, marinaId, 'COORDINATOR']);

    // Inserir subsistemas operacionais
    const subsystems = [
      { id: 'api', name: 'API e Autenticação (Node.js/Express)', status: 'ONLINE' },
      { id: 'database', name: 'Banco de Dados (PostgreSQL 18 - Banco_synple)', status: 'ONLINE' },
      { id: 'notifications', name: 'Serviço de Notificações e Fila', status: 'ONLINE' },
    ];

    for (const sub of subsystems) {
      await appClient.query(`
        INSERT INTO system_subsystems (id, name, status, last_check)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, last_check = NOW();
      `, [sub.id, sub.name, sub.status]);
    }

    console.log('✅ Seeds aplicadas com sucesso!');
    console.log('----------------------------------------------------');
    console.log('👥 USUÁRIOS DE TESTE PRONTOS NO POSTGRESQL:');
    console.log('  1. admin@synple.com  | Senha: Admin@123  (SYSTEM_ADMIN)');
    console.log('  2. marina@synple.com | Senha: Marina@123 (USER / Admin Org)');
    console.log('  3. joao@synple.com   | Senha: Joao@123   (USER)');
    console.log('====================================================');
    console.log('🎉 BANCO DE DADOS POSTGRESQL PRONTO PARA USO!');
  } catch (err) {
    console.error('❌ Erro durante a configuração das tabelas/seeds:', err);
    throw err;
  } finally {
    await appClient.end();
  }
}

if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { initDatabase };
