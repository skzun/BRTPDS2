# BRTPDS2 - Synple

Projeto da disciplina Projeto e Desenvolvimento de Sistemas 2. O Incremento 1 do Synple é um aplicativo Expo/React Native para demonstração do cadastro e gerenciamento de organizações, usuários, acessos e comissões.

## Executar o Backend e Banco de Dados (PostgreSQL)

O sistema conta com backend Node.js integrado ao PostgreSQL (banco `Banco_synple`):

1. **Configurar e inicializar o banco de dados:**
```powershell
cd Synple/backend
npm install
npm run init-db
```
*(O comando acima cria o banco `Banco_synple` caso não exista, aplica o DDL `schema.sql` com as 6 tabelas oficiais e insere os dados e usuários de teste).*

2. **Iniciar o servidor da API:**
```powershell
npm start
```
A API ficará disponível em `http://localhost:3001` com endpoints de saúde, sincronização e autenticação.

3. **Executar os testes automatizados do backend:**
```powershell
npm test
```

## Executar o aplicativo mobile

```powershell
cd Synple/mobile
npm install
npm start
```

Use Expo Go ou um emulador para abrir o projeto. O app opera em modo **Offline-First**, sincronizando automaticamente com o PostgreSQL sempre que a API estiver online.

## Verificações de testes mobile

```powershell
cd Synple/mobile
npm test
```

## 📖 Documentação

* 📄 [Especificação Completa do Incremento 1](./docs/incremento-1-especificacao-completa.md)
* 👥 [Guia de Usuários de Teste e Avaliação](./docs/usuarios-de-teste.md)
* 🌐 [Wiki Oficial do Projeto no GitHub](https://github.com/skzun/BRTPDS2/wiki)
