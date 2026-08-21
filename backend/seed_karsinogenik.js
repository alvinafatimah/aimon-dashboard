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

  const pName = 'Riset Substitusi Material Bahan Pembuatan Roll (Replace Karsinogenik Material)';
  await prisma.project.deleteMany({ where: { name: pName } });

  const project = await prisma.project.create({
    data: {
      code: 'Material Karsinogenik',
      name: pName,
      seksi: 'Material & Security Feature',
      kategori: 'OMTI',
      pic_id: user.id,
      start_date: new Date('2026-07-01T00:00:00Z'),
      end_date: new Date('2026-12-14T00:00:00Z'),
      status: 'approved'
    }
  });

  const getStatus = (val) => val === 100 ? 'completed' : (val === 0 ? 'open' : 'progress');

  const phasesData = [
    {
      name: 'Studi Pendahuluan', bobot: 10, status: 'completed',
      acts: [
        { name: "Identifikasi permasalahan", n: 100, sd: '2026-07-01', ed: '2026-07-01' },
        { name: "Studi literatur dan benchmarking", n: 100, sd: '2026-07-01', ed: '2026-07-06' },
        { name: "Pengumpulan data awal", n: 100, sd: '2026-07-01', ed: '2026-07-06' },
        { name: "Perumusan tujuan dan ruang lingkup riset", n: 100, sd: '2026-07-01', ed: '2026-07-06' },
        { name: "Pembuatan Form Studi Pendahuluan", n: 100, sd: '2026-07-01', ed: '2026-07-10' }
      ]
    },
    {
      name: 'Scheduling', bobot: 5, status: 'completed',
      acts: [
        { name: "pembuatan meodologi riset", n: 100, sd: '2026-07-10', ed: '2026-07-10' },
        { name: "Pembuatan timeline kegiatan", n: 100, sd: '2026-07-10', ed: '2026-07-10' }
      ]
    },
    {
      name: 'Studi Lanjutan', bobot: 30, status: 'progress',
      acts: [
        { name: "Pencarian material alternatif", n: 100, sd: '2026-07-11', ed: '2026-08-03' },
        { name: "Pengadaan material alternatif", n: 100, sd: '2026-07-11', ed: '2026-08-17' },
        { name: "Pengujian Laboratorium pada Sampel", n: 100, sd: '2026-08-01', ed: '2026-08-25' },
        { name: "Pembuatan Formula untuk Uji Coba", n: 40, sd: '2026-08-01', ed: '2026-08-31' },
        { name: "Pembuatan Form Studi Lanjutan", n: 0, sd: '2026-08-01', ed: '2026-08-31' }
      ]
    },
    {
      name: 'Uji Lapangan Awal', bobot: 25, status: 'open',
      acts: [
        { name: "Penjadwalan Uji Coba Lapangan Awal", n: 0, sd: '2026-08-31', ed: '2026-08-31' },
        { name: "Pelaksanaan Uji Coba Lapangan Awal", n: 0, sd: '2026-09-07', ed: '2026-09-25' },
        { name: "Evaluasi Formula dan Hasil Uji Coba Lapangan Awal", n: 0, sd: '2026-09-26', ed: '2026-09-30' },
        { name: "Pembuatan Form Uji Lapangan Awal", n: 0, sd: '2026-09-26', ed: '2026-09-30' }
      ]
    },
    {
      name: 'Uji Lapangan Lanjutan', bobot: 20, status: 'open',
      acts: [
        { name: "Penjadwalan Uji Coba Lapangan Lanjutan", n: 0, sd: '2026-09-30', ed: '2026-09-30' },
        { name: "Pelaksanaan Uji Coba Lapangan Lanjutan", n: 0, sd: '2026-10-05', ed: '2026-10-23' },
        { name: "Evaluasi Formula dan Hasil Uji Coba Lapangan Lanjutan", n: 0, sd: '2026-10-24', ed: '2026-10-30' },
        { name: "Pembuatan Form Uji Lapangan Lanjutan", n: 0, sd: '2026-11-01', ed: '2026-11-06' }
      ]
    },
    {
      name: 'Diseminasi', bobot: 10, status: 'open',
      acts: [
        { name: "Pembuatan Laporan Hasil Riset", n: 0, sd: '2026-11-07', ed: '2026-11-27' },
        { name: "Sirkulir approval Laporan Hasil Riset", n: 0, sd: '2026-11-30', ed: '2026-12-13' },
        { name: "Penyampaian Laporan Hasil Riset", n: 0, sd: '2026-12-14', ed: '2026-12-14' }
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
          status: getStatus(a.n),
          start_date: new Date(`${a.sd}T00:00:00Z`),
          end_date: new Date(`${a.ed}T00:00:00Z`),
          pic_id: user.id
        }
      });
    }
  }

  console.log("Material Karsinogenik project seeded successfully! Should equal 35.4% total progress.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
