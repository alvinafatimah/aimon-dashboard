const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Mencari user untuk dijadikan PIC...");
  let pic = await prisma.user.findFirst();
  if (!pic) {
    console.log("User tidak ditemukan, membuat user dummy...");
    pic = await prisma.user.create({
      data: { name: 'Dhimas Permana', username: 'dhimas', password: 'password', role: 'Researcher', seksi: 'Security Printing' }
    });
  }

  console.log("Membuat proyek SNI...");
  const project = await prisma.project.create({
    data: {
      code: 'SNI',
      name: 'Kajian Implementasi 100% Banknote Inspection (Sortir Machine)',
      seksi: 'Security Printing',
      kategori: 'OMTI',
      pic_id: pic.id,
      start_date: new Date('2026-02-01'),
      end_date: new Date('2026-10-31'),
      status: 'pending',
      phases: {
        create: [
          {
            code: 'T1', name: 'Data Collecting & Initiation', bobot: 15, order_index: 0, status: 'done',
            activities: {
              create: [
                { code: 'T1.1', name: 'Data Collecting - Volume Produksi Per Denominasi', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-02-01'), end_date: new Date('2026-04-30'), pic_id: pic.id },
                { code: 'T1.2', name: 'Data Collecting - Output Mesin', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-02-01'), end_date: new Date('2026-04-30'), pic_id: pic.id },
                { code: 'T1.3', name: 'Data Collecting - Cycle Time', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-02-01'), end_date: new Date('2026-04-30'), pic_id: pic.id },
                { code: 'T1.4', name: 'Data Collecting - Reject Rate Existing', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-02-01'), end_date: new Date('2026-04-30'), pic_id: pic.id },
                { code: 'T1.5', name: 'Data Collecting - Pain point dan Need', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-02-01'), end_date: new Date('2026-04-30'), pic_id: pic.id },
                { code: 'T1.6', name: 'Diskusi Teknis Awal dengan TI & Stakeholder', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-02-01'), end_date: new Date('2026-04-30'), pic_id: pic.id },
                { code: 'T1.7', name: 'Studi Bisnis Proses', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-02-01'), end_date: new Date('2026-04-30'), pic_id: pic.id },
                { code: 'T1.8', name: 'Data Collecting - Kapasitas Inventory', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-02-01'), end_date: new Date('2026-04-30'), pic_id: pic.id },
                { code: 'T1.9', name: 'Data Collecting - DIMU', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-02-01'), end_date: new Date('2026-04-30'), pic_id: pic.id },
                { code: 'T1.10', name: 'Data Collecting - OEE', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-02-01'), end_date: new Date('2026-04-30'), pic_id: pic.id },
                { code: 'T1.11', name: 'Data Collecting - Data Order dan Data Cetak', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-02-01'), end_date: new Date('2026-04-30'), pic_id: pic.id },
                { code: 'T1.12', name: 'Data Collecting - Product Knowledge', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-02-01'), end_date: new Date('2026-04-30'), pic_id: pic.id },
                { code: 'T1.13', name: 'Pembuatan Rencana Kegiatan Riset', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-02-01'), end_date: new Date('2026-04-30'), pic_id: pic.id }
              ]
            }
          },
          {
            code: 'T2', name: 'Current Flow Process Mapping Analysis', bobot: 15, order_index: 1, status: 'done',
            activities: {
              create: [
                { code: 'T2.1', name: 'Pemetaan Alur All Note Inspection', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-03-15'), end_date: new Date('2026-06-13'), pic_id: pic.id },
                { code: 'T2.2', name: 'Pemetaan Aliran Material dan Informasi', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-03-15'), end_date: new Date('2026-06-13'), pic_id: pic.id },
                { code: 'T2.3', name: 'Pemetaan dan Validasi Process Activity Mapping', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-03-15'), end_date: new Date('2026-06-13'), pic_id: pic.id },
                { code: 'T2.4', name: 'Analisis Process Activity Mapping', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-03-15'), end_date: new Date('2026-06-13'), pic_id: pic.id },
                { code: 'T2.5', name: 'Analisis Value Added VS Non Value Added', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-03-15'), end_date: new Date('2026-06-13'), pic_id: pic.id }
              ]
            }
          },
          {
            code: 'T3', name: 'Result Current Flow Process Overview', bobot: 5, order_index: 2, status: 'on-progress',
            activities: {
              create: [
                { code: 'T3.1', name: 'Analisis Flow Process (As-is)', target: 100, nilai_aktual: 100, status: 'done', start_date: new Date('2026-06-14'), end_date: new Date('2026-07-31'), pic_id: pic.id },
                { code: 'T3.2', name: 'Penyusunan Executive Summary', target: 100, nilai_aktual: 50, status: 'on-progress', start_date: new Date('2026-06-14'), end_date: new Date('2026-07-31'), pic_id: pic.id },
                { code: 'T3.3', name: 'Penyampaian ke Stakeholder', target: 100, nilai_aktual: 50, status: 'on-progress', start_date: new Date('2026-06-14'), end_date: new Date('2026-07-31'), pic_id: pic.id }
              ]
            }
          },
          {
            code: 'T4', name: 'Piloting SNI', bobot: 15, order_index: 3, status: 'on-progress',
            activities: {
              create: [
                { code: 'T4.1', name: 'Piloting SNI', target: 100, nilai_aktual: 50, status: 'on-progress', start_date: new Date('2026-07-15'), end_date: new Date('2026-08-14'), pic_id: pic.id }
              ]
            }
          },
          {
            code: 'T5', name: 'Gap & Impact Analysis', bobot: 10, order_index: 4, status: 'open',
            activities: {
              create: [
                { code: 'T5.1', name: 'Gap Analysis dan Risk Report', target: 100, nilai_aktual: 0, status: 'open', start_date: new Date('2026-07-12'), end_date: new Date('2026-09-12'), pic_id: pic.id },
                { code: 'T5.2', name: 'Simulasi Dampak Implementasi 100% SNI terhadap Mutu', target: 100, nilai_aktual: 0, status: 'open', start_date: new Date('2026-07-12'), end_date: new Date('2026-09-12'), pic_id: pic.id }
              ]
            }
          },
          {
            code: 'T6', name: 'Analisis Kebutuhan & Perubahan Bisnis Proses Baru dengan Mesin SNI', bobot: 10, order_index: 5, status: 'open',
            activities: {
              create: [
                { code: 'T6.1', name: 'Analisis Integrasi Mesin ke Sistem', target: 100, nilai_aktual: 0, status: 'open', start_date: new Date('2026-07-12'), end_date: new Date('2026-09-12'), pic_id: pic.id },
                { code: 'T6.2', name: 'Studi Sistem 100% Banknote Inspection', target: 100, nilai_aktual: 0, status: 'open', start_date: new Date('2026-07-12'), end_date: new Date('2026-09-12'), pic_id: pic.id },
                { code: 'T6.3', name: 'Studi Teknologi 100% Banknote Inspection', target: 100, nilai_aktual: 0, status: 'open', start_date: new Date('2026-07-12'), end_date: new Date('2026-09-12'), pic_id: pic.id },
                { code: 'T6.4', name: 'Analisis Usulan Rencana All Note Inspection', target: 100, nilai_aktual: 0, status: 'open', start_date: new Date('2026-07-12'), end_date: new Date('2026-09-12'), pic_id: pic.id }
              ]
            }
          },
          {
            code: 'T7', name: 'Penyampaian & Validasi Hasil Analisis dan Rekomendasi', bobot: 10, order_index: 6, status: 'open',
            activities: {
              create: [
                { code: 'T7.1', name: 'Penyampaian dan Feedback Hasil Kajian Implementasi All Note Inspection', target: 100, nilai_aktual: 0, status: 'open', start_date: new Date('2026-09-01'), end_date: new Date('2026-09-19'), pic_id: pic.id },
                { code: 'T7.2', name: 'Diskusi Teknis & Evaluasi Bersama', target: 100, nilai_aktual: 0, status: 'open', start_date: new Date('2026-09-01'), end_date: new Date('2026-09-19'), pic_id: pic.id }
              ]
            }
          },
          {
            code: 'T8', name: 'Risk and Control Plan (FMEA, Control Plan)', bobot: 15, order_index: 7, status: 'open',
            activities: {
              create: [
                { code: 'T8.1', name: 'Penyusunan Rencana Mitigasi', target: 100, nilai_aktual: 0, status: 'open', start_date: new Date('2026-09-20'), end_date: new Date('2026-09-30'), pic_id: pic.id },
                { code: 'T8.2', name: 'Penyusunan Control Plan', target: 100, nilai_aktual: 0, status: 'open', start_date: new Date('2026-09-20'), end_date: new Date('2026-09-30'), pic_id: pic.id }
              ]
            }
          },
          {
            code: 'T9', name: 'Penyusunan Dokumen Hasil Riset', bobot: 5, order_index: 8, status: 'open',
            activities: {
              create: [
                { code: 'T9.1', name: 'Pembuatan Dokumen Kajian Implementasi All Note Inspection', target: 100, nilai_aktual: 0, status: 'open', start_date: new Date('2026-10-01'), end_date: new Date('2026-10-31'), pic_id: pic.id }
              ]
            }
          }
        ]
      }
    }
  });

  console.log("✅ Proyek SNI dengan seluruh tahapan & aktivitas berhasil dimasukkan ke database!");
  process.exit(0);
}

main().catch(console.error);
