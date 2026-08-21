const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres.xzgeoyqdeqnwvxgjvmsb:Researchcurrencysecurityprinting@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const dhimas = await prisma.user.findUnique({ where: { username: 'dhimas_permana' } });
  if (!dhimas) throw new Error("User dhimas_permana not found!");

  // Wipe previous project if exists
  await prisma.project.deleteMany({ where: { name: 'Riset Traceability Uang Kertas' } });

  const project = await prisma.project.create({
    data: {
      code: 'Traceability',
      name: 'Riset Traceability Uang Kertas',
      seksi: 'Security Printing',
      kategori: 'OMTI',
      pic_id: dhimas.id,
      start_date: new Date('2026-02-01T00:00:00Z'),
      end_date: new Date('2026-10-30T00:00:00Z'),
      status: 'approved'
    }
  });

  const phasesData = [
    {
      name: 'Data Collecting & Flow Process Assessment', bobot: 15, status: 'completed',
      acts: [
        { name: "Penyusunan Framework Pengumpulan Data", s: "completed", n: 100, sd: '2026-02-01', ed: '2026-03-30' },
        { name: "Identifikasi Stakeholder & Process Owner", s: "completed", n: 100, sd: '2026-02-01', ed: '2026-04-30' },
        { name: "Wawancara dengan Process Owner", s: "completed", n: 100, sd: '2026-02-01', ed: '2026-04-30' },
        { name: "Pengumpulan Dokumen & SOP Existing", s: "completed", n: 100, sd: '2026-02-01', ed: '2026-03-30' },
        { name: "Pengumpulan Data Pendukung Lain", s: "completed", n: 100, sd: '2026-02-01', ed: '2026-03-30' },
        { name: "Observasi Lapangan", s: "completed", n: 100, sd: '2026-02-01', ed: '2026-04-30' },
        { name: "Kompilasi dan Validasi Data Internal", s: "completed", n: 100, sd: '2026-02-01', ed: '2026-04-30' }
      ]
    },
    {
      name: 'Current Process Visualization & Alignment', bobot: 15, status: 'progress',
      acts: [
        { name: "Pemilihan Tools Visualisasi", s: "completed", n: 100, sd: '2026-02-01', ed: '2026-05-30' },
        { name: "Pembuatan Draft Process Map", s: "completed", n: 100, sd: '2026-02-01', ed: '2026-05-30' },
        { name: "Review & Validasi dengan Process Owner", s: "completed", n: 100, sd: '2026-02-01', ed: '2026-05-30' },
        { name: "Finalisasi As-Is Process Map", s: "completed", n: 100, sd: '2026-02-01', ed: '2026-05-30' },
        { name: "Distribusi & Sign-off Dokumen", s: "progress", n: 50, sd: '2026-02-01', ed: '2026-05-30' }
      ]
    },
    {
      name: 'Result Current Flow Process Overview', bobot: 5, status: 'progress',
      acts: [
        { name: "Analisis Flow Process (As-is)", s: "completed", n: 100, sd: '2026-02-01', ed: '2026-05-30' },
        { name: "Penyusunan Executive Summary", s: "progress", n: 50, sd: '2026-03-15', ed: '2026-06-30' },
        { name: "Pembuatan Presentation Deck", s: "progress", n: 50, sd: '2026-03-15', ed: '2026-06-30' },
        { name: "Internal Review Presentasi", s: "completed", n: 100, sd: '2026-03-15', ed: '2026-06-30' },
        { name: "Penyampaian Presentasi ke Stakeholder", s: "completed", n: 100, sd: '2026-03-15', ed: '2026-06-30' },
        { name: "Tindak Lanjut Feedback", s: "completed", n: 100, sd: '2026-03-15', ed: '2026-06-30' }
      ]
    },
    {
      name: 'Infrastructure & Integration Readiness Assessment', bobot: 15, status: 'open',
      acts: [
        { name: "Technology Provider Overview", s: "progress", n: 50, sd: '2026-04-15', ed: '2026-07-30' },
        { name: "Inventarisasi Infrastruktur IT", s: "open", n: 0, sd: '2026-04-15', ed: '2026-07-30' },
        { name: "Penilaian Kapasitas & Performa", s: "open", n: 0, sd: '2026-04-15', ed: '2026-07-30' },
        { name: "Review Arsitektur Sistem", s: "open", n: 0, sd: '2026-04-15', ed: '2026-07-30' },
        { name: "Asesmen Kemampuan Integrasi", s: "open", n: 0, sd: '2026-04-15', ed: '2026-07-30' },
        { name: "Evaluasi Keamanan & Compliance", s: "open", n: 0, sd: '2026-04-15', ed: '2026-07-30' },
        { name: "Penyusunan Readiness Report", s: "open", n: 0, sd: '2026-04-15', ed: '2026-07-30' }
      ]
    },
    {
      name: 'Technology Provider Engagement', bobot: 10, status: 'open',
      acts: [
        { name: "Diskusi teknis terkait alur proses saat ini", s: "completed", n: 100, sd: '2026-06-01', ed: '2026-07-30' },
        { name: "Penyesuaian alur proses terhadap teknologi provider", s: "progress", n: 50, sd: '2026-06-01', ed: '2026-07-30' },
        { name: "Penyusunan Kriteria Seleksi Vendor", s: "open", n: 0, sd: '2026-06-01', ed: '2026-07-30' },
        { name: "Identifikasi & Longlist Vendor", s: "open", n: 0, sd: '2026-06-01', ed: '2026-07-30' },
        { name: "Pengiriman RFI (Request for Information)", s: "open", n: 0, sd: '2026-06-01', ed: '2026-07-30' },
        { name: "Penyusunan Laporan Evaluasi Vendor", s: "open", n: 0, sd: '2026-06-01', ed: '2026-07-30' }
      ]
    },
    {
      name: 'Gap Analysis Report', bobot: 15, status: 'open',
      acts: [
        { name: "Penetapan Target State / Benchmark", s: "open", n: 0, sd: '2026-07-01', ed: '2026-08-15' },
        { name: "Analisis Gap Proses Bisnis", s: "completed", n: 100, sd: '2026-07-01', ed: '2026-08-15' },
        { name: "Analisis Gap Infrastruktur & Teknologi", s: "open", n: 0, sd: '2026-07-01', ed: '2026-08-15' },
        { name: "Analisis Gap SDM & Kompetensi", s: "open", n: 0, sd: '2026-07-01', ed: '2026-08-15' },
        { name: "Prioritisasi Gap", s: "open", n: 0, sd: '2026-07-01', ed: '2026-08-15' },
        { name: "Penyusunan Laporan & Rekomendasi", s: "open", n: 0, sd: '2026-07-01', ed: '2026-08-15' }
      ]
    },
    {
      name: 'Flow Process To Be & Requirement', bobot: 10, status: 'open',
      acts: [
        { name: "Workshop Desain To-Be Process", s: "open", n: 0, sd: '2026-08-01', ed: '2026-08-30' },
        { name: "Pembuatan To-Be Process Map", s: "open", n: 0, sd: '2026-08-01', ed: '2026-08-30' },
        { name: "Validasi To-Be Process", s: "open", n: 0, sd: '2026-08-01', ed: '2026-08-30' },
        { name: "Requirement Gathering", s: "open", n: 0, sd: '2026-08-01', ed: '2026-08-30' },
        { name: "Penyusunan Business Requirement Document (BRD)", s: "open", n: 0, sd: '2026-08-01', ed: '2026-08-30' },
        { name: "Review & Approval BRD", s: "open", n: 0, sd: '2026-08-01', ed: '2026-08-30' }
      ]
    },
    {
      name: 'Kajian Kelayakan Teknologi', bobot: 10, status: 'open',
      acts: [
        { name: "Kajian Kelayakan Teknis", s: "open", n: 0, sd: '2026-09-01', ed: '2026-09-30' },
        { name: "Analisis Cost-Benefit", s: "open", n: 0, sd: '2026-09-01', ed: '2026-09-30' },
        { name: "Kajian Kelayakan Operasional", s: "open", n: 0, sd: '2026-09-01', ed: '2026-09-30' },
        { name: "Kajian Kelayakan Regulasi & Kepatuhan", s: "open", n: 0, sd: '2026-09-01', ed: '2026-09-30' },
        { name: "Benchmarking & Studi Komparatif", s: "open", n: 0, sd: '2026-09-01', ed: '2026-09-30' },
        { name: "Penyusunan Laporan Kajian Kelayakan", s: "open", n: 0, sd: '2026-09-01', ed: '2026-09-30' }
      ]
    },
    {
      name: 'Risk and Control Plan', bobot: 5, status: 'open',
      acts: [
        { name: "Identifikasi Risiko Proses & Implementasi", s: "open", n: 0, sd: '2026-10-01', ed: '2026-10-30' },
        { name: "Workshop FMEA", s: "open", n: 0, sd: '2026-10-01', ed: '2026-10-30' },
        { name: "Penilaian Risk Priority Number (RPN)", s: "open", n: 0, sd: '2026-10-01', ed: '2026-10-30' },
        { name: "Penyusunan Rencana Mitigasi", s: "open", n: 0, sd: '2026-10-01', ed: '2026-10-30' },
        { name: "Penyusunan Control Plan", s: "open", n: 0, sd: '2026-10-01', ed: '2026-10-30' },
        { name: "Review & Approval Dokumen Risk", s: "open", n: 0, sd: '2026-10-01', ed: '2026-10-30' }
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
          status: a.s,
          start_date: new Date(`${a.sd}T00:00:00Z`),
          end_date: new Date(`${a.ed}T00:00:00Z`),
          pic_id: dhimas.id
        }
      });
    }
  }

  console.log("Traceability project seeded successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
