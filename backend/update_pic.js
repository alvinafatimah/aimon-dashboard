const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  let dhimas = await prisma.user.findFirst({ where: { name: { contains: 'Dhimas' } } });
  if (!dhimas) {
    dhimas = await prisma.user.create({
      data: { name: 'Dhimas Permana', username: 'dhimas', password: 'password', role: 'Researcher', seksi: 'Security Printing' }
    });
  }

  const project = await prisma.project.findFirst({ where: { code: 'SNI' } });
  if (project) {
    await prisma.project.update({
      where: { id: project.id },
      data: { pic_id: dhimas.id }
    });
    // also update activities if they have pic_id
    await prisma.activity.updateMany({
      where: { phase: { project_id: project.id } },
      data: { pic_id: dhimas.id }
    });
    console.log("PIC SNI project successfully changed to Dhimas Permana");
  } else {
    console.log("SNI project not found");
  }
  process.exit(0);
}

main().catch(console.error);
