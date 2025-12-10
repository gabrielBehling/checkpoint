# Documentação do Projeto Checkpoint

## 📋 Visão Geral

O **Checkpoint** é uma plataforma completa para gerenciamento de eventos e competições, construída com arquitetura de microserviços. O sistema permite o cadastro de usuários, criação de times, organização de eventos e gerenciamento de partidas.

## 🏗️ Arquitetura

### Stack Tecnológica
- **Frontend**: React + Vite
- **Backend**: Node.js + Express (Microserviços)
- **Bancos de Dados**: 
  - SQL Server (Dados relacionais)
  - MongoDB (Chat e dados não-relacionais)
  - Redis (Cache e sessões)
- **Message Broker**: Kafka (Comunicação assíncrona)
- **Proxy**: Nginx
- **Containerização**: Docker + Docker Compose

### Estrutura de Microserviços

| Serviço | Descrição | Docs |
|---------|-----------|------|
| Auth Service | Autenticação e autorização | [auth](./microservices/auth-service/docs.md) |
| Events Service | Gerenciamento de eventos | [events](./microservices/events-service/docs.md) |
| Chat Service | Sistema de mensagens |
| Notification Service | Notificações e emails |

## 🚀 Instalação e Configuração

### Pré-requisitos
- Docker
- Docker Compose

### Configuração Inicial

1. **Clone o repositório**:
```bash
git clone https://github.com/gabrielBehling/checkpoint.git
cd checkpoint
```

2. **Configure as variáveis de ambiente**:
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas configurações.

3. **Execute a aplicação**:
```bash
docker compose up --build
```

### URLs de Acesso
- **Frontend**: https://checkpoint.buzz
- **API Gateway**: https://checkpoint.buzz/api/{serviço}

