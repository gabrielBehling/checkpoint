# 📅 API de Eventos - Checkpoint

## Base URL
```
http://api.localhost/api/events
```

## 🔐 Autenticação
Todos os endpoints (exceto `/health`) requerem autenticação via JWT token.

## 📋 Endpoints

### Health Check
**GET** `/health`

Verifica o status do serviço.

**Resposta:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

## 🎯 Gerenciamento de Eventos

### 1. Criar Evento
**POST** `/`

Cria um novo evento.

**Headers:**
```
Cookie: accessToken=<jwt_token>
```

**Body:**
```json
{
  "Title": "Torneio de CS2",
  "Description": "Campeonato aberto de Counter Strike 2",
  "GameID": 1,
  "Mode": "5v5",
  "StartDate": "2024-02-01T14:00:00Z",
  "EndDate": "2024-02-01T18:00:00Z",
  "Location": "Online",
  "Ticket": 50.00,
  "ParticipationCost": 100.00,
  "Language": "Português",
  "Platform": "PC",
  "IsOnline": true,
  "MaxParticipants": 100,
  "TeamSize": 5,
  "MaxTeams": 20,
  "Rules": "Melhor de 3 mapas...",
  "Prizes": "1º lugar: R$ 1000,00",
  "BannerURL": "https://example.com/banner.jpg",
  "Status": "Active"
}
```

**Campos Obrigatórios:**
- `Title` (string)
- `Description` (string) 
- `StartDate` (date)
- `EndDate` (date)
- `IsOnline` (boolean)

**Resposta:**
```json
{
  "message": "Event created successfully"
}
```

**Status Codes:**
- `201`: Evento criado com sucesso
- `400`: Dados inválidos
- `401`: Não autenticado

---

### 2. Atualizar Evento
**PUT** `/:eventId`

Atualiza um evento existente. Apenas o criador do evento pode atualizá-lo.

**Headers:**
```
Cookie: accessToken=<jwt_token>
```

**Parâmetros:**
- `eventId` (number) - ID do evento

**Body:** (campos opcionais)
```json
{
  "Title": "Novo título",
  "Description": "Nova descrição",
  "Status": "Canceled"
}
```

