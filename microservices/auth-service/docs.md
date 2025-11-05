# 🔐 API de Autenticação - Checkpoint

## Base URL
```
http://checkpoint.localhost/api/auth
```

## 📋 Formato de Resposta Padronizado

A API utiliza um formato padronizado para todas as respostas:

### Resposta de Sucesso
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* dados específicos */ },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### Resposta de Erro
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": { /* detalhes adicionais (opcional) */ },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Códigos de Erro Comuns:**
- `VALIDATION_ERROR` - Erro de validação de dados
- `INVALID_CREDENTIALS` - Email ou senha inválidos
- `INVALID_TOKEN` - Token inválido ou expirado
- `TOKEN_REQUIRED` - Token de autenticação necessário
- `TOKEN_MISMATCH` - Tokens não correspondem
- `INVALID_TOKEN_FORMAT` - Formato de token inválido
- `REFRESH_TOKEN_ERROR` - Erro ao renovar token
- `USERNAME_EXISTS` - Nome de usuário já existe
- `EMAIL_EXISTS` - Email já existe
- `USER_NOT_FOUND` - Usuário não encontrado
- `ADMIN_TOKEN_REQUIRED` - Token de administrador necessário para criar conta de admin
- `UNAUTHORIZED` - Sem permissão para a operação
- `EMAIL_REQUIRED` - Email é obrigatório
- `TOKEN_AND_PASSWORD_REQUIRED` - Token e nova senha são obrigatórios
- `INVALID_RESET_TOKEN` - Token de reset inválido ou expirado
- `RESET_REQUEST_FAILED` - Falha ao processar solicitação de reset
- `RESET_PASSWORD_FAILED` - Falha ao resetar senha
- `DATABASE_ERROR` - Erro no banco de dados
- `INTERNAL_ERROR` - Erro interno do servidor

---

## 🔐 Endpoints de Autenticação

### 1. Health Check
**GET** `/health`

Verifica o status do serviço.

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "OK"
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

### 2. Login
**POST** `/login`

Autentica um usuário e retorna tokens de acesso.

