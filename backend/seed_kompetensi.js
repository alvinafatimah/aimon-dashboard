const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres.xzgeoyqdeqnwvxgjvmsb:Researchcurrencysecurityprinting@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  let user = await prisma.user.findUnique({ where: { username: 'semua_area' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: 'semua_area',
        name: 'Semua Area',
        password_hash: 'password123',
        role: 'Kepala Seksi'
      }
    });
  }

  const pName = 'Peningkatan Pengetahuan dan Kompetensi SDM RDCSprinsol (Min. 5 Kegiatan)';
  await prisma.project.deleteMany({ where: { name: pName } });

  const project = await prisma.project.create({
    data: {
      code: 'Peningkatan Kompetensi',
      name: pName,
      seksi: 'Security Printing dan Material & Security Feature',
      kategori: 'Non-OMTI',
      pic_id: user.id, // Assigned to Alvina Fatimah since "Semua Area" is not a user
      start_date: new Date('2026-01-01T00:00:00Z'),
      end_date: new Date('2026-12-31T00:00:00Z'),
      status: 'open'
    }
  });

  const phasesData = [
    {
      name: 'Studi Pendahuluan', bobot: 10, status: 'open',
      acts: [ { name: "Identifikasi Kebutuhan Pelatihan", n: 0, s: 'open' } ]
    },
    {
      name: 'Scheduling', bobot: 10, status: 'open',
      acts: [ { name: "Penjadwalan 5 Kegiatan Utama", n: 0, s: 'open' } ]
    },
    {
      name: 'Pelaksanaan Kegiatan (1-3)', bobot: 40, status: 'open',
      acts: [ { name: "Pelaksanaan Pelatihan Batch 1-3", n: 0, s: 'open' } ]
    },
    {
      name: 'Pelaksanaan Kegiatan (4-5)', bobot: 30, status: 'open',
      acts: [ { name: "Pelaksanaan Pelatihan Batch 4-5", n: 0, s: 'open' } ]
    },
    {
      name: 'Evaluasi & Diseminasi', bobot: 10, status: 'open',
      acts: [ { name: "Evaluasi Hasil Peningkatan Kompetensi", n: 0, s: 'open' } ]
    }
  ];

  for (let i = 0; i < phasesData.length; i++) {
    const ph = await prisma.phase.create({
      data: {
        project_id: project.id,
        code: `P${i+1}`,
        name: phasesData[i].name,
        bobot: phasesData[i].bobot,
        status: phasesData[i].status,
        order_index: i
      }
    });

    for(let j=0; j<phasesData[i].acts.length; j++) {
      const a = phasesData[i].acts[j];
      await prisma.activity.create({
        data: {
          phase_id: ph.id,
          code: `A${i+1}.${j+1}`,
          name: a.name,
          target: 100,
          nilai_aktual: a.n,
          status: a.s,
          start_date: new Date('2026-01-01T00:00:00Z'),
          end_date: new Date('2026-12-31T00:00:00Z'),
          pic_id: user.id
        }
      });
    }
  }

  console.log("Peningkatan Kompetensi project seeded successfully! Should equal 0% total progress.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
