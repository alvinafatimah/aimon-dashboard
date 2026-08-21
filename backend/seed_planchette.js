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

  const pName = 'Riset dan Pengembangan Prototype Mesin untuk Membuat Security Features pada Kertas Sekuriti (Planchette)';
  await prisma.project.deleteMany({ where: { name: pName } });

  const project = await prisma.project.create({
    data: {
      code: 'Planchette',
      name: pName,
      seksi: 'Material & Security Feature',
      kategori: 'Non-OMTI',
      pic_id: user.id,
      start_date: new Date('2026-07-01T00:00:00Z'),
      end_date: new Date('2026-12-30T00:00:00Z'),
      status: 'approved'
    }
  });

  const getStatus = (val) => val === 100 ? 'completed' : (val === 0 ? 'open' : 'progress');

  const phasesData = [
    {
      name: 'Studi Pendahuluan', bobot: 10, status: 'progress',
      acts: [
        { name: "Penyusunan dan pembahasan tindak lanjut hasil riset tahun 2025", n: 80, sd: '2026-07-01', ed: '2026-07-06' },
        { name: "Perumusan tujuan dan ruang lingkup riset", n: 70, sd: '2026-07-01', ed: '2026-07-07' },
        { name: "Studi literatur dan benchmarking", n: 55, sd: '2026-07-01', ed: '2026-07-15' },
        { name: "Pembuatan Form Studi Pendahuluan", n: 0, sd: '2026-07-01', ed: '2026-07-17' }
      ]
    },
    {
      name: 'Scheduling', bobot: 5, status: 'progress',
      acts: [
        { name: "Penyusunan metodologi penelitian", n: 100, sd: '2026-07-01', ed: '2026-07-17' },
        { name: "Penyusunan timeline pekerjaan", n: 50, sd: '2026-07-01', ed: '2026-07-06' }
      ]
    },
    {
      name: 'Studi Lanjutan', bobot: 30, status: 'progress',
      acts: [
        { name: "Koordinasi dengan manufaktur mesin untuk profile punching mashine", n: 50, sd: '2026-07-01', ed: '2026-08-03' },
        { name: "Koordinasi dengan universitas terhadap kebutuhan mesin untuk profile punching", n: 100, sd: '2026-07-01', ed: '2026-08-03' },
        { name: "Perancangan konsep permesinan", n: 40, sd: '2026-07-01', ed: '2026-07-31' },
        { name: "Proses Pengadaan Mesin", n: 50, sd: '2026-07-25', ed: '2026-10-31' },
        { name: "Rancang Bangun Permesinan", n: 100, sd: '2026-07-25', ed: '2026-10-30' },
        { name: "Evaluasi Fungsi Mesin untuk kesiapan Uji Coba Lapangan", n: 40, sd: '2026-10-01', ed: '2026-10-30' },
        { name: "Pembuatan Form Studi Lanjutan", n: 60, sd: '2026-10-01', ed: '2026-11-02' }
      ]
    },
    {
      name: 'Uji Lapangan Awal', bobot: 25, status: 'progress',
      acts: [
        { name: "Menyiapkan sampel kertas dan tinta yang akan digunakan", n: 40, sd: '2026-07-10', ed: '2026-07-24' },
        { name: "Desain cetakan planchette", n: 50, sd: '2026-07-24', ed: '2026-08-14' },
        { name: "Cetak desain planchette pada kertas", n: 60, sd: '2026-08-10', ed: '2026-08-28' },
        { name: "proses pembuatan planchette", n: 80, sd: '2026-11-02', ed: '2026-11-10' },
        { name: "evaluasi hasil pembuatan planchette", n: 100, sd: '2026-11-10', ed: '2026-11-13' },
        { name: "uji coba implementasi pada kertas disc (laboratorium)", n: 30, sd: '2026-11-12', ed: '2026-11-20' },
        { name: "evaluasi hasil implementasi planchette", n: 20, sd: '2026-11-23', ed: '2026-11-25' },
        { name: "Pembuatan Form Uji Lapangan Awal", n: 100, sd: '2026-11-01', ed: '2026-11-25' }
      ]
    },
    {
      name: 'Uji Lapangan Lanjutan', bobot: 20, status: 'progress',
      acts: [
        { name: "proses pembuatan planchette", n: 50, sd: '2026-08-18', ed: '2026-08-28' },
        { name: "Penjadwalan uji coba implementasi planchette pada mesin produksi kertas", n: 40, sd: '2026-11-01', ed: '2026-11-25' },
        { name: "Uji coba implementasi planchette pada mesin produksi kertas", n: 60, sd: '2026-11-26', ed: '2026-12-10' },
        { name: "Evaluasi hasil implementasi pada mesin produksi kertas", n: 80, sd: '2026-12-10', ed: '2026-12-14' },
        { name: "Desain Dummy Produk yang menggunakan planchette", n: 90, sd: '2026-07-24', ed: '2026-08-14' },
        { name: "Proses cetak dan Pembuatan Dummy Produk", n: 80, sd: '2026-12-14', ed: '2026-12-25' },
        { name: "Pembuatan Form Uji Lapangan Lanjutan", n: 100, sd: '2026-12-01', ed: '2026-12-15' }
      ]
    },
    {
      name: 'Diseminasi', bobot: 10, status: 'open',
      acts: [
        { name: "Pembuatan Laporan Hasil Riset", n: 0, sd: '2026-12-07', ed: '2026-12-17' },
        { name: "Sirkulir approval Laporan Hasil Riset", n: 0, sd: '2026-12-15', ed: '2026-12-25' },
        { name: "Penyampaian Laporan Hasil Riset", n: 0, sd: '2026-12-25', ed: '2026-12-30' }
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

  console.log("Planchette project seeded successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