**Resposta:**
```json
{
  "message": "Event updated successfully"
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

**Resposta:**
```json
{
  "message": "Event deleted successfully"
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

Busca eventos com filtros avançados.

**Headers:**
```
Cookie: accessToken=<jwt_token>
```

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

**Exemplo de Uso:**
```
GET /api/events?game=CS2&isOnline=true&status=Active&search=torneio
```

**Resposta:**
```json
[
  {
    "EventID": 1,
    "Title": "Torneio de CS2",
    "Description": "Campeonato aberto...",
    "GameID": 1,
    "Mode": "5v5",
    "StartDate": "2024-02-01T14:00:00.000Z",
    "EndDate": "2024-02-01T18:00:00.000Z",
    "Location": "Online",
    "Ticket": 50.00,
    "ParticipationCost": 100.00,
    "Language": "Português",
    "Platform": "PC",
    "IsOnline": true,
    "MaxParticipants": 100,
    "TeamSize": 5,
    "MaxTeams": 20,
    "Rules": "Melhor de 3 mapas...",
    "Prizes": "1º lugar: R$ 1000,00",
    "BannerURL": "https://example.com/banner.jpg",
    "Status": "Active",
    "CreatedBy": 123
  }
]
```

---

## 👥 Gerenciamento de Times

### 5. Criar Time para Evento
**POST** `/:eventId/teams`

Cria um novo time e registra para um evento.

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

**Resposta:**
```json
{
  "message": "Team created successfully"
}
```

**Status Codes:**
- `201`: Time criado com sucesso
- `400`: Dados inválidos ou limite de times atingido
- `401`: Não autenticado
- `404`: Evento não encontrado

---

### 6. Listar Times de um Evento
**GET** `/:eventId/teams`

Lista todos os times registrados em um evento.

**Parâmetros:**
- `eventId` (number) - ID do evento

**Resposta:**
```json
[
  {
    "TeamID": 1,
    "TeamName": "Team Alpha",
    "LogoURL": "https://example.com/logo.png",
    "CreatedBy": 123,
    "EventID": 1,
    "Status": "Approved",
    "RegisteredAt": "2024-01-01T10:00:00.000Z"
  }
]
```

---

### 7. Buscar Informações do Time
**GET** `/teams/:teamId`

Retorna informações detalhadas de um time específico em um evento.

**Parâmetros:**
- `teamId` (number) - ID do time

**Resposta:**
```json
{
  "TeamID": 1,
  "TeamName": "Team Alpha",
  "LogoURL": "https://example.com/logo.png",
  "CreatedBy": 123,
  "EventID": 1,
  "Status": "Approved",
  "RegisteredAt": "2024-01-01T10:00:00.000Z",
  "MemberCount": 4
}
```

**Status Codes:**
- `200`: Sucesso
- `401`: Não autenticado
- `404`: Time ou evento não encontrado

---

### 8. Entrar em um Time
**POST** `/teams/:teamId/join`

Permite que um usuário entre em um time específico, desde que o time não esteja cheio.

**Headers:**
```
Cookie: accessToken=<jwt_token>
```

**Parâmetros:**
- `teamId` (number) - ID do time

**Resposta:**
```json
{
  "message": "Joined team successfully"
}
```

**Status Codes:**
- `200`: Entrada no time bem-sucedida
- `400`: Erro de validação (time cheio ou usuário já é membro)
- `401`: Não autenticado
- `404`: Time não encontrado
- `500`: Erro interno do servidor

**Regras de Validação:**
- O usuário não pode entrar em um time do qual já é membro
- O time não pode exceder o número máximo de membros definido no evento

---

## 🗃️ Modelo de Dados

### Evento
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `EventID` | number | ID único do evento |
| `Title` | string | Título do evento |
| `Description` | string | Descrição detalhada |
| `GameID` | number | ID do jogo |
| `Mode` | string | Modo de jogo |
| `StartDate` | datetime | Data/hora de início |
| `EndDate` | datetime | Data/hora de término |
| `Location` | string | Local do evento |
| `Ticket` | decimal | Preço do ingresso |
| `ParticipationCost` | decimal | Custo de participação |
| `Language` | string | Idioma principal |
| `Platform` | string | Plataforma (PC, Console, etc) |
| `IsOnline` | boolean | Evento online |
| `MaxParticipants` | number | Máximo de participantes |
| `TeamSize` | number | Tamanho do time |
| `MaxTeams` | number | Máximo de times |
| `Rules` | string | Regras do evento |
| `Prizes` | string | Premiação |
| `BannerURL` | string | URL do banner |
| `Status` | string | Status: Active, Canceled, Finished |

### Time
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `TeamID` | number | ID único do time |
| `TeamName` | string | Nome do time |
| `LogoURL` | string | URL do logo |
| `CreatedBy` | number | ID do criador |
| `ChatID` | uuid | ID do chat do time |

---

## 🛡️ Regras de Negócio

### Permissões
- Apenas usuários autenticados podem criar/editar eventos
- Apenas o criador do evento pode editá-lo ou deletá-lo
- Times podem ser criados por qualquer usuário autenticado

### Validações
- Data de início deve ser anterior à data de término
- Limite de times respeita `MaxTeams` do evento
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

### Códigos de Status
- `200`: Sucesso
- `201`: Criado com sucesso
- `400`: Dados inválidos ou validação falhou
- `401`: Token inválido ou não fornecido
- `403`: Sem permissão para a operação
- `404`: Recurso não encontrado
- `500`: Erro interno do servidor

### Exemplo de Erro:
```json
{
  "error": "Invalid eventId"
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

### Buscar Eventos Ativos de CS2
```bash
curl "http://api.localhost/api/events?game=CS2&status=Active&isOnline=true" \
  -H "Cookie: accessToken=your_jwt_token"
```

Esta documentação será atualizada conforme novos endpoints forem implementados no serviço de Events.