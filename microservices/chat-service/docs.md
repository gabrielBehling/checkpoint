# 💬 API de Chat - Checkpoint

## Base URL

```
https://checkpoint.buzz/api/chat
```

## 🔐 Autenticação

Todos os endpoints (exceto `GET /events/:eventId/comments`) requerem autenticação via JWT token armazenado em cookies (`accessToken`). O Socket.IO também utiliza autenticação via cookie.

## 📋 Formato de Resposta Padronizado

### Resposta de Sucesso (HTTP)

```json
{
  "success": true
}
```

### Resposta de Erro (HTTP)

```json
{
  "error": "Error description"
}
```

### Resposta de Array (MongoDB)

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "author": "john_doe",
    "userId": "123",
    "message": "Hello!",
    "type": "text",
    "teamId": "1",
    "timestamp": "2024-01-01T10:00:00.000Z"
  }
]
```

**Códigos de Erro Comuns:**

- `Access token missing` - Token JWT ausente
- `Invalid access token` - Token JWT inválido
- `Not authorized` - Sem permissão para a operação
- `Arquivo não encontrado` - Recurso não encontrado
- `Failed to...` - Erro interno do servidor

---

## 📋 Endpoints HTTP

### 1. Upload de Arquivo

**POST** `/upload`

Faz upload de imagem ou áudio e envia automaticamente para o chat da equipe.

**Headers:**

```
Cookie: accessToken=<jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**

```
file: [FILE]              // Arquivo de imagem ou áudio
type: "image" | "audio"   // Tipo do arquivo
teamId: "1"              // ID da equipe
```

**Campos Obrigatórios:**

- `file` (File) - Arquivo de imagem ou áudio
- `type` (string) - Tipo do arquivo ("image" ou "audio")
- `teamId` (string) - ID da equipe

**Resposta de Sucesso:**

```json
{
  "success": true
}
```

**Status Codes:**

- `200`: Upload realizado com sucesso
- `400`: Dados inválidos ou tipo de arquivo não suportado
- `401`: Não autenticado (JWT inválido ou ausente)
- `403`: Usuário não é membro da equipe
- `500`: Erro interno do servidor

**Notas:**

- Apenas imagens (`image/*`) e áudios (`audio/*`) são suportados
- Arquivos são salvos em `/uploads` com formato: `[timestamp]-[nome_original]`
- A mensagem é automaticamente transmitida via Socket.IO para todos os membros conectados
- O Events Service é consultado para verificar se o usuário é membro da equipe

---

### 2. Buscar Mensagens de uma Equipe

**GET** `/messages/:teamId`

Retorna o histórico de mensagens de uma equipe específica.

**Headers:**

```
Cookie: accessToken=<jwt_token>
```

**Parâmetros:**

- `teamId` (string) - ID da equipe

**Resposta de Sucesso:**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "author": "john_doe",
    "userId": "123",
    "message": "Hello team!",
    "type": "text",
    "teamId": "1",
    "timestamp": "2024-01-01T10:00:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "author": "jane_doe",
    "userId": "456",
    "type": "image",
    "fileUrl": "/uploads/1234567890-image.jpg",
    "teamId": "1",
    "timestamp": "2024-01-01T10:05:00.000Z"
  }
]
```

**Status Codes:**

- `200`: Mensagens retornadas com sucesso
- `401`: Não autenticado (JWT inválido ou ausente)
- `403`: Usuário não é membro da equipe
- `500`: Erro interno do servidor

**Notas:**

- Mensagens são ordenadas por `timestamp` ascendente (mais antigas primeiro)
- O Events Service é consultado para verificar se o usuário é membro da equipe
- Timeout de 3 segundos para consulta ao Events Service

---

### 3. Criar Comentário em Evento

**POST** `/events/:eventId/comments`

Cria um comentário público em um evento.

**Headers:**

```
Cookie: accessToken=<jwt_token>
Content-Type: application/json
```

**Parâmetros:**

- `eventId` (string) - ID do evento

**Body:**

```json
{
  "content": "Great event!"
}
```

**Campos Obrigatórios:**

- `content` (string) - Conteúdo do comentário

**Resposta de Sucesso (201):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "author": "john_doe",
  "userId": "123",
  "message": "Great event!",
  "type": "comment",
  "eventId": "1",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Status Codes:**

- `201`: Comentário criado com sucesso
- `400`: Dados inválidos (conteúdo vazio ou ausente)
- `401`: Não autenticado (JWT inválido ou ausente)
- `500`: Erro interno do servidor

**Notas:**

- Comentários são públicos e visíveis para todos
- Qualquer usuário autenticado pode criar comentários
- Não há limite de caracteres no backend (validar no frontend se necessário)

---

### 4. Listar Comentários de um Evento

**GET** `/events/:eventId/comments`

Retorna os comentários de um evento específico (público - não requer autenticação).

**Parâmetros:**

- `eventId` (string) - ID do evento

**Resposta de Sucesso:**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "author": "john_doe",
    "userId": "123",
    "message": "Great event!",
    "type": "comment",
    "eventId": "1",
    "timestamp": "2024-01-01T10:00:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "author": "jane_doe",
    "userId": "456",
    "message": "Looking forward to it!",
    "type": "comment",
    "eventId": "1",
    "timestamp": "2024-01-01T09:30:00.000Z"
  }
]
```

