# Checkpoint

## Primeiros Passos

### Obtendo o Código

Clone o repositório:
```bash
git clone https://github.com/gabrielBehling/checkpoint.git
cd checkpoint
```

### Pré-requisitos
- Docker
- Docker Compose

### Configuração Inicial

1. Copie o arquivo de exemplo de variáveis de ambiente:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e configure as senhas necessárias:
- `MONGO_PASSWORD`: Defina uma senha para o MongoDB
- `MSSQL_PASSWORD`: Defina uma senha para o SQL Server

### Iniciando a Aplicação

1. Inicie os containers:
```bash
docker compose up --build
```

2. A aplicação estará disponível nos seguintes endereços:
- Frontend: http://api.localhost
- Backend: http://api.localhost/{serviço}
    ( Eg. http://api.localhost/auth )

### Parando a Aplicação

Para parar os containers:
```bash
docker compose down
```

