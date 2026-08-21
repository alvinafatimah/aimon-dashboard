const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres.xzgeoyqdeqnwvxgjvmsb:Researchcurrencysecurityprinting@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Update all projects to 'progress' EXCEPT 'Uji Remise'
  await prisma.project.updateMany({
    where: {
      code: { not: 'Uji Remise' }
    },
    data: {
      status: 'progress'
    }
  });

  // Rename "Uji Coba End Paper"
  await prisma.project.updateMany({
    where: { code: 'Uji Coba End Paper' },
    data: { name: 'Uji Coba Cetak Kertas End Paper Passport PT Kertas Padalarang' }
  });

  console.log("Projects updated successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