**Status Codes:**

- `200`: Comentários retornados com sucesso
- `500`: Erro interno do servidor

**Notas:**

- Endpoint **público** - não requer autenticação
- Retorna até 100 comentários mais recentes
- Ordenados por `timestamp` decrescente (mais recentes primeiro)
- Query: `{ eventId: eventId, type: 'comment' }`

---

### 5. Servir Arquivo Enviado

**GET** `/upload/:filename`

Serve um arquivo de upload (imagem ou áudio) previamente enviado.

**Parâmetros:**

- `filename` (string) - Nome do arquivo

**Resposta de Sucesso:**

- Retorna o arquivo solicitado (stream de bytes)

**Status Codes:**

- `200`: Arquivo encontrado e retornado
- `404`: Arquivo não encontrado

**Exemplo:**

```
GET /api/chat/upload/1234567890-image.jpg
```

**Notas:**

- Arquivos são servidos do diretório `/app/Implementacao_Socket_Teste/uploads`
- Não requer autenticação (arquivos são públicos após upload)
- Verificação de existência do arquivo antes de servir

---

## 🔌 Socket.IO

### Conexão

**URL:** `https://checkpoint.buzz`  
**Path:** `/api/chat/socket.io`

**Configuração do Cliente:**

```javascript
const socket = io("https://checkpoint.buzz", {
  path: "/api/chat/socket.io",
  withCredentials: true,
  reconnectionAttempts: 5,
  timeout: 10000,
});
```

**Autenticação:**

- O JWT é enviado automaticamente via cookie (`accessToken`)
- Token é extraído do header `cookie` na conexão
- Se o token for inválido ou ausente, a conexão é rejeitada (`socket.disconnect()`)
- Validação: `jwt.verify(accessToken, JWT_SECRET, { maxAge: "1h" })`

**Validações de Conexão:**

- `userId` e `username` devem estar presentes no JWT
- Se ausentes, a conexão é rejeitada com log de erro

---

### Eventos Emitidos pelo Cliente

#### 1. `joinTeam`

Entrar em uma sala de equipe para receber mensagens em tempo real.

**Payload:**

```javascript
socket.emit("joinTeam", teamId);
```

**Parâmetros:**

- `teamId` (string) - ID da equipe

**Validações:**

- Usuário deve ser membro da equipe (verificado via Events Service)
- Consulta: `GET /teams/:teamId` com cookie de autenticação
- Timeout de 3 segundos para verificação
- Se não autorizado, recebe evento `authError`

**Comportamento:**

- Usuário entra na sala Socket.IO correspondente ao `teamId`
- Log: `[SOCKET_JOIN] Usuário {username} (ID: {socketId}) entrou na sala {teamId}`
- Se rejeitado: `[SOCKET_REJECT] REJEITADO: {username} tentou entrar na sala {teamId}`

**Exemplo:**

```javascript
socket.emit("joinTeam", "1");
```

---

#### 2. `sendMessage`

Enviar uma mensagem de texto para a equipe.

**Payload:**

```javascript
socket.emit("sendMessage", {
  message: "Hello team!",
  teamId: "1",
});
```

**Campos:**

- `message` (string, obrigatório) - Conteúdo da mensagem
- `teamId` (string, obrigatório) - ID da equipe

**Validações:**

- Usuário deve ser membro da equipe (verificado via Events Service)
- Mensagem não pode estar vazia
- Se não autorizado, recebe evento `authError`

**Comportamento:**

- Mensagem é salva no MongoDB com tipo `text`
- Transmitida para todos os membros conectados da equipe via `receivedMessage`
- `author` e `userId` são extraídos do JWT automaticamente
- Log: `[SOCKET_REJECT] REJEITADO: {username} tentou ENVIAR MSG para sala {teamId}` (se rejeitado)

**Exemplo:**

```javascript
socket.emit("sendMessage", {
  message: "Good luck everyone!",
  teamId: "1",
});
```

---

### Eventos Recebidos pelo Cliente

#### 1. `connect`

Disparado quando o cliente se conecta com sucesso ao servidor.

**Exemplo:**

```javascript
socket.on("connect", () => {
  console.log("Connected to chat server");
  console.log("Socket ID:", socket.id);
});
```

