# 📅 API de Eventos - Checkpoint

## Base URL
```
http://api.localhost/api/events
```

## 🔐 Autenticação
Todos os endpoints (exceto `/health` e `GET /:eventId`) requerem autenticação via JWT token.

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
- `INVALID_EVENT_ID` - ID do evento inválido
- `INVALID_TEAM_ID` - ID do time inválido
- `VALIDATION_ERROR` - Erro de validação de dados
- `EVENT_NOT_FOUND` - Evento não encontrado
- `TEAM_NOT_FOUND` - Time não encontrado
- `UNAUTHORIZED` - Sem permissão para a operação
- `TEAM_FULL` - Time está cheio
- `ALREADY_MEMBER` - Usuário já é membro do time
- `TEAM_ALREADY_EXISTS` - Usuário já criou um time para este evento
- `MAX_TEAMS_REACHED` - Limite de times atingido
- `INTERNAL_ERROR` - Erro interno do servidor

---

## 📋 Endpoints

### Health Check
**GET** `/health`

Verifica o status do serviço.

**Resposta:**
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

## 🎯 Gerenciamento de Eventos

### 1. Criar Evento
**POST** `/`

Cria um novo evento. Suporta upload de banner através de `multipart/form-data`.

**Headers:**
```
Cookie: accessToken=<jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
```
Title: "Torneio de CS2"
Description: "Campeonato aberto de Counter Strike 2"
GameID: 1
Mode: "5v5"
StartDate: "2024-02-01T14:00:00Z"
EndDate: "2024-02-01T18:00:00Z"
Location: "Online"
Ticket: 50.00
ParticipationCost: 100.00
Language: "Português"
Platform: "PC"
IsOnline: true
MaxParticipants: 100
TeamSize: 5
MaxTeams: 20
Rules: "Melhor de 3 mapas..."
Prizes: "1º lugar: R$ 1000,00"
BannerFile: [FILE] // Campo de upload do banner
```
```

**Campos Obrigatórios:**
- `Title` (string)
- `Description` (string) 
- `StartDate` (date)
- `EndDate` (date)
- `IsOnline` (boolean)

**Campo de Upload:**
- `BannerFile`: Arquivo de imagem (opcional)
  - Formatos suportados: JPEG, PNG, GIF
  - Tamanho máximo: 5MB

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "eventId": 1,
    "createdAt": "2024-01-01T10:00:00.000Z"
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Status Codes:**
- `201`: Evento criado com sucesso
- `400`: Dados inválidos (erro de validação)
- `401`: Não autenticado

---

### 2. Atualizar Evento
**PUT** `/:eventId`

Atualiza um evento existente. Suporta atualização do banner através de `multipart/form-data`. Se um novo banner for enviado, o antigo será removido automaticamente. Apenas o criador do evento pode atualizá-lo.

**Headers:**
```
Cookie: accessToken=<jwt_token>
Content-Type: multipart/form-data
```

**Parâmetros:**
- `eventId` (number) - ID do evento

**Form Data:** (campos opcionais)
```
Title: "Novo título"
Description: "Nova descrição"
Status: "Canceled"
BannerFile: [FILE] // Campo de upload do novo banner
```

**Campo de Upload:**
- `BannerFile`: Arquivo de imagem (opcional)
  - Formatos suportados: JPEG, PNG, GIF
  - Tamanho máximo: 5MB
  - Se fornecido, substitui o banner existente
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": {
    "eventId": 1
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Status Codes:**
- `200`: Evento atualizado com sucesso
- `400`: Dados inválidos
- `401`: Não autenticado
- `403`: Sem permissão para editar
- `404`: Evento não encontrado

---

### 3. Deletar Evento
**DELETE** `/:eventId`

Deleta um evento (soft delete). Apenas o criador do evento pode deletá-lo.

**Headers:**
```
Cookie: accessToken=<jwt_token>
```

