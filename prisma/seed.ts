import { PrismaClient, OrderStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Configurar DATABASE_URL se não estiver definida
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://admin:password@localhost:5432/mecanizou';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Limpar dados existentes (ordem importa por causa das FKs)
  console.log('🧹 Limpando dados existentes...');
  await prisma.processedEvents.deleteMany();
  await prisma.invoices.deleteMany();
  await prisma.outboxEvents.deleteMany();
  await prisma.orders.deleteMany();
  console.log('✅ Dados limpos\n');

  // Criar pedidos de exemplo
  console.log('📦 Criando pedidos de exemplo...');

  const order1 = await prisma.orders.create({
    data: {
      id: '11111111-1111-1111-1111-111111111111',
      amount: 15000, // R$ 150.00
      status: OrderStatus.PENDING,
    },
  });
  console.log(`   ✓ Pedido PENDING criado: ${order1.id} (R$ 150,00)`);

  const order2 = await prisma.orders.create({
    data: {
      id: '22222222-2222-2222-2222-222222222222',
      amount: 25000, // R$ 250.00
      status: OrderStatus.PENDING,
    },
  });
  console.log(`   ✓ Pedido PENDING criado: ${order2.id} (R$ 250,00)`);

  const order3 = await prisma.orders.create({
    data: {
      id: '33333333-3333-3333-3333-333333333333',
      amount: 50000, // R$ 500.00
      status: OrderStatus.PAID,
    },
  });
  console.log(`   ✓ Pedido PAID criado: ${order3.id} (R$ 500,00)`);

  const order4 = await prisma.orders.create({
    data: {
      id: '44444444-4444-4444-4444-444444444444',
      amount: 10000, // R$ 100.00
      status: OrderStatus.PAID,
    },
  });
  console.log(`   ✓ Pedido PAID criado: ${order4.id} (R$ 100,00)`);

  console.log(`✅ ${4} pedidos criados\n`);

  // Criar eventos na outbox para pedidos já pagos (simular histórico)
  console.log('📬 Criando eventos na outbox...');

  const event1 = await prisma.outboxEvents.create({
    data: {
      eventId: 'evt-11111111-1111-1111-1111-111111111111',
      eventType: 'ORDER_PAID',
      orderId: order3.id,
      amount: order3.amount,
      publishedAt: new Date(),
    },
  });
  console.log(`   ✓ Evento publicado: ${event1.eventId} (order ${order3.id})`);

  const event2 = await prisma.outboxEvents.create({
    data: {
      eventId: 'evt-22222222-2222-2222-2222-222222222222',
      eventType: 'ORDER_PAID',
      orderId: order4.id,
      amount: order4.amount,
      publishedAt: new Date(),
    },
  });
  console.log(`   ✓ Evento publicado: ${event2.eventId} (order ${order4.id})`);

  // Criar evento pendente (para testar worker)
  const event3 = await prisma.outboxEvents.create({
    data: {
      eventId: 'evt-33333333-3333-3333-3333-333333333333',
      eventType: 'ORDER_CREATED',
      orderId: order1.id,
      amount: order1.amount,
      publishedAt: null, // Pendente
    },
  });
  console.log(
    `   ✓ Evento pendente: ${event3.eventId} (aguardando worker processar)`,
  );

  console.log(`✅ ${3} eventos criados na outbox\n`);

  // Criar invoices para pedidos já processados
  console.log('📄 Criando invoices...');

  const invoice1 = await prisma.invoices.create({
    data: {
      id: 'inv-11111111-1111-1111-1111-111111111111',
      orderId: order3.id,
      amount: order3.amount,
    },
  });
  console.log(`   ✓ Invoice criada: ${invoice1.id} para pedido ${order3.id}`);

  const invoice2 = await prisma.invoices.create({
    data: {
      id: 'inv-22222222-2222-2222-2222-222222222222',
      orderId: order4.id,
      amount: order4.amount,
    },
  });
  console.log(`   ✓ Invoice criada: ${invoice2.id} para pedido ${order4.id}`);

  console.log(`✅ ${2} invoices criadas\n`);

  // Criar registros de eventos processados
  console.log('✅ Criando registros de eventos processados...');

  await prisma.processedEvents.create({
    data: {
      eventId: event1.eventId,
      eventType: 'ORDER_PAID',
    },
  });
  console.log(`   ✓ Evento ${event1.eventId} marcado como processado`);

  await prisma.processedEvents.create({
    data: {
      eventId: event2.eventId,
      eventType: 'ORDER_PAID',
    },
  });
  console.log(`   ✓ Evento ${event2.eventId} marcado como processado`);

  console.log(`✅ ${2} eventos marcados como processados\n`);

  // Resumo final
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Seed concluído com sucesso!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📊 Resumo:');
  console.log(`   • ${4} pedidos (2 PENDING, 2 PAID)`);
  console.log(`   • ${3} eventos na outbox (2 publicados, 1 pendente)`);
  console.log(`   • ${2} invoices geradas`);
  console.log(`   • ${2} eventos processados registrados`);
  console.log('');

  console.log('🧪 Testes sugeridos:');
  console.log('   1. Pagar pedido pendente:');
  console.log(
    `      curl -X POST http://localhost:3000/orders/${order1.id}/pay`,
  );
  console.log('');
  console.log('   2. Verificar invoices criadas:');
  console.log('      curl http://localhost:3000/invoices');
  console.log('');
  console.log('   3. Verificar estatísticas:');
  console.log('      curl http://localhost:3000/invoices/stats');
  console.log('');
  console.log(
    '   4. Ver eventos pendentes (deve aparecer o evento ORDER_CREATED):',
  );
  console.log(
    '      docker exec -it postgres_mecanizou psql -U postgres -d mecanizou -c "SELECT * FROM outbox_events WHERE published_at IS NULL;"',
  );
  console.log(
    '💡 Dica: Use o pgAdmin em http://localhost:8080 para explorar o banco!',
  );
  console.log('');
  console.log('💡 O worker deve processar automaticamente o evento pendente!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante seed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
