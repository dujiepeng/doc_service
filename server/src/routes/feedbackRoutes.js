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
  console.log('Received feedback submission:', {
    body: req.body,
    file: req.file ? {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : null
  })
  try {
    const { title, content } = req.body
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        error: 'No image uploaded'
      })
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
        imageUrl: path.join(uploadsDir, req.file.filename),
        status: 'new'
      }

    // 保存到JSON文件
    const feedbackPath = path.join(dataDir, `feedback-${feedback.id}.json`)
    fs.writeFileSync(feedbackPath, JSON.stringify(feedback, null, 2))

    // 异步提交到GitHub
    if (config.github.repoOwner && config.github.repoName && config.github.authToken) {
      githubService.createIssue(feedback)
        .then(issue => {
          feedback.status = 'synced'
          feedback.githubIssueUrl = issue.html_url
          feedback.githubIssueNumber = issue.number
          fs.writeFileSync(feedbackPath, JSON.stringify(feedback, null, 2))
          console.log('Successfully synced feedback to GitHub:', {
            feedbackId: feedback.id, 
            issueUrl: issue.html_url
          })
        })
        .catch(err => {
          console.error('Failed to sync feedback to GitHub:', {
            feedbackId: feedback.id,
            error: err.message
          })
          feedback.status = 'sync_failed'
          fs.writeFileSync(feedbackPath, JSON.stringify(feedback, null, 2))
        })
    }

    // 立即返回成功响应
    return res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: err.message 
    })
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
    return res.status(200).json({
      success: true,
      message: 'Feedback list retrieved',
      data: feedbacks
    })
  } catch (err) {
    console.error('Failed to get feedback list:', err)
    return res.status(500).json({ 
      success: false,
      message: 'Failed to get feedback list',
      error: err.message
    })
  }
})

module.exports = router
