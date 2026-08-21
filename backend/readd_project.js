const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres.xzgeoyqdeqnwvxgjvmsb:Researchcurrencysecurityprinting@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const titi = await prisma.user.findUnique({ where: { username: 'titi_andayani' } });
  if (!titi) throw new Error("User titi_andayani not found!");

  const project = await prisma.project.create({
    data: {
      code: 'PRJ-100',
      name: 'Kajian Implementasi 100% Banknote Inspection',
      seksi: 'Seksi Riset & Inovasi',
      kategori: 'OMTI',
      pic_id: titi.id,
      start_date: new Date('2026-08-01T00:00:00Z'),
      end_date: new Date('2026-12-31T00:00:00Z'),
      status: 'approved'
    }
  });

  await prisma.phase.create({
    data: {
      project_id: project.id,
      code: 'PHS-100-1',
      name: 'Tahap 1: Persiapan',
      bobot: 20,
      status: 'open',
      order_index: 1
    }
  });

  console.log("Project re-added successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
