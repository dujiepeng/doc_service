const express = require('express')
const cors = require('cors')
const path = require('path')
const config = require('./config/settings')
const feedbackRouter = require('./routes/feedbackRoutes')

const app = express()

// CORS配置
app.use(cors({
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST']
}))

// API路由
app.use('/api/feedback', feedbackRouter)

// 启动服务
const PORT = config.server.port || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`API Docs: http://localhost:${PORT}/api/feedback`)
})
