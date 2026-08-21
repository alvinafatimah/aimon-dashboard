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

  const pName = 'Riset Kemasan Uang Kertas (Uji Remise)';
  await prisma.project.deleteMany({ where: { name: pName } });

  const project = await prisma.project.create({
    data: {
      code: 'Uji Remise',
      name: pName,
      seksi: 'Material & Security Feature',
      kategori: 'OMTI',
      pic_id: user.id,
      start_date: new Date('2026-01-01T00:00:00Z'),
      end_date: new Date('2026-12-31T00:00:00Z'),
      status: 'completed'
    }
  });

  const phasesData = [
    {
      name: 'Studi Pendahuluan', bobot: 10, status: 'completed',
      acts: [ { name: "Pelaksanaan Studi Pendahuluan", n: 100, sd: '2026-01-01', ed: '2026-02-28' } ]
    },
    {
      name: 'Scheduling', bobot: 5, status: 'completed',
      acts: [ { name: "Penyusunan Timeline dan Jadwal", n: 100, sd: '2026-03-01', ed: '2026-03-31' } ]
    },
    {
      name: 'Studi Lanjutan', bobot: 35, status: 'completed',
      acts: [ { name: "Pelaksanaan Studi Lanjutan", n: 100, sd: '2026-04-01', ed: '2026-06-30' } ]
    },
    {
      name: 'Uji Coba Lapangan', bobot: 40, status: 'completed',
      acts: [ { name: "Pelaksanaan Uji Coba Lapangan", n: 100, sd: '2026-07-01', ed: '2026-10-31' } ]
    },
    {
      name: 'Diseminasi', bobot: 10, status: 'completed',
      acts: [
        { name: "Pembuatan Laporan Akhir", n: 100, sd: '2026-11-01', ed: '2026-11-30' },
        { name: "Sirkulir Persetujuan Pimpinan", n: 100, sd: '2026-12-01', ed: '2026-12-15' },
        { name: "Penyampaian Laporan Akhir", n: 100, sd: '2026-12-16', ed: '2026-12-31' }
      ]
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
          status: 'completed',
          start_date: new Date(`${a.sd}T00:00:00Z`),
          end_date: new Date(`${a.ed}T00:00:00Z`),
          pic_id: user.id
        }
      });
    }
  }

  console.log("Uji Remise project seeded successfully! Should equal 100% total progress.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