**Notas:**

- Conexão só é estabelecida se o JWT for válido
- `socket.id` é gerado automaticamente pelo servidor

---

#### 2. `disconnect`

Disparado quando o cliente se desconecta do servidor.

**Exemplo:**

```javascript
socket.on("disconnect", () => {
  console.log("Disconnected from chat server");
});
```

**Causas:**

- Perda de conexão de rede
- Servidor foi reiniciado
- Cliente fechou a página/aplicação

---

#### 3. `connect_error`

Disparado quando há erro na conexão.

**Payload:**

```javascript
{
  message: "Error description";
}
```

**Exemplo:**

```javascript
socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
});
```

**Causas:**

- JWT inválido ou expirado
- Servidor indisponível
- Configuração incorreta do path

---

#### 4. `receivedMessage`

Disparado quando uma nova mensagem é recebida na equipe.

**Payload:**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "author": "john_doe",
  "userId": "123",
  "message": "Hello team!",
  "type": "text",
  "teamId": "1",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Tipos de Mensagem:**

- `type: "text"` - Mensagem de texto
- `type: "image"` - Imagem enviada
- `type: "audio"` - Áudio enviado

**Exemplo:**

```javascript
socket.on("receivedMessage", (message) => {
  console.log("New message:", message);

  if (message.type === "text") {
    displayTextMessage(message);
  } else if (message.type === "image") {
    displayImageMessage(message);
  } else if (message.type === "audio") {
    displayAudioMessage(message);
  }
});
```

**Notas:**

- Todas as mensagens da equipe são transmitidas via este evento
- Mensagens enviadas pelo próprio usuário também são recebidas (broadcast)
- `fileUrl` estará presente para imagens e áudios

---

#### 5. `authError`

Disparado quando o usuário não tem permissão para realizar uma ação.

**Payload:**

```javascript
"Error message describing the authorization issue";
```

**Exemplos de Mensagens:**

- `"You do not have permission to enter this chat."`
- `"You do not have permission to send messages to this team."`

**Exemplo:**

```javascript
socket.on("authError", (errorMessage) => {
  console.error("Authorization error:", errorMessage);
  alert("Access denied: " + errorMessage);
  socket.disconnect();
});
```

**Causas:**

- Usuário não é membro da equipe
- Events Service rejeitou a verificação
- Token JWT expirado durante a sessão

---

## 💾 Configuração do Banco de Dados

### MongoDB

**String de Conexão:**

```javascript
const mongoUri = `mongodb://${mongoUser}:${mongoPass}@mongodb:27017/${mongoDb}?authSource=admin`;
```

**Configuração:**

- **Host:** `mongodb` (nome do container Docker)
- **Porta:** `27017` (porta padrão do MongoDB)
- **Auth Source:** `admin` (banco de autenticação)
- **Database:** Definido pela variável de ambiente `MONGO_DB`
- **User:** Definido pela variável de ambiente `MONGO_USER`
- **Password:** Definido pela variável de ambiente `MONGO_PASSWORD`

**Opções de Conexão:**

```javascript
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

---

### Schema do Modelo Message

**Definição:**

```javascript
const messageSchema = new mongoose.Schema({
  author: { type: String, required: true },
  message: { type: String },
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ["text", "image", "audio", "comment"], default: "text" },
  fileUrl: { type: String },
  teamId: { type: String, index: true },
  eventId: { type: String, index: true },
  timestamp: { type: Date, default: Date.now },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
});

module.exports = mongoose.model("Message", messageSchema);
```

**Campos:**

| Campo       | Tipo     | Obrigatório | Descrição                                                  |
| ----------- | -------- | ----------- | ---------------------------------------------------------- |
| `author`    | String   | Sim         | Nome de usuário do autor                                   |
| `message`   | String   | Não         | Conteúdo da mensagem de texto                              |
| `userId`    | String   | Sim         | ID do usuário (indexado)                                   |
| `type`      | String   | Não         | Tipo: `text`, `image`, `audio`, `comment` (padrão: `text`) |
| `fileUrl`   | String   | Não         | URL do arquivo (para imagens/áudios)                       |
| `teamId`    | String   | Não         | ID da equipe (indexado)                                    |
| `eventId`   | String   | Não         | ID do evento (para comentários, indexado)                  |
| `timestamp` | Date     | Não         | Data/hora da mensagem (padrão: `Date.now()`)               |
| `parent`    | ObjectId | Não         | ID da mensagem pai (para respostas/threads)                |

**Índices Criados:**

- `userId` - Para buscar mensagens de um usuário específico
- `teamId` - Para buscar mensagens de uma equipe específica (usado no `GET /messages/:teamId`)
- `eventId` - Para buscar comentários de um evento específico (usado no `GET /events/:eventId/comments`)

