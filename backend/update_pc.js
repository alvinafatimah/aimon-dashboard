const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres.xzgeoyqdeqnwvxgjvmsb:Researchcurrencysecurityprinting@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const project = await prisma.project.findFirst({ 
    where: { name: 'Uji Coba Sistem Proses & Prototype Polycarbonate Datapage' } 
  });

  if (!project) throw new Error("Project not found!");

  await prisma.project.update({
    where: { id: project.id },
    data: {
      code: 'Polycarbonate Datapage',
      seksi: 'Security Printing'
    }
  });

  console.log("Project updated successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
