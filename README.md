# Teste Técnico — Outbox + Processamento Idempotente

Este repositório contém a implementação de um sistema de marketplace com **Transactional Outbox Pattern**, garantindo consistência eventual e processamento idempotente de eventos.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     POST /orders/:id/pay                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Transaction                                         │    │
│  │  1. UPDATE orders SET status = 'PAID'               │    │
│  │  2. INSERT outbox_events (eventType='OrderPaid')    │    │
│  │ COMMIT                                              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│              Outbox Relay Worker (polling 5s)                                            │
│  1. SELECT * FROM outbox_events WHERE publishedAt IS NULL AND failureCount < MAX_RETRIES │
│  2. broker.publish(event)                                                                │
│  3. UPDATE outbox_events SET publishedAt = NOW()                                         │
│                                                                                          │
│  Retry: Polling constante (5s)                                                           │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│                    InvoicesService (Consumer)                │
│  1. Tenta processar (Idempotência via Unique Constraint)     │
│  2. Transaction:                                             │
│     - INSERT processed_events                                │
│     - INSERT invoices                                        │
│  3. COMMIT                                                   │
│                                                              │
│  Idempotência: eventId como chave única                      │
└──────────────────────────────────────────────────────────────┘
```

## 🚀 Como subir o ambiente

### Pré-requisitos

- Node.js (v18+)
- Docker e Docker Compose

### Passos

1. **Instalar dependências:**

   ```bash
   npm install
   ```

2. **Subir o banco de dados:**

   ```bash
   docker-compose up -d
   ```

3. **Aplicar as migrações do banco:**

   ```bash
   npx prisma migrate dev
   ```

4. **Aplicar dados iniciais (seed):**

   ```bash
   npx prisma db seed
   ```

5. **Iniciar a aplicação:**

   ```bash
   npm run start:dev
   ```

   A API estará disponível em `http://localhost:3000`.

---

## 📚 Documentação

Para manter este arquivo conciso, a documentação detalhada foi separada:

- **[Guia de Uso e Endpoints](./USAGE.md)**: Detalhes de todos os endpoints, exemplos de `curl`, como testar o fluxo completo, monitorar logs e simular falhas.
- **[Respostas Técnicas](./ANSWERS.md)**: Respostas para as perguntas teóricas sobre atomicidade, idempotência e trade-offs.

---

## 🗂 Modelagem de Dados

O sistema utiliza PostgreSQL com as seguintes tabelas principais:

### `orders`

Armazena os pedidos do marketplace.

- `id`: UUID (PK)
- `amount`: Valor em centavos
- `status`: PENDING | PAID
- `createdAt`, `updatedAt`

### `outbox_events`

Fila de eventos pendentes de publicação (Pattern Outbox).

- `eventId`: UUID (PK)
- `eventType`: Tipo do evento (ex: OrderPaid)
- `orderId`: Referência ao pedido
- `amount`: Valor do pedido
- `publishedAt`: Data de publicação (NULL = pendente)
- `failureCount`: Contador de retentativas

### `invoices`

Representa o efeito colateral do processamento (Nota Fiscal).

- `id`: UUID (PK)
- `orderId`: Referência ao pedido (Unique)
- `amount`: Valor
- `issuedAt`: Data de emissão

### `processed_events`

Garante a idempotência do consumidor.

- `eventId`: UUID do evento processado (PK)
- `processedAt`: Data de processamento
