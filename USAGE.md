# Guia de Uso e Endpoints

Este documento detalha os endpoints da API, como testar o fluxo completo, monitorar logs e simular falhas.

Para instruções de instalação e arquitetura, consulte o [README.md](./README.md).

## 📡 Endpoints

### Orders

#### `POST /orders`
Cria um novo pedido.

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"amount": 15000}'
```

**Response:**
```json
{
  "id": "uuid",
  "amount": 15000,
  "status": "PENDING",
  "createdAt": "2025-12-19T..."
}
```

---

#### `POST /orders/:id/pay`
**Endpoint transacional** que marca pedido como pago e cria evento na outbox atomicamente.

```bash
curl -X POST http://localhost:3000/orders/{orderId}/pay
```

**Response:**
```json
{
  "id": "uuid",
  "amount": 15000,
  "status": "PAID",
  "updatedAt": "2025-12-19T..."
}
```

**O que acontece:**
1. ✅ Pedido marcado como `PAID` no banco
2. ✅ Evento `OrderPaid` inserido na outbox **na mesma transação**
3. ✅ Worker publica evento no broker (in-memory EventEmitter)
4. ✅ Consumer cria invoice idempotentemente

---

#### `GET /orders`
Lista todos os pedidos.

```bash
curl http://localhost:3000/orders
```

---

#### `GET /orders/:id`
Busca pedido por ID.

```bash
curl http://localhost:3000/orders/{orderId}
```

---

### Invoices

#### `GET /invoices`
Lista todas as invoices geradas.

```bash
curl http://localhost:3000/invoices
```

---

#### `GET /invoices/:id`
Busca invoice por ID.

```bash
curl http://localhost:3000/invoices/{invoiceId}
```

---

#### `GET /invoices/order/:orderId`
Busca invoice gerada para um pedido específico.

```bash
curl http://localhost:3000/invoices/order/{orderId}
```

---

#### `GET /invoices/stats`
Estatísticas de processamento.

```bash
curl http://localhost:3000/invoices/stats
```

**Response:**
```json
{
  "totalInvoices": 42,
  "totalProcessedEvents": 42
}
```

---

## 🧪 Testando o fluxo completo

### 1. Criar pedido
```bash
ORDER_ID=$(curl -s -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"amount": 25000}' | jq -r '.id')

echo "Pedido criado: $ORDER_ID"
```

### 2. Pagar pedido (transação atômica)
```bash
curl -X POST http://localhost:3000/orders/$ORDER_ID/pay
```

### 3. Aguardar processamento (worker publica a cada 5s)
```bash
sleep 6
```

### 4. Verificar invoice gerada
```bash
curl http://localhost:3000/invoices/order/$ORDER_ID
```

**Esperado:**
```json
{
  "id": "uuid",
  "orderId": "uuid-do-pedido",
  "amount": 25000,
  "issuedAt": "2025-12-19T..."
}
```

---

## 📊 Monitoramento

### Logs do Outbox Worker
```
[OutboxRelayWorker] 🚀 Outbox Relay Worker iniciado
[OutboxRelayWorker] 📬 Processando 1 eventos pendentes
[BrokerService] 📤 Publicando evento ORDER_PAID (ID: abc-123)
[BrokerService] ✅ Evento ORDER_PAID (ID: abc-123) publicado com sucesso
[OutboxRelayWorker] ✅ Evento abc-123 publicado com sucesso
```

### Logs do Consumer
```
[InvoicesService] 📬 InvoicesService subscrito ao evento ORDER_PAID
[InvoicesService] 🔔 Processando evento abc-123 para pedido xyz
[InvoicesService] ✅ Invoice uuid criada para pedido xyz
```

### Logs de idempotência
```
[InvoicesService] ⏭️ Evento abc-123 já processado (idempotência)
```

### Logs de falha com retry
```
[BrokerService] ❌ Broker simulou falha 1/3
[OutboxRelayWorker] ❌ Erro ao publicar evento abc-123: Broker simulou falha 1/3
... (após 5s) ...
[BrokerService] ❌ Broker simulou falha 2/3
... (após 5s) ...
[BrokerService] ✅ Broker funcionando após 2 falhas simuladas
[OutboxRelayWorker] ✅ Evento abc-123 publicado com sucesso
```

---

## 🔍 Inspeção do banco de dados

### Ver eventos na outbox
```sql
SELECT 
  "eventId",
  "eventType",
  "orderId",
  "publishedAt",
  "failureCount",
  "occurredAt"
FROM outbox_events
ORDER BY "occurredAt" DESC
LIMIT 10;
```

### Ver eventos processados
```sql
SELECT 
  "eventId",
  "eventType",
  "processedAt"
FROM processed_events
ORDER BY "processedAt" DESC;
```

### Ver invoices criadas
```sql
SELECT 
  id,
  "orderId",
  amount,
  "issuedAt"
FROM invoices
ORDER BY "issuedAt" DESC;
```

---

## 🧪 Simulação de falhas

### Configurar falha no broker
O `BrokerService` suporta simulação de falhas. Como não há endpoint exposto para isso, você deve alterar o código diretamente em `src/shared/infra/broker/event-emitter/services/event-emitter.broker.service.ts`:

```typescript
private config: BrokerConfig = {
  simulateFailure: true,      // Ativa simulação
  failuresBeforeSuccess: 3,   // Falha 3 vezes antes de passar
};
```

Isso permite testar:
- ✅ Retry automático (Polling do Worker)
- ✅ Incremento do `failureCount`
- ✅ Registro em `lastError`

---

## 📋 Estrutura do projeto

```
src/
├── app.module.ts
├── main.ts
├── modules/
│   ├── events/
│   │   ├── events.module.ts
│   │   ├── repositories/
│   │   │   └── outbox-events.repository.ts
│   │   └── services/
│   │       └── outbox-relay.worker.ts    # Worker de polling
│   ├── invoices/
│   │   ├── invoices.module.ts
│   │   ├── controllers/
│   │   ├── repositories/
│   │   └── services/
│   │       └── invoices.service.ts       # Consumer idempotente
│   └── orders/
│       ├── orders.module.ts
│       ├── controllers/
│       ├── repositories/
│       └── services/
│           └── orders.service.ts         # Endpoint transacional
└── shared/
    ├── infra/
    │   ├── broker/
    │   │   └── event-emitter/            # Broker in-memory
    │   └── database/
    │       └── prisma.service.ts
    └── unit-of-work/
```

---

## ⚙️ Configuração

### Polling do worker
Em `src/modules/events/services/outbox-relay.worker.ts`:

```typescript
@Cron(CronExpression.EVERY_5_SECONDS) // Polling a cada 5s
// ...
private readonly BATCH_SIZE = 10;
private readonly MAX_RETRIES = 5;
```

---

## 🎯 Garantias do sistema

- ✅ **Atomicidade**: UPDATE + INSERT em transação única
- ✅ **At-least-once delivery**: Eventos nunca são perdidos
- ✅ **Idempotência**: Consumer pode processar mesmo evento múltiplas vezes
- ✅ **Retry automático**: Polling constante até atingir MAX_RETRIES
- ✅ **Auditabilidade**: Histórico completo no banco de dados