**Parâmetros:**
- `eventId` (number) - ID do evento

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Event deleted successfully",
  "data": {
    "eventId": 1
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Status Codes:**
- `200`: Evento deletado com sucesso
- `400`: ID inválido
- `401`: Não autenticado
- `403`: Sem permissão para deletar
- `404`: Evento não encontrado

---

### 4. Buscar Eventos
**GET** `/`

Busca eventos com filtros avançados e suporte a paginação.

**Query Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `game` | string | Nome do jogo |
| `date` | date | Data específica (YYYY-MM-DD) |
| `mode` | string | Modo de jogo (ex: "5v5") |
| `ticket` | number | Preço do ingresso |
| `participationCost` | number | Custo de participação |
| `place` | string | Localização (busca parcial) |
| `groupSize` | number | Tamanho do time |
| `status` | string | Status do evento |
| `prize` | string | Prêmios (busca parcial) |
| `time` | time | Horário específico (HH:MM:SS) |
| `language` | string | Idioma |
| `platform` | string | Plataforma |
| `maxParticipants` | number | Máximo de participantes |
| `isOnline` | boolean | Evento online (true/false) |
| `search` | string | Busca em título, descrição e organizador |
| `page` | number | Página (padrão: 1) |
| `limit` | number | Itens por página (padrão: 10) |

**Exemplo de Uso:**
```
GET /api/events?game=CS2&isOnline=true&status=Active&search=torneio&page=1&limit=10
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": {
    "data": [
      {
        "eventId": 1,
        "title": "Torneio de CS2",
        "description": "Campeonato aberto de Counter Strike 2",
        "gameId": 1,
        "gameName": "Counter Strike 2",
        "mode": "5v5",
        "startDate": "2024-02-01T14:00:00.000Z",
        "endDate": "2024-02-01T18:00:00.000Z",
        "location": "Online",
        "ticket": 50.00,
        "participationCost": 100.00,
        "language": "Português",
        "platform": "PC",
        "isOnline": true,
        "maxParticipants": 100,
        "currentParticipants": 45,
        "availableSpots": 55,
        "teamSize": 5,
        "maxTeams": 20,
        "teamCount": 9,
        "availableTeamSlots": 11,
        "rules": "Melhor de 3 mapas...",
        "prizes": "1º lugar: R$ 1000,00",
        "bannerURL": "https://example.com/banner.jpg",
        "status": "Active",
        "organizer": {
          "userId": 123,
          "username": "organizer_name"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Status Codes:**
- `200`: Sucesso
- `500`: Erro interno do servidor

---

### 5. Buscar Evento por ID

**GET** `/:eventId`

Busca um evento específico pelo seu ID com dados completos e relacionados.

**Parâmetros:**
- `eventId` (number) - ID do evento

**Headers (opcional):**
```
Cookie: accessToken=<jwt_token>
```
*Se autenticado, inclui informações sobre registro do usuário no evento*

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Event retrieved successfully",
  "data": {
    "eventId": 1,
    "title": "Torneio de CS2",
    "description": "Campeonato aberto de Counter Strike 2",
    "game": {
      "gameId": 1,
      "gameName": "Counter Strike 2"
    },
    "mode": "5v5",
    "startDate": "2024-02-01T14:00:00.000Z",
    "endDate": "2024-02-01T18:00:00.000Z",
    "location": "Online",
    "ticket": 50.00,
    "participationCost": 100.00,
    "language": "Português",
    "platform": "PC",
    "isOnline": true,
    "maxParticipants": 100,
    "currentParticipants": 45,
    "availableSpots": 55,
    "teamSize": 5,
    "maxTeams": 20,
    "teamCount": 9,
    "availableTeamSlots": 11,
    "rules": "Melhor de 3 mapas...",
    "prizes": "1º lugar: R$ 1000,00",
    "bannerURL": "https://example.com/banner.jpg",
    "status": "Active",
    "createdBy": {
      "userId": 123,
      "username": "organizer_name",
      "userRole": "Organizer"
    },
    "isRegistered": false,
    "metadata": {
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T11:00:00.000Z",
      "lastModifiedBy": 123
    }
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Status Codes:**
- `200`: Evento encontrado e retornado com sucesso
- `400`: `eventId` inválido (não numérico)
- `404`: Evento não encontrado ou deletado
- `500`: Erro interno do servidor

---

## 👥 Gerenciamento de Times

### 6. Criar Time para Evento
**POST** `/:eventId/teams`

Cria um novo time e registra para um evento. O criador automaticamente se torna o capitão do time.

**Headers:**
```
Cookie: accessToken=<jwt_token>
```

**Parâmetros:**
- `eventId` (number) - ID do evento

**Body:**
```json
{
  "TeamName": "Team Alpha",
  "LogoURL": "https://example.com/logo.png"
}
```

**Campos Obrigatórios:**
- `TeamName` (string, max 100 caracteres)

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Team created successfully",
  "data": {
    "teamId": 1,
    "teamName": "Team Alpha",
    "eventId": 1,
    "createdAt": "2024-01-01T10:00:00.000Z"
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Status Codes:**
- `201`: Time criado com sucesso
- `400`: Dados inválidos, limite de times atingido ou usuário já possui time no evento
- `401`: Não autenticado
- `404`: Evento não encontrado

**Resposta de Erro (Limite de Times):**
```json
{
  "success": false,
  "message": "Maximum number of teams reached for this event",
  "error": "MAX_TEAMS_REACHED",
  "details": {
    "eventId": 1,
    "currentTeamCount": 20,
    "maxTeams": 20
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

### 7. Listar Times de um Evento
**GET** `/:eventId/teams`

Lista todos os times registrados em um evento com informações enriquecidas.

**Parâmetros:**
- `eventId` (number) - ID do evento

**Headers (opcional):**
```
Cookie: accessToken=<jwt_token>
```
*Se autenticado, inclui informação se o usuário pode entrar em cada time*

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Teams retrieved successfully",
  "data": [
    {
      "teamId": 1,
      "teamName": "Team Alpha",
      "logoURL": "https://example.com/logo.png",
      "eventId": 1,
      "status": "Approved",
      "registeredAt": "2024-01-01T10:00:00.000Z",
      "captain": {
        "userId": 123,
        "username": "john_doe",
        "userRole": "Player"
      },
      "memberCount": 4,
      "maxMembers": 5,
      "isFull": false,
      "canJoin": true
    }
  ],
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Status Codes:**
- `200`: Sucesso
- `400`: `eventId` inválido
- `500`: Erro interno do servidor

---

### 8. Buscar Informações do Time
**GET** `/teams/:teamId`

Retorna informações detalhadas de um time específico, incluindo lista de membros.

**Parâmetros:**
- `teamId` (number) - ID do time

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Team retrieved successfully",
  "data": {
    "teamId": 1,
    "teamName": "Team Alpha",
    "logoURL": "https://example.com/logo.png",
    "chatID": "550e8400-e29b-41d4-a716-446655440000",
    "eventId": 1,
    "status": "Approved",
    "registeredAt": "2024-01-01T10:00:00.000Z",
    "captain": {
      "userId": 123,
      "username": "john_doe",
      "userRole": "Player"
    },
    "memberCount": 4,
    "maxMembers": 5,
    "isFull": false,
    "members": [
      {
        "userId": 123,
        "username": "john_doe",
        "role": "Captain",
        "userRole": "Player",
        "joinedAt": "2024-01-01T10:00:00.000Z"
      },
      {
        "userId": 456,
        "username": "jane_doe",
        "role": "Player",
        "userRole": "Player",
        "joinedAt": "2024-01-01T11:00:00.000Z"
      }
    ]
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Status Codes:**
- `200`: Sucesso
- `400`: `teamId` inválido
- `404`: Time não encontrado
- `500`: Erro interno do servidor

---

### 9. Entrar em um Time
**POST** `/teams/:teamId/join`

Permite que um usuário entre em um time específico, desde que o time não esteja cheio.

**Headers:**
```
Cookie: accessToken=<jwt_token>
```

**Parâmetros:**
- `teamId` (number) - ID do time

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Joined team successfully",
  "data": {
    "teamId": 1,
    "teamName": "Team Alpha",
    "newMemberCount": 4,
    "maxMembers": 5,
    "isFull": false
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Status Codes:**
- `200`: Entrada no time bem-sucedida
- `400`: Erro de validação (time cheio ou usuário já é membro)
- `401`: Não autenticado
- `404`: Time não encontrado ou registro não encontrado
- `500`: Erro interno do servidor

**Resposta de Erro (Time Cheio):**
```json
{
  "success": false,
  "message": "Team is already full",
  "error": "TEAM_FULL",
  "details": {
    "teamId": 1,
    "currentMembers": 5,
    "maxMembers": 5
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Resposta de Erro (Já é Membro):**
```json
{
  "success": false,
  "message": "You are already a member of this team",
  "error": "ALREADY_MEMBER",
  "details": {
    "teamId": 1,
    "userId": 123
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Regras de Validação:**
- O usuário não pode entrar em um time do qual já é membro
- O time não pode exceder o número máximo de membros definido no evento

---

### 10. Deletar Time
**DELETE** `/teams/:teamId`

Deleta um time (soft delete). Apenas o capitão do time pode deletá-lo.

**Headers:**
```
Cookie: accessToken=<jwt_token>
```

**Parâmetros:**
- `teamId` (number) - ID do time

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Team deleted successfully",
  "data": {
    "teamId": 1
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Status Codes:**
- `200`: Time deletado com sucesso
- `400`: `teamId` inválido
- `401`: Não autenticado
- `403`: Sem permissão para deletar
- `404`: Time não encontrado

---

### 11. Remover Membro do Time
**DELETE** `/teams/:teamId/members/:memberId`

Remove um membro específico de um time. O membro pode ser removido pelo capitão do time (CreatedBy) ou pode sair voluntariamente (quando memberId é o próprio usuário).

**Headers:**
```
Cookie: accessToken=<jwt_token>
```

**Parâmetros:**
- `teamId` (number) - ID do time
- `memberId` (number) - ID do usuário a ser removido

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Member removed successfully",
  "data": {
    "teamId": 1,
    "removedMemberId": 456,
    "newMemberCount": 3,
    "teamStatus": "Active"
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Resposta quando Time é Cancelado (sem membros):**
```json
{
  "success": true,
  "message": "Member removed successfully",
  "data": {
    "teamId": 1,
    "removedMemberId": 456,
    "newMemberCount": 0,
    "teamStatus": "Cancelled"
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

**Status Codes:**
- `200`: Membro removido com sucesso
- `400`: ID inválido
- `401`: Não autenticado
- `403`: Sem permissão para remover o membro
- `404`: Time ou membro não encontrado
- `500`: Erro interno do servidor

**Regras de Negócio:**
- Apenas o capitão do time pode remover outros membros
- Um membro pode sair voluntariamente do time (remover a si mesmo)
- Se o último membro sair, o time é automaticamente deletado
- Quando um time fica sem membros, seu status é alterado para 'Cancelled'

---

## 🗃️ Modelo de Dados

### Evento
Todos os campos são retornados em **camelCase** na resposta JSON.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `eventId` | number | ID único do evento |
| `title` | string | Título do evento |
| `description` | string | Descrição detalhada |
| `gameId` | number | ID do jogo |
| `game` | object | Objeto com informações do jogo (quando disponível) |
| `mode` | string | Modo de jogo |
| `startDate` | datetime | Data/hora de início |
| `endDate` | datetime | Data/hora de término |
| `location` | string | Local do evento |
| `ticket` | decimal | Preço do ingresso |
| `participationCost` | decimal | Custo de participação |
| `language` | string | Idioma principal |
| `platform` | string | Plataforma (PC, Console, etc) |
| `isOnline` | boolean | Evento online |
| `maxParticipants` | number | Máximo de participantes |
| `currentParticipants` | number | Participantes atuais (calculado) |
| `availableSpots` | number | Vagas disponíveis (calculado) |
| `teamSize` | number | Tamanho do time |
| `maxTeams` | number | Máximo de times |
| `teamCount` | number | Quantidade atual de times (calculado) |
| `availableTeamSlots` | number | Vagas disponíveis para times (calculado) |
| `rules` | string | Regras do evento |
| `prizes` | string | Premiação |
| `bannerURL` | string | URL do banner |
| `status` | string | Status: Active, Canceled, Finished |
| `createdBy` | object | Objeto com informações do organizador |
| `isRegistered` | boolean | Se o usuário autenticado está registrado (apenas GET /:eventId) |
| `metadata` | object | Metadados (createdAt, updatedAt, lastModifiedBy) |

### Time
Todos os campos são retornados em **camelCase** na resposta JSON.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `teamId` | number | ID único do time |
| `teamName` | string | Nome do time |
| `logoURL` | string | URL do logo |
| `createdBy` | number | ID do criador (apenas na estrutura básica) |
| `captain` | object | Objeto com informações do capitão |
| `chatID` | uuid | ID do chat do time |
| `eventId` | number | ID do evento associado |
| `status` | string | Status do registro no evento |
| `registeredAt` | datetime | Data de registro no evento |
| `memberCount` | number | Quantidade de membros |
| `maxMembers` | number | Máximo de membros permitidos |
| `isFull` | boolean | Se o time está cheio |
| `canJoin` | boolean | Se o usuário pode entrar no time (quando autenticado) |
| `members` | array | Lista de membros do time (apenas GET /teams/:teamId) |

### Organizador/Capitão
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `userId` | number | ID do usuário |
| `username` | string | Nome de usuário |
| `userRole` | string | Role do usuário |

---

## 🛡️ Regras de Negócio

### Permissões
- Apenas usuários autenticados podem criar/editar eventos
- Apenas o criador do evento pode editá-lo ou deletá-lo
- Times podem ser criados por qualquer usuário autenticado
- Apenas o capitão do time pode deletar o time ou remover membros
- Membros podem sair voluntariamente do time (remover a si mesmos)

### Validações
- Data de início deve ser anterior à data de término
- Limite de times respeita `MaxTeams` do evento
- Limite de membros por time respeita `TeamSize` do evento
- Um usuário só pode criar um time por evento
- Status válidos: `Active`, `Canceled`, `Finished`

### Filtros Disponíveis
- **Texto**: `search` (título, descrição, organizador)
- **Data/Hora**: `date`, `time`
- **Localização**: `place`, `isOnline`
- **Jogo**: `game`, `mode`, `platform`
- **Configurações**: `groupSize`, `maxParticipants`
- **Financeiro**: `ticket`, `participationCost`
- **Outros**: `language`, `status`, `prize`

---

## 🚨 Tratamento de Erros

### Códigos de Status HTTP
- `200`: Sucesso
- `201`: Criado com sucesso
- `400`: Dados inválidos ou validação falhou
- `401`: Token inválido ou não fornecido
- `403`: Sem permissão para a operação
- `404`: Recurso não encontrado
- `500`: Erro interno do servidor

### Exemplo de Resposta de Erro:
```json
{
  "success": false,
  "message": "Invalid eventId",
  "error": "INVALID_EVENT_ID",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### Exemplo de Erro com Detalhes:
```json
{
  "success": false,
  "message": "Maximum number of teams reached for this event",
  "error": "MAX_TEAMS_REACHED",
  "details": {
    "eventId": 1,
    "currentTeamCount": 20,
    "maxTeams": 20
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

## 📊 Exemplos de Uso

### Criar um Torneio Online
```bash
curl -X POST http://api.localhost/api/events \
  -H "Cookie: accessToken=your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "Title": "Torneio Valorant",
    "Description": "Campeonato mensal de Valorant",
    "StartDate": "2024-03-15T19:00:00Z",
    "EndDate": "2024-03-15T23:00:00Z",
    "IsOnline": true,
    "TeamSize": 5,
    "MaxTeams": 16,
    "Platform": "PC",
    "Language": "Português"
  }'
```

### Buscar Eventos Ativos de CS2 com Paginação
```bash
curl "http://api.localhost/api/events?game=CS2&status=Active&isOnline=true&page=1&limit=10" \
  -H "Cookie: accessToken=your_jwt_token"
```

### Criar Time para um Evento
```bash
curl -X POST http://api.localhost/api/events/1/teams \
  -H "Cookie: accessToken=your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "TeamName": "Team Alpha",
    "LogoURL": "https://example.com/logo.png"
  }'
```

### Entrar em um Time
```bash
curl -X POST http://api.localhost/api/events/teams/1/join \
  -H "Cookie: accessToken=your_jwt_token"
```

## 🏆 Sistema de Partidas e Leaderboard

O serviço de **MatchControllers** é responsável pelo gerenciamento de partidas e rankings de eventos. **.

A arquitetura foi desenhada para suportar diferentes modos de evento (`Mode`)

---

### 🔗 Base URL

```
http://api.localhost/api/events/:eventId
```

### 🔒 Autenticação

Todas as rotas de **Leaderboard** exigem autenticação via JWT (`accessToken`), exceto a rota pública de visualização do ranking.

---

## ⚙️ Middleware de Validação - `getEventAndValidate`

Antes de qualquer rota sob `/events/:eventId/...`, é executado o middleware de validação do evento:

**Funções:**

* Verifica se `eventId` é válido
* Busca o evento no banco
* Anexa as informações ao `res.locals.event`
* Cria e compartilha uma conexão SQL (`res.locals.db_pool`)
* Fecha a conexão automaticamente após a resposta

**Erros Possíveis:**

| Código | Erro                        |
| ------ | --------------------------- |
| `400`  | `Invalid eventId`           |
| `404`  | `Event not found`           |
| `500`  | `Failed to process request` |

---


## 🎮 Leaderboard - Pontuação e Ranking

### 1. Adicionar/Atualizar Pontos de uma Rodada

**POST** `/:eventId/leaderboard/round/:roundNumber`

Registra ou atualiza os pontos de times em uma rodada específica.
Apenas o criador do evento pode realizar esta ação.

**Headers:**

```
Cookie: accessToken=<jwt_token>
```

**Parâmetros:**

| Parâmetro     | Tipo   | Descrição                                                  |
| ------------- | ------ | ---------------------------------------------------------- |
| `eventId`     | number | ID do evento (precisa existir e ser do tipo *Leaderboard*) |
| `roundNumber` | number | Número da rodada (ex: 1, 2, 3...)                          |

**Body:**

```json
{
  "scores": [
    { "teamId": 1, "points": 25 },
    { "teamId": 2, "points": 15 },
    { "teamId": 3, "points": 5 }
  ]
}
```

**Validações:**

* `teamId` deve existir no evento
* `points` deve ser numérico
* O array `scores` não pode ser vazio
* Apenas o criador do evento pode atualizar a pontuação

**Resposta de Sucesso:**

```json
{
  "message": "Scores for round 2 updated successfully."
}
```

**Status Codes:**

| Código | Descrição                          |
| ------ | ---------------------------------- |
| `200`  | Pontuação atualizada com sucesso   |
| `400`  | Dados inválidos ou rodada inválida |
| `401`  | Não autenticado                    |
| `403`  | Usuário não é o criador do evento  |
| `404`  | Evento não encontrado              |
| `500`  | Erro interno na transação          |

**Notas Técnicas:**

* As atualizações utilizam o comando SQL `MERGE`, permitindo inserir ou atualizar em uma única operação.
* Todas as operações são executadas dentro de uma **transação** SQL para garantir atomicidade.

---

### 2. Consultar Ranking Atual

**GET** `/:eventId/leaderboard`

Retorna o ranking completo de um evento, ordenado pela soma total de pontos de cada time.

**Parâmetros:**

| Parâmetro | Tipo   | Descrição    |
| --------- | ------ | ------------ |
| `eventId` | number | ID do evento |

**Resposta de Sucesso:**

```json
[
  {
    "Rank": 1,
    "TeamId": 12,
    "TeamName": "Red Dragons",
    "LogoURL": "https://example.com/logos/red.png",
    "TotalPoints": 85
  },
  {
    "Rank": 2,
    "TeamId": 5,
    "TeamName": "Blue Wolves",
    "LogoURL": "https://example.com/logos/blue.png",
    "TotalPoints": 73
  }
]
```

**Status Codes:**

| Código | Descrição                |
| ------ | ------------------------ |
| `200`  | Sucesso                  |
| `400`  | `eventId` inválido       |
| `404`  | Evento não encontrado    |
| `500`  | Erro interno do servidor |

**Regra de Ranking:**

* O ranking é calculado com `DENSE_RANK()` baseado na soma total dos pontos (`SUM(Points)`).
* Empates recebem a mesma posição no ranking (exemplo: dois times com 50 pontos ficam ambos em 2º lugar).

---

### 3. Estrutura de Banco de Dados (Leaderboard)

#### Tabela: `LeaderboardScores`

| Campo            | Tipo          | Descrição                |
| ---------------- | ------------- | ------------------------ |
| `EventID`        | int           | ID do evento             |
| `TeamID`         | int           | ID do time               |
| `RoundNumber`    | int           | Número da rodada         |
| `Points`         | decimal(10,2) | Pontos obtidos na rodada |
| `CreatedAt`      | datetime      | Data de inserção         |
| `LastModifiedAt` | datetime      | Última atualização       |

**Chave Primária Composta:**
`(EventID, TeamID, RoundNumber)`

---

## 📘 Observações Técnicas

* Cada evento possui um **modo de jogo (`Mode`)**, que define as regras e endpoints disponíveis.
  Exemplos: `Leaderboard`, `Elimination`, `GroupStage`, `Swiss`, entre outros.


## 🏆 Sistema de Partidas e Leaderboard

O serviço de **MatchControllers** é responsável pelo gerenciamento de partidas e rankings de eventos. **.

A arquitetura foi desenhada para suportar diferentes modos de evento (`Mode`)

---

### 🔗 Base URL

```
http://api.localhost/api/events/:eventId
```

### 🔒 Autenticação

Todas as rotas de **Leaderboard** exigem autenticação via JWT (`accessToken`), exceto a rota pública de visualização do ranking.

---

## ⚙️ Middleware de Validação - `getEventAndValidate`

Antes de qualquer rota sob `/events/:eventId/...`, é executado o middleware de validação do evento:

**Funções:**

* Verifica se `eventId` é válido
* Busca o evento no banco
* Anexa as informações ao `res.locals.event`
* Cria e compartilha uma conexão SQL (`res.locals.db_pool`)
* Fecha a conexão automaticamente após a resposta

**Erros Possíveis:**

| Código | Erro                        |
| ------ | --------------------------- |
| `400`  | `Invalid eventId`           |
| `404`  | `Event not found`           |
| `500`  | `Failed to process request` |

---


## 🎮 Leaderboard - Pontuação e Ranking

### 1. Adicionar/Atualizar Pontos de uma Rodada

**POST** `/:eventId/leaderboard/round/:roundNumber`

Registra ou atualiza os pontos de times em uma rodada específica.
Apenas o criador do evento pode realizar esta ação.

**Headers:**

```
Cookie: accessToken=<jwt_token>
```

**Parâmetros:**

| Parâmetro     | Tipo   | Descrição                                                  |
| ------------- | ------ | ---------------------------------------------------------- |
| `eventId`     | number | ID do evento (precisa existir e ser do tipo *Leaderboard*) |
| `roundNumber` | number | Número da rodada (ex: 1, 2, 3...)                          |

**Body:**

```json
{
  "scores": [
    { "teamId": 1, "points": 25 },
    { "teamId": 2, "points": 15 },
    { "teamId": 3, "points": 5 }
  ]
}
```

**Validações:**

* `teamId` deve existir no evento
* `points` deve ser numérico
* O array `scores` não pode ser vazio
* Apenas o criador do evento pode atualizar a pontuação

**Resposta de Sucesso:**

```json
{
  "message": "Scores for round 2 updated successfully."
}
```

**Status Codes:**

| Código | Descrição                          |
| ------ | ---------------------------------- |
| `200`  | Pontuação atualizada com sucesso   |
| `400`  | Dados inválidos ou rodada inválida |
| `401`  | Não autenticado                    |
| `403`  | Usuário não é o criador do evento  |
| `404`  | Evento não encontrado              |
| `500`  | Erro interno na transação          |

**Notas Técnicas:**

* As atualizações utilizam o comando SQL `MERGE`, permitindo inserir ou atualizar em uma única operação.
* Todas as operações são executadas dentro de uma **transação** SQL para garantir atomicidade.

---

### 2. Consultar Ranking Atual

**GET** `/:eventId/leaderboard`

Retorna o ranking completo de um evento, ordenado pela soma total de pontos de cada time.

**Parâmetros:**

| Parâmetro | Tipo   | Descrição    |
| --------- | ------ | ------------ |
| `eventId` | number | ID do evento |

**Resposta de Sucesso:**

```json
[
  {
    "Rank": 1,
    "TeamId": 12,
    "TeamName": "Red Dragons",
    "LogoURL": "https://example.com/logos/red.png",
    "TotalPoints": 85
  },
  {
    "Rank": 2,
    "TeamId": 5,
    "TeamName": "Blue Wolves",
    "LogoURL": "https://example.com/logos/blue.png",
    "TotalPoints": 73
  }
]
```

**Status Codes:**

| Código | Descrição                |
| ------ | ------------------------ |
| `200`  | Sucesso                  |
| `400`  | `eventId` inválido       |
| `404`  | Evento não encontrado    |
| `500`  | Erro interno do servidor |

**Regra de Ranking:**

* O ranking é calculado com `DENSE_RANK()` baseado na soma total dos pontos (`SUM(Points)`).
* Empates recebem a mesma posição no ranking (exemplo: dois times com 50 pontos ficam ambos em 2º lugar).

---

### 3. Estrutura de Banco de Dados (Leaderboard)

#### Tabela: `LeaderboardScores`

| Campo            | Tipo          | Descrição                |
| ---------------- | ------------- | ------------------------ |
| `EventID`        | int           | ID do evento             |
| `TeamID`         | int           | ID do time               |
| `RoundNumber`    | int           | Número da rodada         |
| `Points`         | decimal(10,2) | Pontos obtidos na rodada |
| `CreatedAt`      | datetime      | Data de inserção         |
| `LastModifiedAt` | datetime      | Última atualização       |

**Chave Primária Composta:**
`(EventID, TeamID, RoundNumber)`

---

## 📘 Observações Técnicas

* Cada evento possui um **modo de jogo (`Mode`)**, que define as regras e endpoints disponíveis.
  Exemplos: `Leaderboard`, `Elimination`, `GroupStage`, `Swiss`, entre outros.


---

## 📝 Notas Importantes

1. **Conversão de Nomes**: Todos os campos retornados pela API estão em **camelCase** (ex: `eventId`, `teamName`), enquanto os campos enviados no body podem estar em **PascalCase** (ex: `Title`, `TeamName`).

2. **Paginação**: O endpoint `GET /events` suporta paginação através dos parâmetros `page` e `limit`. O padrão é `page=1` e `limit=10`.

3. **Dados Enriquecidos**: Os endpoints `GET /:eventId` e `GET /teams/:teamId` retornam dados relacionados (organizador, jogo, membros) automaticamente para reduzir chamadas ao frontend.

4. **Autenticação Opcional**: Alguns endpoints GET podem ser acessados sem autenticação, mas retornam informações adicionais quando autenticado (ex: `isRegistered`, `canJoin`).

5. **Timestamp**: Todas as respostas incluem um campo `timestamp` com a data/hora da resposta em formato ISO 8601.

Esta documentação reflete as melhorias implementadas na API para fornecer respostas padronizadas, consistentes e enriquecidas.