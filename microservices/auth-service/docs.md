## Base URL
```
http://checkpoint.localhost/api/auth
```

## 🔐 Endpoints de Autenticação

### 1. Login
**POST** `/login`

Autentica um usuário e retorna tokens de acesso.

**Body**:
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Resposta**:
```json
{
  "message": "Logged in successfully as username.",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Cookies Set**:
- `accessToken`: JWT válido por 1 hora
- `refreshToken`: JWT válido por 7 dias

---

### 2. Registro
**POST** `/register`

Cria uma nova conta de usuário.

**Body**:
```json
{
  "username": "novousuario",
  "email": "novo@email.com",
  "password": "senha123",
  "userRole": "Player"
}
```

**Roles Disponíveis**: `Visitor`, `Player`, `Organizer`, `Administrator`

**Resposta**:
```json
{
  "message": "User novousuario registered successfully as Player.",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

### 3. Refresh Token
**POST** `/refresh-token`

Renova os tokens de acesso usando o refresh token.

**Cookies Requeridos**:
- `refreshToken`
- `accessToken` (último token expirado)

**Resposta**:
```json
{
  "message": "Token refreshed successfully."
}
```

---

### 4. Logout
**POST** `/logout`

Realiza logout do usuário, invalidando os tokens.

**Resposta**:
```json
{
  "message": "User successfully logged out."
}
```

---

### 5. Deletar Conta
**DELETE** `/delete-account`

Remove permanentemente a conta do usuário.

**Headers**:
```
Cookie: accessToken=<token>
```

**Resposta**:
```json
{
  "message": "Account deleted successfully."
}
```

---

### 6. Recuperação de Senha

#### Solicitar Reset
**POST** `/request-password-reset`

**Body**:
```json
{
  "email": "usuario@email.com"
}
```

**Resposta**:
```json
{
  "message": "If your email is registered, you will receive reset instructions."
}
```

#### Resetar Senha
**POST** `/reset-password`

**Body**:
```json
{
  "token": "token_recebido_no_email",
  "newPassword": "nova_senha"
}
```

**Resposta**:
```json
{
  "message": "Password has been reset successfully."
}
```

---

### 7. Health Check
**GET** `/health`

**Resposta**:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

## 🔒 Segurança

### Tokens JWT
- **Access Token**: 1 hora de validade
- **Refresh Token**: 7 dias de validade
- **Algoritmo**: HS256

### Hash de Senhas
- **Biblioteca**: bcrypt
- **Salt Rounds**: 10

### Proteções
- Rate limiting no Nginx
- Tokens armazenados em Redis
- Validação de entrada com Yup
- Cookies HTTP-only e Secure