---

### Operações de Banco de Dados

#### Salvar Mensagem de Texto

```javascript
const message = new Message({
  author: user.username,
  userId: user.userId,
  message: data.message,
  type: "text",
  teamId: data.teamId,
});
await message.save();
```

#### Salvar Upload (Imagem/Áudio)

```javascript
const message = new Message({
  author: user.username,
  userId: user.userId,
  type: type, // 'image' ou 'audio'
  fileUrl: fileUrl,
  teamId: teamId,
});
await message.save();
```

#### Salvar Comentário de Evento

```javascript
const message = new Message({
  author: user.username,
  userId: user.userId,
  message: content.trim(),
  type: "comment",
  eventId: eventId,
});
await message.save();
```

#### Buscar Mensagens por Equipe

```javascript
const messages = await Message.find({ teamId: teamId }).sort({ timestamp: 1 }); // Ascendente (mais antigas primeiro)
```

#### Buscar Comentários por Evento

```javascript
const comments = await Message.find({
  eventId: eventId,
  type: "comment",
})
  .sort({ timestamp: -1 }) // Descendente (mais recentes primeiro)
  .limit(100);
```

---

## 🔄 Integração com Events Service

O Chat Service depende do Events Service para verificar permissões de acesso a equipes.

**URL do Events Service:**

```javascript
const EVENTS_SERVICE_URL = process.env.EVENTS_SERVICE_URL || "https://events-service:3000";
```

---

### Verificação de Membros de Equipe

**Função:** `isUserMemberOfTeam(userId, teamId, authToken)`

**Propósito:**
Verifica se um usuário é membro de uma equipe específica consultando o Events Service.

**Parâmetros:**

- `userId` (string) - ID do usuário a verificar
- `teamId` (string) - ID da equipe
- `authToken` (string) - Token JWT do usuário

**Retorno:**

- `true` - Se o usuário for membro da equipe
- `false` - Se o usuário não for membro, ou em caso de erro

**Implementação:**

