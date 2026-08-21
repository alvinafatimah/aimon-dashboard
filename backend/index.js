const path = require('path')
const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
const { createServer } = require('http')
const { Server } = require('socket.io')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const app = express()
app.use(express.static(path.join(__dirname, '..')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
const multer = require('multer')
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
})
const upload = multer({ storage })
const server = createServer(app)
const io = new Server(server, { cors: { origin: '*' } })
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

app.use(cors())
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia'

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

// ----------------------
// AUTH ROUTES
// ----------------------
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body
  try {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return res.status(401).json({ message: 'User not found' })

    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) return res.status(401).json({ message: 'Invalid password' })

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET)
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, username: user.username } })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ----------------------
// UPLOAD ROUTE
// ----------------------
app.post('/api/upload', authenticateToken, upload.array('files'), (req, res) => {
  try {
    const fileUrls = req.files.map(f => ({
      originalName: f.originalname,
      url: `/uploads/${f.filename}`
    }))
    res.json(fileUrls)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ----------------------
// DASHBOARD STATS ROUTE
// ----------------------
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const user = req.user
    let whereClause = {}
    if (['Kepala Seksi', 'Kepala Unit', 'Researcher', 'Staff'].includes(user.role)) {
       whereClause = { pic_id: user.id }
    }
    
    const projects = await prisma.project.findMany({
      where: whereClause,
      include: { phases: { include: { activities: true } } }
    })
    
    let pendingApprovals = 0;
    
    res.json({
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status !== 'completed').length,
      pendingApprovals: pendingApprovals
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ----------------------
// PROJECTS ROUTES
// ----------------------
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        pic: { select: { name: true } },
        phases: {
          include: {
            activities: {
              include: { documents: true }
            }
          }
        },
        curves: true
      }
    })
    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        pic: { select: { name: true } },
        phases: {
          include: {
            activities: {
              include: { documents: true }
            }
          }
        },
        curves: true
      }
    })
    res.json(project)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    if (['Staff', 'Guest', 'Researcher'].includes(req.user.role)) {
       return res.status(403).json({ message: 'Forbidden' })
    }
    
    const { phases, ...rest } = req.body
    let prismaData = { ...rest }
    
    if (phases && phases.length > 0) {
      prismaData.phases = {
        create: phases.map(ph => ({
          code: ph.code, name: ph.name, bobot: ph.bobot, status: ph.status, order_index: ph.order_index,
          activities: {
            create: ph.activities ? ph.activities.map(a => ({
               code: a.code, name: a.name, target: a.target, nilai_aktual: a.nilai_aktual, status: a.status, start_date: new Date(a.start_date), end_date: new Date(a.end_date), order_index: a.order_index, pic_id: a.pic_id || undefined
            })) : []
          }
        }))
      }
    }

    if (prismaData.start_date) prismaData.start_date = new Date(prismaData.start_date);
    if (prismaData.end_date) prismaData.end_date = new Date(prismaData.end_date);

    const project = await prisma.project.create({
      data: prismaData,
      include: { phases: { include: { activities: true } } }
    })
    res.status(201).json(project)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { phases, ...rest } = req.body
    
    await prisma.phase.deleteMany({ where: { project_id: req.params.id } })
    
    let prismaData = { ...rest }
    
    if (phases && phases.length > 0) {
      prismaData.phases = {
        create: phases.map(ph => ({
           code: ph.code, name: ph.name, bobot: ph.bobot, status: ph.status, order_index: ph.order_index,
           activities: {
              create: ph.activities ? ph.activities.map(a => ({
                 code: a.code, name: a.name, target: a.target, nilai_aktual: a.nilai_aktual, status: a.status, start_date: new Date(a.start_date), end_date: new Date(a.end_date), pic_id: a.pic_id || undefined
              })) : []
           }
        }))
      }
    }

    if (prismaData.start_date) prismaData.start_date = new Date(prismaData.start_date);
    if (prismaData.end_date) prismaData.end_date = new Date(prismaData.end_date);

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: prismaData,
      include: { phases: { include: { activities: true } } }
    })
    res.json(project)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    if (!['Admin', 'Kepala Seksi', 'Kepala Departemen'].includes(req.user.role)) {
       return res.status(403).json({ message: 'Forbidden' })
    }
    
    await prisma.project.delete({
      where: { id: req.params.id }
    })
    res.json({ message: 'Project deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ----------------------
// USERS ROUTES
// ----------------------
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, role: true, seksi: true, username: true }
    })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ----------------------
