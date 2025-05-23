const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const githubService = require('../services/githubService')
const config = require('../config/settings')

const router = express.Router()

// 确保目录存在（递归创建）
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// 初始化目录（使用绝对路径）
const uploadsDir = path.resolve(__dirname, config.server.uploadDir)
const dataDir = path.resolve(__dirname, config.server.dataDir)
ensureDir(uploadsDir)
ensureDir(dataDir)

// 验证目录可写
try {
  fs.accessSync(uploadsDir, fs.constants ? fs.constants.W_OK : 2)
  fs.accessSync(dataDir, fs.constants ? fs.constants.W_OK : 2)
} catch (err) {
  console.error('Directory access error:', err)
  throw new Error('Directory not writable')
}

// 文件存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir(uploadsDir) // 每次上传前确保目录存在
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  }
})

// 提交反馈
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, content } = req.body
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' })
    }

    // 构造反馈数据
    const feedback = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: req.body.type || 'general',
      title: title,
      content: content,
      page: req.body.page || '',
      selectedText: req.body.selectedText || '',
      imageUrl: `/uploads/${req.file.filename}`,
      status: 'new'
    }

    // 保存到JSON文件
    const feedbackPath = path.join(dataDir, `feedback-${feedback.id}.json`)
    fs.writeFileSync(feedbackPath, JSON.stringify(feedback, null, 2))

    // 提交到GitHub
    if (config.github.repoOwner && config.github.repoName && config.github.authToken) {
      try {
        console.log('Attempting to create GitHub issue for feedback:', feedback.id)
        const issue = await githubService.createIssue(feedback)
        feedback.status = 'synced'
        feedback.githubIssueUrl = issue.html_url
        feedback.githubIssueNumber = issue.number
        fs.writeFileSync(feedbackPath, JSON.stringify(feedback, null, 2))
        console.log('Successfully synced feedback to GitHub:', {
          feedbackId: feedback.id, 
          issueUrl: issue.html_url
        })
      } catch (err) {
        console.error('Failed to sync feedback to GitHub:', {
          feedbackId: feedback.id,
          error: err.message
        })
        feedback.status = 'sync_failed'
        fs.writeFileSync(feedbackPath, JSON.stringify(feedback, null, 2))
      }
    }

    res.json({
      success: true,
      data: feedback
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// 获取反馈列表
router.get('/', (req, res) => {
  try {
    const files = fs.readdirSync(dataDir)
    const feedbacks = files.map(file => {
      const content = fs.readFileSync(path.join(dataDir, file), 'utf8')
      return JSON.parse(content)
    })
    res.json({
      success: true,
      data: feedbacks
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
