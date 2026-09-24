import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpa registros anteriores se existirem
  await prisma.pestRecord.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('SenhaForte123', 12);

  // 1. Criação dos Usuários de Teste com diferentes Roles
  const admin = await prisma.user.create({
    data: {
      name: 'Administrador do Sistema',
      email: 'admin@fazenda.com.br',
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  const agronomist = await prisma.user.create({
    data: {
      name: 'Dra. Renata Agrônoma',
      email: 'renata@fazenda.com.br',
      password: passwordHash,
      role: Role.AGRONOMIST,
    },
  });

  const operator = await prisma.user.create({
    data: {
      name: 'João Técnico de Campo',
      email: 'joao.campo@fazenda.com.br',
      password: passwordHash,
      role: Role.OPERATOR,
    },
  });

  console.log(`✅ Usuários criados:`);
  console.log(`   - ${admin.email} (ADMIN)`);
  console.log(`   - ${agronomist.email} (AGRONOMIST)`);
  console.log(`   - ${operator.email} (OPERATOR)`);

  // 2. Pontos Georreferenciados de Monitoramento de Pragas (coordenadas reais de lavouras em Goiás / Centro-Oeste)
  const baseLat = -15.7801;
  const baseLng = -47.9292;

  const sampleRecords = [
    {
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      pestName: 'Spodoptera frugiperda (Lagarta-do-cartucho)',
      quantity: 14,
      crop: 'Milho Safrinha',
      plot: 'Talhão 01 - Pivô Central',
      growthStage: 'V4 - 4 folhas',
      notes: 'Folhas raspadas e presença de excrementos nas plantas centrais',
      latitude: baseLat + 0.0012,
      longitude: baseLng - 0.0015,
      altitude: 1045.2,
      accuracy: 3.5,
      userId: agronomist.id,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
    },
    {
      id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
      pestName: 'Helicoverpa armigera',
      quantity: 8,
      crop: 'Soja Intacta',
      plot: 'Talhão 02 - Leste',
      growthStage: 'R2 - Floração Plena',
      notes: 'Lagartas atacando vagens e botões florais',
      latitude: baseLat - 0.0025,
      longitude: baseLng + 0.0031,
      altitude: 1052.0,
      accuracy: 4.1,
      userId: operator.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
    },
    {
      id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      pestName: 'Euschistus heros (Percevejo-marrom)',
      quantity: 26,
      crop: 'Soja Intacta',
      plot: 'Talhão 03 - Bordadura',
      growthStage: 'R3 - Início formação vagens',
      notes: 'Alta população na bordadura próxima à mata. Nível de controle atingido!',
      latitude: baseLat + 0.0041,
      longitude: baseLng + 0.0022,
      altitude: 1060.8,
      accuracy: 2.8,
      userId: agronomist.id,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 dia atrás
    },
    {
      id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
      pestName: 'Bicudo (Anthonomus grandis)',
      quantity: 12,
      crop: 'Algodão Safra',
      plot: 'Talhão 04 - Algodão',
      growthStage: 'B4 - Primeiro botão floral',
      notes: 'Botões florais com perfurações de alimentação e oviposição. Monitoramento prioritário de bicudo.',
      latitude: baseLat - 0.0018,
      longitude: baseLng - 0.0039,
      altitude: 1038.5,
      accuracy: 3.0,
      userId: operator.id,
      createdAt: new Date(),
    },
    {
      id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
      pestName: 'Anticarsia gemmatalis (Lagarta-da-soja)',
      quantity: 5,
      crop: 'Soja Convencional',
      plot: 'Talhão 05 - Sul',
      growthStage: 'V6 - Desenvolvimento vegetativo',
      notes: 'Desfolha leve abaixo de 5%',
      latitude: baseLat + 0.0005,
      longitude: baseLng + 0.0008,
      altitude: 1048.0,
      accuracy: 3.9,
      userId: operator.id,
      createdAt: new Date(),
    },
  ];

  for (const record of sampleRecords) {
    await prisma.pestRecord.create({
      data: record,
    });
  }

  console.log(`✅ ${sampleRecords.length} registros de pragas georreferenciados criados.`);
  console.log('🌾 Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante execução do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