// CHAT ROUTES
// ----------------------
app.get('/api/chat', authenticateToken, async (req, res) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { sender_id: req.user.id },
          { receiver_id: req.user.id }
        ]
      },
      orderBy: { sent_at: 'asc' }
    })
    res.json(messages)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/chat/read', authenticateToken, async (req, res) => {
  try {
    const { partnerId } = req.body
    await prisma.chatMessage.updateMany({
      where: {
        sender_id: partnerId,
        receiver_id: req.user.id,
        is_read: false
      },
      data: { is_read: true }
    })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ----------------------
// APPROVALS ROUTES
// ----------------------
app.get('/api/approvals', authenticateToken, async (req, res) => {
  try {
    const approvals = await prisma.approval.findMany({
      include: {
        submitter: { select: { name: true, role: true } },
        reviewer: { select: { name: true } },
        activity: { include: { phase: { include: { project: true } } } },
        documents: true
      },
      orderBy: { submitted_at: 'desc' }
    })
    res.json(approvals)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/approvals', authenticateToken, async (req, res) => {
  try {
    const { activity_id, new_nilai, note, docs } = req.body
    const activity = await prisma.activity.findUnique({ where: { id: activity_id } })
    if (!activity) return res.status(404).json({ error: 'Activity not found' })

    const approval = await prisma.approval.create({
      data: {
        activity_id,
        submitted_by: req.user.id,
        old_nilai: activity.nilai_aktual,
        new_nilai,
        note,
        status: 'pending',
        documents: {
          create: docs ? docs.map(d => ({ file_name: d.name, file_url: d.url })) : []
        }
      }
    })
    io.emit('approval_update', { type: 'new', approval })
    res.status(201).json(approval)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/approvals/:id/review', authenticateToken, async (req, res) => {
  try {
    const { status, note } = req.body // status: 'approved' or 'rejected'
    const approval = await prisma.approval.findUnique({ where: { id: req.params.id }, include: { activity: true } })
    if (!approval) return res.status(404).json({ error: 'Approval not found' })

    const updated = await prisma.approval.update({
      where: { id: req.params.id },
      data: {
        status,
        note: status === 'rejected' ? note : approval.note, // If rejected, save reject note (optional)
        reviewed_by: req.user.id,
        reviewed_at: new Date()
      }
    })

    if (status === 'approved') {
      let actStatus = 'on-progress'
      if (approval.new_nilai >= 100) actStatus = 'done'
      
      await prisma.activity.update({
        where: { id: approval.activity_id },
        data: { nilai_aktual: approval.new_nilai, status: actStatus }
      })
    }

    io.emit('approval_update', { type: 'review', approval: updated })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ----------------------
// WEBSOCKETS
// ----------------------
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('send_message', async (data) => {
    try {
      const msg = await prisma.chatMessage.create({
        data: {
          sender_id: data.from,
          receiver_id: data.to,
          text: data.text,
          is_read: false
        }
      })
      // Map it back to the frontend expected format
      const clientMsg = {
        id: msg.id,
        from: msg.sender_id,
        to: msg.receiver_id,
        text: msg.text,
        time: msg.sent_at,
        read: msg.is_read,
        clientId: data.clientId
      }
      io.emit('receive_message', clientMsg)
    } catch (e) {
      console.error('Chat error:', e)
    }
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// ----------------------
// START SERVER
// ----------------------
const PORT = process.env.PORT || 3001
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Backend API running on http://localhost:${PORT}`)
  })
}
module.exports = app;