```javascript
async function isUserMemberOfTeam(userId, teamId, authToken) {
  if (!userId || !teamId || !authToken) {
    return false;
  }

  const checkUrl = `${EVENTS_SERVICE_URL}/teams/${teamId}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(checkUrl, {
      method: "GET",
      headers: {
        Cookie: `accessToken=${authToken}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return false;
    }

    const body = await response.json();
    const members = body.data?.members;

    if (!Array.isArray(members)) {
      return false;
    }

    const userIdString = userId.toString();
    return members.some((member) => member.userId.toString() === userIdString);
  } catch (error) {
    console.log(`[AUTH_CHECK] Falha no fetch: ${error.message}`);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

**Fluxo:**

1. Valida parâmetros de entrada
2. Faz requisição GET para `https://events-service:3000/teams/:teamId`
3. Envia o cookie de autenticação no header
4. Timeout de 3 segundos (AbortController)
5. Se resposta não for `ok` (2xx), retorna `false`
6. Extrai o array `members` de `body.data.members`
7. Valida se `members` é um array
8. Compara `userId` com cada `member.userId` (convertidos para string)
9. Retorna `true` se encontrar correspondência, `false` caso contrário
10. Em caso de erro (timeout, network, etc), loga e retorna `false`

**Uso:**

- **Upload de arquivos:** Verificar antes de aceitar o upload
- **Buscar histórico:** Verificar antes de retornar mensagens
- **Socket - joinTeam:** Verificar antes de permitir entrada na sala
- **Socket - sendMessage:** Verificar antes de aceitar a mensagem

**Respostas do Events Service:**

**Sucesso (200):**

```json
{
  "success": true,
  "message": "Team retrieved successfully",
  "data": {
    "teamId": 1,
    "teamName": "Team Alpha",
    "members": [
      { "userId": 123, "username": "john_doe", "role": "Captain" },
      { "userId": 456, "username": "jane_doe", "role": "Player" }
    ]
  }
}
```

**Erro (401/403/404):**

- Usuário não autenticado
- Equipe não encontrada
- Sem permissão (não retorna membros)

**Timeout:**

- Após 3 segundos, a requisição é abortada
- Retorna `false` por segurança

---

## 📁 Armazenamento de Arquivos

### Multer Configuration

**Diretório de Upload:**

```javascript
const publicDir = path.join(__dirname, "../Implementacao_Socket_Teste");
const uploadDir = path.join(publicDir, "uploads");
```

**Path Absoluto:** `/app/Implementacao_Socket_Teste/uploads`

---

### Configuração de Storage

**Multer Disk Storage:**

```javascript
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(publicDir, "uploads"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
  }),
});
```

**Formato de Nome de Arquivo:**

```
[timestamp]-[nome_original]
Exemplo: 1704115200000-screenshot.png
```

**Componentes:**

- `Date.now()` - Timestamp Unix em milissegundos (garante unicidade)
- `-` - Separador
- `file.originalname` - Nome original do arquivo enviado

---

### Rota de Acesso Estático

**Configuração Express:**

```javascript
app.use("/chat/uploads", express.static(path.join(publicDir, "uploads")));
```

**URL Pública:**

```
https://checkpoint.buzz/api/chat/uploads/[filename]
```

**Exemplo:**

```
https://checkpoint.buzz/api/chat/uploads/1704115200000-screenshot.png
```

**Notas:**

- Arquivos são servidos diretamente pelo Express (sem autenticação)
- Configuração `express.static` permite acesso direto aos arquivos
- Path `/chat/uploads` é mapeado para o diretório físico

---

### Tipos de Arquivo Suportados

**Validação no Backend:**

```javascript
const type = file.type.startsWith("image") ? "image" : file.type.startsWith("audio") ? "audio" : null;

if (!type) {
  return res.status(400).json({ error: "Apenas imagens ou áudios são suportados." });
}
```

**Tipos Aceitos:**

- **Imagens:** `image/*` (JPEG, PNG, GIF, WebP, etc)
- **Áudios:** `audio/*` (MP3, WAV, OGG, M4A, etc)

**Validação MIME Type:**

- Baseada em `file.type` (MIME type do arquivo)
- Usa `String.startsWith()` para verificação
- Rejeita todos os outros tipos (PDF, vídeo, documentos, etc)

---

### Fluxo de Upload

**1. Requisição:**

```javascript
POST /upload
Content-Type: multipart/form-data

file: [FILE_BINARY]
type: "image"
teamId: "1"
```

**2. Middleware authMiddleware:**

- Valida JWT do cookie
- Extrai `userId` e `username`

**3. Verificação de Autorização:**

```javascript
const isMember = await isUserMemberOfTeam(user.userId, teamId, authToken);
if (!isMember) {
  return res.status(403).json({ error: "Não autorizado para esta equipe." });
}
```

**4. Salvamento do Arquivo:**

```javascript
const fileUrl = `/uploads/${req.file.filename}`;
// Arquivo já foi salvo pelo Multer em /app/.../uploads/[timestamp]-[filename]
```

**5. Salvamento no MongoDB:**

```javascript
const message = new Message({
  author: user.username,
  userId: user.userId,
  type: type, // 'image' ou 'audio'
  fileUrl: fileUrl,
  teamId: teamId,
});
await message.save();
```

**6. Broadcast via Socket.IO:**

```javascript
io.to(teamId).emit("receivedMessage", message);
```

**7. Resposta https:**

```json
{ "success": true }
```

---

## 🔐 Autenticação e Middleware

### authMiddleware (HTTP)

**Propósito:** Valida o JWT em requisições HTTP e extrai informações do usuário.

**Implementação:**

```javascript
async function authMiddleware(req, res, next) {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    return res.status(401).json({ message: "Access token missing" });
  }

  try {
    const user = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid access token" });
  }
}
```

**Fluxo:**

1. Extrai `accessToken` dos cookies da requisição
2. Se ausente, retorna 401 com mensagem de erro
3. Verifica o token usando `jwt.verify(token, secret)`
4. Se válido, anexa os dados do usuário em `req.user`
5. Chama `next()` para continuar o pipeline
6. Se inválido, captura erro e retorna 401

**Dados Extraídos do JWT:**

```javascript
{
  userId: 123,
  username: "john_doe",
  // outros campos possíveis do token
}
```

**Variável de Ambiente:**

```javascript
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
```

**Uso:**

```javascript
app.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  const user = req.user; // { userId, username }
  // ...
});
```

---

### Socket.IO Authentication

**Propósito:** Valida o JWT na conexão Socket.IO e rejeita conexões não autorizadas.

**Extração de Cookie:**

```javascript
function getCookie(cookieString, cname) {
  if (!cookieString) return "";
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(cookieString);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
```

**Validação na Conexão:**

```javascript
io.on("connection", (socket) => {
  console.log(`ID Conectado: ${socket.id}`);

  // Extrair cookie
  const cookieString = socket.handshake.headers.cookie || socket.request.headers.cookie;
  const authToken = getCookie(cookieString, "accessToken");

  // Validar JWT
  let user;
  try {
    user = jwt.verify(authToken, process.env.JWT_SECRET, { maxAge: "1h" });
    if (!user.userId || !user.username) {
      throw new Error("Token JWT inválido - 'userId' ou 'username' não encontrado.");
    }
  } catch (err) {
    console.log("Erro de JWT no Socket:", err.message);
    return socket.disconnect();
  }

  // Usuário autenticado - continua com lógica...
});
```

**Fluxo:**

1. Socket se conecta ao servidor
2. Extrai cookie do header `cookie` ou `request.headers.cookie`
3. Usa função `getCookie()` para extrair `accessToken`
4. Verifica token usando `jwt.verify(token, secret, { maxAge })`
5. Valida presença de `userId` e `username` no payload
6. Se qualquer validação falhar:
   - Loga erro no console
   - Desconecta o socket (`socket.disconnect()`)
7. Se validação passar, continua com os event handlers

**Opções de Verificação:**

```javascript
{
  maxAge: "1h";
} // Token expira em 1 hora
```

**Dados do Usuário Disponíveis:**

```javascript
{
  userId: 123,
  username: "john_doe"
}
```

**Tratamento de Erros:**

- Token ausente → `getCookie()` retorna `""` → `jwt.verify()` lança erro
- Token inválido → `jwt.verify()` lança erro
- `userId` ou `username` ausentes → lança erro manual
- Qualquer erro → `socket.disconnect()`

**Logs de Debug:**

```
ID Conectado: [socket.id]
Erro de JWT no Socket: [error.message]
```

---

## 🗃️ Modelo de Dados

### Message (MongoDB)

Todos os campos são armazenados no MongoDB.

| Campo       | Tipo     | Obrigatório                | Indexado   | Descrição                                             |
| ----------- | -------- | -------------------------- | ---------- | ----------------------------------------------------- |
| `_id`       | ObjectId | Sim (auto)                 | Sim (auto) | ID único do documento MongoDB                         |
| `author`    | String   | Sim                        | Não        | Nome de usuário do autor                              |
| `userId`    | String   | Sim                        | **Sim**    | ID do usuário (para buscar mensagens de um usuário)   |
| `message`   | String   | Não                        | Não        | Conteúdo da mensagem de texto                         |
| `type`      | String   | Não (padrão: `text`)       | Não        | Tipo: `text`, `image`, `audio`, `comment`             |
| `fileUrl`   | String   | Não                        | Não        | URL relativa do arquivo (ex: `/uploads/123-file.jpg`) |
| `teamId`    | String   | Não                        | **Sim**    | ID da equipe (para mensagens de equipe)               |
| `eventId`   | String   | Não                        | **Sim**    | ID do evento (para comentários)                       |
| `timestamp` | Date     | Não (padrão: `Date.now()`) | Não        | Data/hora da criação                                  |
| `parent`    | ObjectId | Não                        | Não        | ID da mensagem pai (para respostas/threads)           |

**Enums:**

- `type`: `['text', 'image', 'audio', 'comment']`

**Valores Padrão:**

- `type`: `'text'`
- `timestamp`: `Date.now()`

---

### Tipos de Mensagem

#### Mensagem de Texto (Chat de Equipe)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "author": "john_doe",
  "userId": "123",
  "message": "Hello team!",
  "type": "text",
  "teamId": "1",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Campos Preenchidos:**

- `author`, `userId`, `message`, `type`, `teamId`, `timestamp`

**Campos Nulos:**

- `fileUrl`, `eventId`, `parent`

---

#### Mensagem de Imagem (Chat de Equipe)

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "author": "jane_doe",
  "userId": "456",
  "message": "Check this out!",
  "type": "image",
  "fileUrl": "/uploads/1704115200000-screenshot.png",
  "teamId": "1",
  "timestamp": "2024-01-01T10:05:00.000Z"
}
```

**Campos Preenchidos:**

- `author`, `userId`, `type`, `fileUrl`, `teamId`, `timestamp`
- `message` (opcional - pode conter legenda)

**Campos Nulos:**

- `eventId`, `parent`

---

#### Mensagem de Áudio (Chat de Equipe)

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "author": "bob_smith",
  "userId": "789",
  "type": "audio",
  "fileUrl": "/uploads/1704115500000-voice-message.mp3",
  "teamId": "1",
  "timestamp": "2024-01-01T10:10:00.000Z"
}
```

**Campos Preenchidos:**

- `author`, `userId`, `type`, `fileUrl`, `teamId`, `timestamp`

**Campos Nulos:**

- `message`, `eventId`, `parent`

---

#### Comentário de Evento

```json
{
  "_id": "507f1f77bcf86cd799439014",
  "author": "alice_wonder",
  "userId": "321",
  "message": "Great event! Looking forward to it!",
  "type": "comment",
  "eventId": "5",
  "timestamp": "2024-01-01T09:30:00.000Z"
}
```

**Campos Preenchidos:**

- `author`, `userId`, `message`, `type`, `eventId`, `timestamp`

**Campos Nulos:**

- `fileUrl`, `teamId`, `parent`

---

## 🛡️ Regras de Negócio

### Permissões

**Mensagens de Equipe:**

- Apenas membros da equipe podem:
  - Ver histórico de mensagens (`GET /messages/:teamId`)
  - Enviar mensagens de texto (Socket.IO `sendMessage`)
  - Fazer upload de arquivos (`POST /upload`)
  - Entrar na sala do chat (Socket.IO `joinTeam`)
- Verificação feita consultando Events Service
- Se não for membro → 403 (HTTP) ou `authError` (Socket.IO)

**Comentários de Evento:**

- Qualquer usuário autenticado pode criar comentários (`POST /events/:eventId/comments`)
- Listagem de comentários é **pública** (`GET /events/:eventId/comments`)
- Não há moderação automática (implementar no frontend se necessário)

**Arquivos:**

- Upload requer ser membro da equipe
- Arquivos são **públicos** após upload (servidos sem autenticação via `/upload/:filename`)
- Apenas imagens e áudios são permitidos

---

### Validações

**Upload de Arquivos:**

- Tipo de arquivo deve ser `image/*` ou `audio/*`
- Campos `file`, `type` e `teamId` são obrigatórios
- Usuário deve ser membro da equipe

**Mensagens de Texto:**

- Campo `message` não pode estar vazio
- Campo `teamId` é obrigatório
- Usuário deve ser membro da equipe

**Comentários:**

- Campo `content` não pode estar vazio ou conter apenas espaços (`.trim()`)
- Campo `eventId` é obrigatório

**Entrada em Salas (Socket.IO):**

- `teamId` não pode ser vazio
- Usuário deve ser membro da equipe

---

### Integração com Events Service

**Dependência Crítica:**

- Chat Service **depende** do Events Service para verificação de membros
- Se Events Service estiver indisponível, acesso é **negado por segurança**
- Timeout de 3 segundos para todas as requisições

**Endpoint Consultado:**

```
GET https://events-service:3000/teams/:teamId
Cookie: accessToken=<jwt_token>
```

**Resposta Esperada:**

```json
{
  "success": true,
  "data": {
    "members": [{ "userId": 123, "username": "john_doe" }]
  }
}
```

**Tratamento de Erros:**

- Status não-2xx → Rejeita acesso
- Timeout → Rejeita acesso
- Resposta sem array `members` → Rejeita acesso
- Erro de rede → Rejeita acesso e loga

---

### MongoDB

**Conexão:**

```javascript
const mongoUri = `mongodb://${mongoUser}:${mongoPass}@mongodb:27017/${mongoDb}?authSource=admin`;
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
```

**Tratamento de Conexão:**

```javascript
mongoose
  .connect(mongoUri)
  .then(() => console.log("✓ MongoDB conectado"))
  .catch((err) => console.error("✗ MongoDB erro:", err));
```

**Collection:**

- Nome: `messages` (gerado automaticamente a partir do model `Message`)
- Índices criados automaticamente no primeiro documento inserido

**Queries Comuns:**

- Buscar por equipe: `{ teamId: teamId }` + `.sort({ timestamp: 1 })`
- Buscar por evento: `{ eventId: eventId, type: 'comment' }` + `.sort({ timestamp: -1 }).limit(100)`

---

## 🚨 Tratamento de Erros

### Códigos de Status HTTP

- `200`: Sucesso (GET, retorna dados)
- `201`: Criado com sucesso (POST comentário)
- `400`: Dados inválidos (arquivo não suportado, campos vazios)
- `401`: Token JWT inválido ou ausente
- `403`: Sem permissão (não é membro da equipe)
- `404`: Arquivo não encontrado
- `500`: Erro interno do servidor (MongoDB, Events Service indisponível)

---

### Exemplos de Respostas de Erro

#### HTTP - Token Ausente

```json
{
  "message": "Access token missing"
}
```

#### HTTP - Token Inválido

```json
{
  "message": "Invalid access token"
}
```

#### HTTP - Não Autorizado

```json
{
  "error": "Não autorizado para esta equipe."
}
```

#### HTTP - Arquivo Não Suportado

```json
{
  "error": "Apenas imagens ou áudios são suportados."
}
```

#### HTTP - Conteúdo Vazio

```json
{
  "error": "Conteúdo do comentário é obrigatório"
}
```

#### HTTP - Erro Interno

```json
{
  "error": "Erro ao criar comentário"
}
```

#### Socket.IO - Erro de Autenticação

```javascript
socket.emit("authError", "Você não tem permissão para entrar neste chat.");
```

```javascript
socket.emit("authError", "Você não tem permissão para enviar mensagens para esta equipe.");
```

---

## 📊 Exemplos de Uso

### Conectar ao Chat e Entrar em uma Equipe

```javascript
const socket = io("https://checkpoint.buzz", {
  path: "/api/chat/socket.io",
  withCredentials: true,
  reconnectionAttempts: 5,
  timeout: 10000,
});

socket.on("connect", () => {
  console.log("Connected! Socket ID:", socket.id);
  socket.emit("joinTeam", "1");
});

socket.on("receivedMessage", (message) => {
  console.log("New message:", message);
  displayMessage(message);
});

socket.on("authError", (error) => {
  console.error("Auth error:", error);
  alert("Access denied: " + error);
});

socket.on("disconnect", () => {
  console.log("Disconnected from chat server");
});
```

---

### Enviar Mensagem de Texto

```javascript
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

sendButton.addEventListener("click", () => {
  const message = messageInput.value.trim();
  const teamId = "1"; // ID da equipe atual

  if (!message) {
    alert("Digite uma mensagem");
    return;
  }

  socket.emit("sendMessage", {
    message: message,
    teamId: teamId,
  });

  messageInput.value = "";
});
```

---

### Buscar Histórico de Mensagens

```javascript
const teamId = "1";

fetch(`https://checkpoint.buzz/api/chat/messages/${teamId}`, {
  credentials: "include",
})
  .then((res) => {
    if (!res.ok) {
      throw new Error("Failed to fetch messages");
    }
    return res.json();
  })
  .then((messages) => {
    console.log("Message history:", messages);
    messages.forEach((msg) => displayMessage(msg));
  })
  .catch((err) => {
    console.error("Error:", err);
    alert("Não foi possível carregar as mensagens");
  });
```

---

### Upload de Imagem

```javascript
const fileInput = document.getElementById("file-input");
const teamId = "1";

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];

  if (!file) return;

  // Validar tipo de arquivo
  if (!file.type.startsWith("image/") && !file.type.startsWith("audio/")) {
    alert("Apenas imagens e áudios são permitidos");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", file.type.startsWith("image/") ? "image" : "audio");
  formData.append("teamId", teamId);

  try {
    const response = await fetch("https://checkpoint.buzz/api/chat/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      console.log("Upload successful!");
      fileInput.value = ""; // Limpar input
    } else {
      throw new Error(data.error || "Upload failed");
    }
  } catch (err) {
    console.error("Upload error:", err);
    alert("Erro ao enviar arquivo: " + err.message);
  }
});
```

---

### Criar Comentário em Evento

```javascript
const eventId = "5";
const commentText = "Great event! Looking forward to it!";

