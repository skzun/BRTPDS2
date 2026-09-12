# Guia de Demonstração e Usuários de Teste

Para facilitar a avaliação prática pelo professor e equipe, o aplicativo **Synple** já vem pré-configurado com 3 perfis de usuários para testes imediatos sem necessidade de criar novos cadastros manualmente.

---

## 👥 Contas Pré-Configuradas

| Papel / Perfil | Nome | E-mail de Login | Senha de Acesso | Permissões / Escopo |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador Geral** | Administrador | `admin@synple.com` | `Admin@123` | Acesso completo a comissões, reuniões e configurações globais |
| **Usuário 1 (Membro)** | Marina Silva | `marina@synple.com` | `Marina@123` | Participação em comissões, agendamento de reuniões e perfil |
| **Usuário 2 (Membro)** | João Santos | `joao@synple.com` | `Joao@123` | Participação em comissões, agendamento de reuniões e perfil |

> **Critérios de Senha Atendidos:** Todas as senhas atendem à política de segurança do sistema: no mínimo 6 caracteres, pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial (`@`).

---

## 🚀 Roteiro de Testes Recomendado

Para conferir todos os requisitos exigidos nos slides:

### 1. Teste de Login e Validações
1. Abra o app móvel.
2. Tente logar com senha incorreta: observe o feedback de erro imediato.
3. Insira as credenciais do Administrador (`admin@synple.com` / `Admin@123`) e acesse o Dashboard.

### 2. Teste de Recuperação de Senha (RF05)
1. Na tela de login, clique em **"Esqueci minha senha"**.
2. Digite o e-mail cadastrado (ex: `marina@synple.com`).
3. O sistema simula o envio do link seguro com token criptografado para o e-mail do usuário.
4. Clique no link recebido para redefinir a senha com as regras de complexidade e confirme a alteração.

### 3. Teste de Alternância de Tema (Claro / Escuro - RF07)
1. Acesse o menu **Perfil**.
2. Alterne a chave de **Tema Preferido** entre **Claro** e **Escuro**.
3. Verifique que cores de fundo, cartões, tipografia, bordas e a barra de status do sistema (`StatusBar`) se adaptam dinamicamente e sem falhas visuais.

### 4. Teste de Cadastro de Novo Usuário com Máscaras e Regras (RF01)
1. Na tela de login, toque em **"Não tem uma conta? Cadastre-se"**.
2. Digite um telefone com menos de 10 dígitos ou um CNPJ com formato inválido para conferir o bloqueio amigável.
3. Complete os dados com um número válido (10 ou 11 dígitos com DDD) e senha forte para concluir o cadastro.

### 5. Gestão de Comissões e Convites (RF08 a RF12)
1. Crie uma nova comissão no painel.
2. Adicione membros à comissão e gere um link de convite único.
3. Teste a aceitação ou recusa do convite com outro usuário logado.
