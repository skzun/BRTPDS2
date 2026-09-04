# BRTPDS2 - Synple

Projeto da disciplina Projeto e Desenvolvimento de Sistemas 2. O Incremento 1 do Synple é um aplicativo Expo/React Native para demonstração do cadastro e gerenciamento de organizações, usuários, acessos e comissões.

## Executar o aplicativo

```powershell
cd Synple/mobile
npm install
npm start
```

Use Expo Go ou um emulador para abrir o projeto.

## Verificações

```powershell
cd Synple/mobile
npm test
```

As regras de validação do Incremento 1 ficam em `src/services/validation.js` e possuem testes automatizados. Os dados continuam locais, em AsyncStorage, pois este incremento ainda não possui backend.