fetch(`https://checkpoint.buzz/api/chat/events/${eventId}/comments`, {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    content: commentText,
  }),
})
  .then((res) => {
    if (!res.ok) {
      throw new Error("Failed to create comment");
    }
    return res.json();
  })
  .then((comment) => {
    console.log("Comment created:", comment);
    displayComment(comment);
  })
  .catch((err) => {
    console.error("Error:", err);
    alert("Erro ao criar comentário");
  });
```

---

### Listar Comentários de um Evento

```javascript
const eventId = "5";

fetch(`https://checkpoint.buzz/api/chat/events/${eventId}/comments`)
  .then((res) => {
    if (!res.ok) {
      throw new Error("Failed to fetch comments");
    }
    return res.json();
  })
  .then((comments) => {
    console.log("Event comments:", comments);
    comments.forEach((comment) => displayComment(comment));
  })
  .catch((err) => {
    console.error("Error:", err);
    alert("Erro ao carregar comentários");
  });
```

---

### Renderizar Mensagem Recebida

```javascript
function displayMessage(message) {
  const messagesContainer = document.getElementById("messages-container");
  const messageElement = document.createElement("div");
  messageElement.className = "message";

  // Escapar HTML para segurança (usar validator.escape no frontend)
  const safeAuthor = escapeHtml(message.author);
  const safeText = escapeHtml(message.message || "");

  // Timestamp formatado
  const timestamp = new Date(message.timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let content = `
    <div class="message-header">
      <span class="author">${safeAuthor}</span>
      <span class="timestamp">${timestamp}</span>
    </div>
  `;

  // Renderizar baseado no tipo
  if (message.type === "text") {
    content += `<div class="message-text">${safeText}</div>`;
  } else if (message.type === "image") {
    if (message.message) {
      content += `<div class="message-text">${safeText}</div>`;
    }
    content += `<div class="message-image">
      <img src="https://checkpoint.buzz/api/chat${message.fileUrl}" alt="Imagem enviada">
    </div>`;
  } else if (message.type === "audio") {
    if (message.message) {
      content += `<div class="message-text">${safeText}</div>`;
    }
    content += `<div class="message-audio">
      <audio controls src="https://checkpoint.buzz/api/chat${message.fileUrl}"></audio>
    </div>`;
  }

  messageElement.innerHTML = content;
  messagesContainer.appendChild(messageElement);

  // Scroll para o final
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Função auxiliar para escapar HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
```
