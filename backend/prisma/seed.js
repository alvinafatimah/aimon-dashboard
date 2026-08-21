require('dotenv').config();
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/aimon_db?schema=public" })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Clear existing data
  await prisma.activityLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.chatMessage.deleteMany()
  await prisma.approvalDocument.deleteMany()
  await prisma.approval.deleteMany()
  await prisma.activityDocument.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.phase.deleteMany()
  await prisma.projectCurve.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()

  // Hash passwords
  const usersData = [
    { name: 'Titi Andayani', username: 'titi_andayani', password: 'titi6475', role: 'Kepala Divisi', seksi: null },
    { name: 'Dede Supriyadi', username: 'dede_supriyadi', password: 'dede6287', role: 'Kepala Departemen', seksi: null },
    { name: 'Neneng Selvia M.', username: 'neneng_selvia', password: 'neneng6205', role: 'Kepala Seksi', seksi: 'Semua Area' },
    { name: 'Deni Suherman', username: 'deni_suherman', password: 'deni6546', role: 'Kepala Seksi', seksi: 'Semua Area' },
    { name: 'Ahlan Safena Mahmudin', username: 'ahlan_safena', password: 'ahlan7523', role: 'Kepala Unit', seksi: 'Security Printing' },
    { name: 'Guruh Mehra Mulyana', username: 'guruh_mehra', password: 'guruh7613', role: 'Kepala Seksi', seksi: 'Semua Area' },
    { name: 'Dhimas Permana', username: 'dhimas_permana', password: 'dhimas7757', role: 'Kepala Unit', seksi: 'Security Printing' },
    { name: 'Rachmada Wishnu Putra Adinova', username: 'rachmada_adinova', password: 'novap212', role: 'Researcher', seksi: 'Security Printing' },
    { name: 'Al Vina Nur Fatimah', username: 'alvina_fatimah', password: 'alvinap415', role: 'Researcher', seksi: 'Security Printing' },
    { name: 'Admin Sistem', username: 'admin', password: 'admin123', role: 'Admin', seksi: null }
  ];

  const createdUsers = [];
  for (const u of usersData) {
    createdUsers.push(await prisma.user.create({
      data: {
        username: u.username,
        name: u.name,
        password_hash: await bcrypt.hash(u.password, 10),
        role: u.role,
        seksi: u.seksi
      }
    }));
  }

  // Assign specific users for dummy project seeding
  const u2 = createdUsers.find(u => u.username === 'ahlan_safena');
  const u3 = createdUsers.find(u => u.username === 'neneng_selvia');

  console.log('Real users created')

  // 2. Create Project
  const p1 = await prisma.project.create({
    data: {
      code: 'PRJ-2026-001',
      name: 'Pengembangan Fitur Dashboard OMTI',
      seksi: 'Material',
      kategori: 'OMTI',
      pic_id: u2.id,
      start_date: new Date('2026-01-01'),
      end_date: new Date('2026-12-31'),
      status: 'approved'
    }
  })

  const p2 = await prisma.project.create({
    data: {
      code: 'PRJ-2026-002',
      name: 'Implementasi Modul AI',
      seksi: 'Security Printing',
      kategori: 'Non-OMTI',
      pic_id: u3.id,
      start_date: new Date('2026-03-01'),
      end_date: new Date('2026-09-30'),
      status: 'approved'
    }
  })

  console.log('Projects created')

  // 3. Create Phases for Project 1
  const phasesData = [
    { code: 'PH1', name: 'Data Collecting & Initiation', bobot: 5.0, order_index: 1 },
    { code: 'PH2', name: 'Current Flow Process Mapping', bobot: 5.0, order_index: 2 },
    { code: 'PH3', name: 'Business Process Improvement', bobot: 15.0, order_index: 3 },
    { code: 'PH4', name: 'System Design & Prototype', bobot: 20.0, order_index: 4 },
    { code: 'PH5', name: 'Development & Testing', bobot: 40.0, order_index: 5 },
    { code: 'PH6', name: 'Deployment & Training', bobot: 15.0, order_index: 6 }
  ]

  const phases = []
  for (const ph of phasesData) {
    const phase = await prisma.phase.create({
      data: {
        project_id: p1.id,
        code: ph.code,
        name: ph.name,
        bobot: ph.bobot,
        order_index: ph.order_index
      }
    })
    phases.push(phase)
  }

  console.log('Phases created')

  // 4. Create Activities for Phase 1
  const act1 = await prisma.activity.create({
    data: {
      phase_id: phases[0].id,
      pic_id: u2.id,
      code: 'ACT-001',
      name: 'Mengumpulkan dokumen Requirement',
      target: 100,
      nilai_aktual: 100,
      status: 'done',
      start_date: new Date('2026-01-01'),
      end_date: new Date('2026-01-15')
    }
  })

  const act2 = await prisma.activity.create({
    data: {
      phase_id: phases[0].id,
      pic_id: u2.id,
      code: 'ACT-002',
      name: 'Kick-off Meeting',
      target: 100,
      nilai_aktual: 50,
      status: 'progress',
      start_date: new Date('2026-01-16'),
      end_date: new Date('2026-01-31')
    }
  })

  console.log('Activities created')

  // 5. Create Curves (Dummy)
  const curveData = []
  for (let i = 1; i <= 12; i++) {
    curveData.push({ project_id: p1.id, curve_type: 'plan', period_type: 'monthly', period_index: i, value: i * 8.33 })
    curveData.push({ project_id: p1.id, curve_type: 'actual', period_type: 'monthly', period_index: i, value: i <= 8 ? i * 7.5 : null })
  }
  
  await prisma.projectCurve.createMany({ data: curveData })

  console.log('Curves created')
  console.log('Seed completed successfully')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
