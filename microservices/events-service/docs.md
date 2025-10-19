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

### 9. Remover Membro do Time
**DELETE** `/teams/:teamId/members/:memberId`

Remove um membro específico de um time. O membro pode ser removido pelo capitão do time (CreatedBy) ou pode sair voluntariamente (quando memberId é o próprio usuário).

**Headers:**
```
Cookie: accessToken=<jwt_token>
```

**Parâmetros:**
- `teamId` (number) - ID do time
- `memberId` (number) - ID do usuário a ser removido

**Resposta:**
```json
{
  "message": "Member removed successfully"
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


Esta documentação será atualizada conforme novos endpoints forem implementados no serviço de Events.