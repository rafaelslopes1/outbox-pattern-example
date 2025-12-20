# Respostas Técnicas

## 1. Atomicidade

**Pergunta:** Onde no código está garantida a atomicidade entre atualizar `orders` e inserir o evento na outbox?

**Resposta:**
A atomicidade é garantida pelo uso do método `transaction` do `UnitOfWork` (que encapsula `prisma.$transaction`). No método `payOrder` do `OrdersService`, a atualização do status do pedido e a inserção do evento na tabela `outbox_events` ocorrem dentro da mesma transação de banco de dados. Se qualquer uma das operações falhar, todo o conjunto é revertido (rollback), garantindo que não haja inconsistência (ex: pedido pago sem evento gerado).

## 2. Publicação duplicada

**Pergunta:** Como seu worker evita publicar o mesmo evento duas vezes? (Ou: se publicar 2x, por que isso não quebra o sistema?)

**Resposta:**
O worker busca eventos onde `publishedAt` é nulo. Após publicar com sucesso no broker, ele atualiza o campo `publishedAt` com a data atual.
Embora isso minimize duplicatas, não as elimina completamente (ex: falha após publicar e antes de atualizar o banco). Por isso, o sistema foi desenhado assumindo entrega "At-Least-Once". A segurança final não está no worker, mas no **Consumer Idempotente**, que garante que o processamento duplicado não gere efeitos colaterais duplicados.

## 3. Idempotência

**Pergunta:** Como você implementou a idempotência no consumer? Qual é a chave idempotente usada?

**Resposta:**
A idempotência foi implementada utilizando a estratégia "Try-First" com o banco de dados.

- **Chave Idempotente:** O `eventId` (UUID v4 gerado na origem).
- **Mecanismo:** Ao receber um evento, tentamos inserir um registro na tabela `processed_events` usando o `eventId` como Primary Key.
- Se a inserção falhar com erro de violação de unicidade (`P2002`), sabemos que o evento já foi processado e ignoramos a operação.
- Isso elimina Race Conditions que ocorreriam com uma verificação prévia (`SELECT` antes de `INSERT`).

## 4. Ordem de operações

**Pergunta:** Em que ordem você marca o evento como "publicado" e envia ao broker? Por que escolheu essa ordem?

**Resposta:**

1. **Enviar ao Broker.**
2. **Marcar como publicado (UPDATE no banco).**

Escolhi essa ordem para garantir a entrega ("At-Least-Once"). Se marcássemos como publicado *antes* de enviar e o envio falhasse, o evento seria perdido para sempre. Marcando *depois*, o pior cenário é uma falha entre o envio e a atualização, o que levaria a um reenvio (duplicidade), que é tratado pela idempotência do consumidor.

## 5. Cenários de falha

**Pergunta:** Qual o comportamento do sistema quando:

- **DB confirma a transação, mas o broker falha:** O evento fica salvo na tabela `outbox_events` com `publishedAt: null`. O worker tentará enviá-lo novamente no próximo ciclo.
- **Broker publica, mas o worker cai antes de marcar como publicado:** O evento permanece como não publicado no banco. O worker reenviará o evento ao reiniciar. O consumer receberá o evento duplicado, mas o descartará devido à verificação de idempotência.
- **Consumer processa, mas cai antes de confirmar:** Como a criação da Invoice e a marcação em `processed_events` ocorrem em uma transação atômica, se o consumer cair antes do commit, ambas as operações são revertidas. O worker reenviará a mensagem, e o processamento ocorrerá novamente com sucesso.

## 6. Trade-offs

**Pergunta:** Que simplificações você fez por ser um teste com um prazo reduzido? O que faria diferente em produção?

**Resposta:**

- **Broker em Memória:** Usei um `EventEmitter` local para simular o broker. Em produção, usaria um message broker robusto como RabbitMQ, SQS/SNS para garantir persistência e desacoplamento real entre serviços.
- **Tratamento de Dead Letter:** Implementei um contador de falhas simples. Em produção, implementaria uma Dead Letter Queue (DLQ) real e monitoramento/alertas para eventos que falharam repetidamente.
- **Escalabilidade:** O worker é único. Em produção, consideraria múltiplas instâncias com locks distribuídos para evitar processamento concorrente do mesmo evento.