**Body**:
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Logged in successfully as username.",
  "data": {
    "userId": 123,
    "username": "usuario",
    "userRole": "Player"
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Cookies Set**:
- `accessToken`: JWT válido por 1 hora
- `refreshToken`: JWT válido por 7 dias

**Status Codes:**
- `200`: Login bem-sucedido
- `401`: Credenciais inválidas ou erro de validação

**Resposta de Erro:**
```json
{
  "success": false,
  "message": "Invalid email or password.",
  "error": "INVALID_CREDENTIALS",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

### 3. Registro
**POST** `/register`

Cria uma nova conta de usuário. Suporta upload de foto de perfil via `multipart/form-data`.

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
```
username: "novousuario"
email: "novo@email.com"
password: "senha123"
userRole: "Player"
ProfileFile: [FILE] // campo opcional para foto de perfil
```

**Roles Disponíveis**: `Visitor`, `Player`, `Organizer`, `Administrator`

---

### 4. Refresh Token
**POST** `/refresh-token`

Renova os tokens de acesso usando o refresh token.

**Cookies Requeridos**:
- `refreshToken`
- `accessToken` (último token expirado)

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "userId": 123,
    "username": "usuario",
    "userRole": "Player"
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Cookies Updated**:
- `accessToken`: Novo JWT válido por 1 hora
- `refreshToken`: Novo JWT válido por 7 dias

**Status Codes:**
- `200`: Tokens renovados com sucesso
- `401`: Tokens inválidos, ausentes ou não correspondem

**Resposta de Erro:**
```json
{
  "success": false,
  "message": "Invalid refresh token",
  "error": "REFRESH_TOKEN_ERROR",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

### 5. Logout
**POST** `/logout`

Realiza logout do usuário, invalidando os tokens.

**Cookies Opcionais**:
- `refreshToken` (se presente, será removido do Redis)

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "User successfully logged out.",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Cookies Cleared**:
- `accessToken`
- `refreshToken`

**Status Codes:**
- `200`: Logout bem-sucedido

---

### 6. Deletar Conta
**DELETE** `/delete-account`

Remove permanentemente a conta do usuário (soft delete).

**Headers**:
```
Cookie: accessToken=<token>
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Account deleted successfully.",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Cookies Cleared**:
- `accessToken`
- `refreshToken`

**Status Codes:**
- `200`: Conta deletada com sucesso
- `401`: Token inválido ou ausente
- `404`: Usuário não encontrado ou já deletado
- `500`: Erro no banco de dados

**Resposta de Erro:**
```json
{
  "success": false,
  "message": "User not found or already deleted.",
  "error": "USER_NOT_FOUND",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

### 7. Obter Informações do Usuário Atual
**GET** `/me`

Retorna informações do usuário autenticado baseado no token.

**Headers**:
```
Cookie: accessToken=<token>
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "User information retrieved successfully",
  "data": {
    "userId": 123,
    "username": "usuario",
    "userRole": "Player",
    "email": "usuario@email.com",
    "profileURL": "/uploads/profiles/profile-1234-1234.png",
    "eventsHistory": [
      {
        "registrationId": 10,
        "eventId": 1,
        "title": "Summer CS2 Cup",
        "startDate": "2024-06-01T14:00:00.000Z",
        "endDate": "2024-06-03T20:00:00.000Z",
        "status": "Approved",
        "registeredAt": "2024-05-20T10:00:00.000Z"
      },
      {
        "registrationId": 7,
        "eventId": 3,
        "title": "Local LAN Party",
        "startDate": "2023-11-10T18:00:00.000Z",
        "endDate": "2023-11-10T23:00:00.000Z",
        "status": "Cancelled",
        "registeredAt": "2023-10-01T09:00:00.000Z"
      }
    ]
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Status Codes:**
- `200`: Informações retornadas com sucesso
- `401`: Token inválido ou ausente

**Resposta de Erro:**
```json
{
  "success": false,
  "message": "Authentication token required.",
  "error": "TOKEN_REQUIRED",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

Notes:
- `email` is returned for the authenticated user (the `/me` endpoint). If you want to restrict email visibility further, we can add additional policy checks.
- `eventsHistory` is an array of past and current event registrations for the user. Each item contains `registrationId`, `eventId`, `title`, `startDate`, `endDate`, `status` and `registeredAt`. The service only returns registrations and events that are not soft-deleted.
 - `eventsHistory` is an array of past and current event registrations for the user. Each item contains `registrationId`, `eventId`, `title`, `startDate`, `endDate`, `status` and `registeredAt`.
 - Items may also include `viaTeam` (boolean), and when true, `teamId` and `teamName` indicating the team through which the user participated. The service only returns registrations and events that are not soft-deleted.

---

### 8. Atualizar Informações do Usuário
**PUT** `/update-info`

Atualiza informações do usuário autenticado. Permite alterar `username`, `email`, `userRole` e/ou foto de perfil.

**Headers:**
```
Cookie: accessToken=<token>
Content-Type: multipart/form-data
```

**Form Data:**
```
username: "novonome" (opcional)
email: "novo@email.com" (opcional)
userRole: "Player" | "Organizer" | "Visitor" | "Administrator" (opcional)
ProfileFile: [FILE] // campo opcional para foto de perfil
```

**Validações:**
- Se `username` ou `email` já existirem para outro usuário, retorna erro.
- Se nenhum campo válido for enviado, retorna erro.
- Para alterar para `Administrator`, é necessário já ser `Administrator`.

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "User info updated successfully.",
  "data": {
    "userId": 123,
    "username": "novonome",
    "userRole": "Player",
    "email": "novo@email.com",
    "profileURL": "/uploads/profiles/profile-1234-1234.png"
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Status Codes:**
- `200`: Informações atualizadas com sucesso
- `400`: Dados inválidos, username ou email já existente, nenhum campo válido
- `401`: Token inválido ou ausente
- `404`: Usuário não encontrado ou já deletado
- `500`: Erro no banco de dados

**Resposta de Erro (Username Existente):**
```json
{
  "success": false,
  "message": "Username already exists.",
  "error": "USERNAME_EXISTS",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Resposta de Erro (Email Existente):**
```json
{
  "success": false,
  "message": "Email already exists.",
  "error": "EMAIL_EXISTS",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Resposta de Erro (Campos Inválidos):**
```json
{
  "success": false,
  "message": "No valid fields to update.",
  "error": "VALIDATION_ERROR",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Exemplo de Uso:**
```bash
curl -X PUT http://checkpoint.localhost/api/auth/update-info \
  -H "Cookie: accessToken=your_token" \
  -F "username=novonome" \
  -F "email=novo@email.com" \
  -F "ProfileFile=@/caminho/para/foto.png"
```

---

### 9. Recuperação de Senha

#### 9.1 Solicitar Reset
**POST** `/request-password-reset`

Envia um email com link para resetar a senha.

**Body**:
```json
{
  "email": "usuario@email.com"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "If your email is registered, you will receive reset instructions.",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Nota**: A resposta sempre retorna sucesso, mesmo se o email não existir, para prevenir enumeração de emails.

**Status Codes:**
- `200`: Solicitação processada (sempre retorna sucesso)
- `400`: Email não fornecido
- `500`: Erro ao processar solicitação

**Resposta de Erro:**
```json
{
  "success": false,
  "message": "Email is required.",
  "error": "EMAIL_REQUIRED",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

#### 9.2 Resetar Senha
**POST** `/reset-password`

Reseta a senha usando o token recebido por email.

**Body**:
```json
{
  "token": "token_recebido_no_email",
  "newPassword": "nova_senha"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Password has been reset successfully.",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Nota**: Após o reset bem-sucedido, todos os refresh tokens do usuário são invalidados por segurança.

**Status Codes:**
- `200`: Senha resetada com sucesso
- `400`: Token ou nova senha não fornecidos
- `401`: Token de reset inválido ou expirado
- `404`: Usuário não encontrado
- `500`: Erro ao resetar senha

**Resposta de Erro (Token Inválido):**
```json
{
  "success": false,
  "message": "Invalid or expired reset token.",
  "error": "INVALID_RESET_TOKEN",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Resposta de Erro (Campos Obrigatórios):**
```json
{
  "success": false,
  "message": "Token and new password are required.",
  "error": "TOKEN_AND_PASSWORD_REQUIRED",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

## 🚨 Tratamento de Erros

### Códigos de Status HTTP
- `200`: Sucesso
- `400`: Dados inválidos ou validação falhou
- `401`: Token inválido, não fornecido ou credenciais inválidas
- `404`: Recurso não encontrado
- `500`: Erro interno do servidor

### Exemplo de Resposta de Erro com Detalhes:
```json
{
  "success": false,
  "message": "Database error",
  "error": "DATABASE_ERROR",
  "details": "Connection timeout",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

## 🔒 Segurança

### Tokens JWT
- **Access Token**: 1 hora de validade
- **Refresh Token**: 7 dias de validade
- **Algoritmo**: HS256
- **Armazenamento**: Cookies HTTP-only e Secure

### Hash de Senhas
- **Biblioteca**: bcrypt
- **Salt Rounds**: 10

### Reset de Senha
- **Validade do Token**: 15 minutos
- **Uso Único**: Token é deletado após uso
- **Segurança**: Todos os refresh tokens são invalidados após reset

### Proteções
- Rate limiting no Nginx
- Tokens armazenados em Redis
- Validação de entrada com Yup
- Cookies HTTP-only e Secure
- Prevenção de enumeração de emails no reset de senha

---

## 📊 Exemplos de Uso

### Login
```bash
curl -X POST http://checkpoint.localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@email.com",
    "password": "senha123"
  }'
```

### Registro
```bash
curl -X POST http://checkpoint.localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "novousuario",
    "email": "novo@email.com",
    "password": "senha123",
    "userRole": "Player"
  }'
```

### Refresh Token
```bash
curl -X POST http://checkpoint.localhost/api/auth/refresh-token \
  -H "Cookie: accessToken=old_token; refreshToken=refresh_token"
```

### Obter Informações do Usuário
```bash
curl http://checkpoint.localhost/api/auth/me \
  -H "Cookie: accessToken=your_token"
```

### Solicitar Reset de Senha
```bash
curl -X POST http://checkpoint.localhost/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@email.com"
  }'
```

### Resetar Senha
```bash
curl -X POST http://checkpoint.localhost/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "token_recebido_no_email",
    "newPassword": "nova_senha_segura"
  }'
```

### Logout
```bash
curl -X POST http://checkpoint.localhost/api/auth/logout \
  -H "Cookie: refreshToken=your_refresh_token"
```

---

## 📝 Notas Importantes

1. **Cookies**: Os tokens são automaticamente gerenciados via cookies HTTP-only, o que oferece maior segurança contra ataques XSS.

2. **Autenticação**: A maioria dos endpoints requer autenticação via cookie `accessToken`. O endpoint `/me` também requer autenticação.

3. **Refresh Token**: O refresh token deve ser usado antes do access token expirar. Após a expiração, é necessário fazer login novamente.

4. **Reset de Senha**: O token de reset é enviado por email e expira em 15 minutos. Após o uso, o token é invalidado.

5. **Roles de Administrador**: Apenas usuários com role `Administrator` podem criar novas contas de administrador.

6. **Timestamp**: Todas as respostas incluem um campo `timestamp` com a data/hora da resposta em formato ISO 8601.

