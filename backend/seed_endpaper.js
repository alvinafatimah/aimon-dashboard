const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres.xzgeoyqdeqnwvxgjvmsb:Researchcurrencysecurityprinting@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({ where: { username: 'guruh_mehra' } });
  if (!user) throw new Error("User guruh_mehra not found!");

  const pName = 'Riset Uji Coba End Paper';
  await prisma.project.deleteMany({ where: { name: pName } });

  const project = await prisma.project.create({
    data: {
      code: 'Uji Coba End Paper',
      name: pName,
      seksi: 'Material & Security Feature',
      kategori: 'Non-OMTI',
      pic_id: user.id,
      start_date: new Date('2026-01-01T00:00:00Z'),
      end_date: new Date('2026-12-31T00:00:00Z'),
      status: 'progress'
    }
  });

  const phasesData = [
    {
      name: 'Studi Pendahuluan', bobot: 10, status: 'completed',
      acts: [ { name: "Pelaksanaan Studi Pendahuluan", n: 100, s: 'completed' } ]
    },
    {
      name: 'Scheduling', bobot: 20, status: 'completed',
      acts: [ { name: "Penyusunan Timeline dan Jadwal", n: 100, s: 'completed' } ]
    },
    {
      name: 'Studi Lanjutan', bobot: 30, status: 'completed',
      acts: [ { name: "Pelaksanaan Studi Lanjutan", n: 100, s: 'completed' } ]
    },
    {
      name: 'Uji Coba Lapangan', bobot: 30, status: 'progress',
      acts: [ 
        { name: "Persiapan Uji Coba", n: 100, s: 'completed' },
        { name: "Pelaksanaan Uji Coba Utama", n: 100, s: 'completed' },
        { name: "Evaluasi dan Analisis Hasil Uji Coba", n: 20, s: 'progress' }
      ]
    },
    {
      name: 'Diseminasi', bobot: 10, status: 'open',
      acts: [ { name: "Pembuatan Laporan Akhir", n: 0, s: 'open' } ]
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

  console.log("Uji Coba End Paper project seeded successfully! Should equal 82% total progress.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
