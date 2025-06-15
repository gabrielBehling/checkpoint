#### Funcionamento
### Auth

Form -> api.auth(POST) -> redirect to first page or to dashboard

Login
```mermaid
sequenceDiagram
  Frontend->>Auth-Service: POST /login (email, senha)
  Auth-Service->>MSSQL: Verifica credenciais
  MSSQL-->>Auth-Service: Dados do usuário
  Auth-Service->>Redis: Armazena sessão (token:user_id)
  Auth-Service-->>Frontend: JWT + Dados do usuário
```

Acesso a rotas protegidas
```mermaid
sequenceDiagram
  Frontend->>API: Request com JWT no header
  API->>Redis: Verifica token ativo
  Redis-->>API: Sessão válida/inválida
  API->>MSSQL: Busca dados adicionais (se necessário)
  API-->>Frontend: Dados protegidos
```

Refresh token
```mermaid
sequenceDiagram
  Frontend->>Auth-Service: POST /refresh (refresh_token)
  Auth-Service->>Redis: Verifica refresh_token
  Redis-->>Auth-Service: Válido/Inválido
  Auth-Service-->>Frontend: Novo JWT (se válido)
```
### Diagramas Gerais

##### Visão geral
```mermaid
flowchart TD
    A[Frontend: React] -->|HTTP/WS| B[API Gateway: NGINX]
    B -->|Load Balancing| C[Backend: Node.js]
    C --> D[(Database: MSSQL)]
    C --> E[(Cache: Redis)]
    C --> F[Pub/Sub: Kafka]
    A -->|WebSocket| G[Socket.IO Server]
    G --> E
    G --> H[(Chat Storage: MongoDB)]
    F --> I[Worker: Processar Inscrições]
    I --> D
    A --> J[CDN: Imagens/Assets]
```

##### MSSQL
```mermaid
erDiagram
    USERS ||--o{ EVENTS : "Organiza"
    USERS ||--o{ TEAMS : "Participa"
    EVENTS ||--o{ REGISTRATIONS : "Tem"
    TEAMS ||--o{ CHAT_MESSAGES : "Possui"
```
##### Sistema de Chat
```mermaid
sequenceDiagram
    Frontend->>Socket.IO: joinTeam(teamId)
    Socket.IO->>Redis: Adiciona à sala
    Frontend->>Socket.IO: sendMessage(msg)
    Socket.IO->>MongoDB: Persiste mensagem
    Socket.IO->>Frontend: broadcastMessage(msg)
```

##### Criação de evento
```mermaid
sequenceDiagram
    Usuário->>Frontend: Clica em "Inscrever-se"
    Frontend->>API Gateway: POST /api/registrations
    API Gateway->>Backend: Valida JWT
    Backend->>Kafka: Publica evento "nova_inscrição"
    Kafka->>Worker: Processa inscrição
    Worker->>MSSQL: Atualiza tabela Registrations
    Worker->>Socket.IO: Notifica equipe
    Socket.IO->>Frontend: Atualiza UI em tempo real
```


#### Fallbacks

##### Chat
```mermaid
flowchart TD
    A[Socket.IO tenta publicar mensagem no Redis] -->|Falha| B[Ativa modo 'Degradado']
    B --> C[Persiste mensagem direto no MongoDB]
    C --> D[Notifica frontend via polling]
    D --> E[Frontend usa HTTP polling se WebSocket falhar]
```

##### Kafka
```mermaid
flowchart LR
    A[API recebe inscrição] -->|Kafka offline| B[Grava em tabela 'pending_registrations' no MSSQL]
    B --> C[Worker verifica fila periodicamente]
    C -->|Kafka volta| D[Processa inscrições pendentes]
```

##### MSSQL
```mermaid
flowchart TD
    A[Requisição ao MSSQL] -->|Timeout| B[Lê do Redis Cache]
    B -->|Dados ausentes| C[Retorna dados mockados ou erro customizado]
```

##### CDN
```mermaid
flowchart LR
    A[Frontend detecta falha na CDN] --> B[Busca assets do S3]
    B -->|Falha| C[Usa versão compactada local em React]
```
