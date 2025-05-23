const axios = require('axios')
const config = require('../config/settings')
const path = require('path')
const fs = require('fs')

class GithubService {
  constructor() {
    this.baseURL = `https://api.github.com/repos/${config.github.repoOwner}/${config.github.repoName}`
    this.headers = {
      'Authorization': `token ${config.github.authToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
    this.imagesDir = 'feedback-images'
  }

  async createIssue(feedback) {
    try {
      const issueData = {
        title: feedback.title,
        body: await this.buildIssueBody(feedback),
        labels: config.github.issueLabels
      }

      console.log('Creating GitHub issue with data:', issueData)
      const response = await axios.post(`${this.baseURL}/issues`, issueData, {
        headers: this.headers
      })

      console.log('GitHub issue created successfully:', response.data.html_url)
      return response.data
    } catch (error) {
      console.error('GitHub issue creation failed:', error.response?.data || error.message)
      throw error
    }
  }

  async uploadImageAndCreatePR(imagePath) {
    try {
      const branchName = `feedback-image-${Date.now()}`
      const fileName = path.basename(imagePath)
      const imageData = fs.readFileSync(imagePath)
      const base64Image = imageData.toString('base64')

      console.log(`Starting image upload process for: ${fileName}`)
      console.log(`Creating new branch: ${branchName}`)

      // 1. 创建新分支
      const mainBranch = await axios.get(`${this.baseURL}/git/refs/heads/main`, { headers: this.headers })
      console.log(`Got main branch SHA: ${mainBranch.data.object.sha}`)
      
      const branchRes = await axios.post(`${this.baseURL}/git/refs`, {
        ref: `refs/heads/${branchName}`,
        sha: mainBranch.data.object.sha
      }, { headers: this.headers })
      console.log(`Created branch ${branchName} successfully`)

      // 2. 上传图片到新分支
      console.log(`Uploading image to branch: ${branchName}`)
      const uploadRes = await axios.put(`${this.baseURL}/contents/${this.imagesDir}/${fileName}`, {
        message: `Add feedback image ${fileName}`,
        content: base64Image,
        branch: branchName
      }, { headers: this.headers })
      console.log(`Image uploaded successfully: ${uploadRes.data.content.html_url}`)

      // 3. 创建PR
      console.log(`Creating PR for branch: ${branchName}`)
      const pr = await axios.post(`${this.baseURL}/pulls`, {
        title: `Add feedback image ${fileName}`,
        head: branchName,
        base: 'main',
        body: 'Automatically created for feedback system'
      }, { headers: this.headers })
      console.log(`PR created successfully: ${pr.data.html_url}`)

      const imageUrl = `https://raw.githubusercontent.com/${config.github.repoOwner}/${config.github.repoName}/${branchName}/${this.imagesDir}/${fileName}`
      console.log(`Generated image URL: ${imageUrl}`)

      return {
        prUrl: pr.data.html_url,
        imageUrl: imageUrl
      }
    } catch (error) {
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        stack: error.stack
      }
      console.error('Image upload failed with details:', JSON.stringify(errorDetails, null, 2))
      throw error
    }
  }

  async buildIssueBody(feedback) {
    try {
      // 直接使用完整的图片路径
      const imagePath = feedback.imageUrl
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`)
      }
      const { imageUrl } = await this.uploadImageAndCreatePR(imagePath)
      
      // 上传成功后删除本地图片
      try {
        fs.unlinkSync(imagePath)
        console.log(`Deleted local image file: ${imagePath}`)
      } catch (err) {
        console.error(`Failed to delete local image: ${imagePath}`, err)
      }

      return `
**Type:** ${feedback.type}
**Page:** ${feedback.page}
**Content:** 
${feedback.content}

**Selected Text:**
${feedback.selectedText}

![Screenshot](${imageUrl})
      `.trim()
    } catch (err) {
      console.error('Failed to upload image:', err)
      return `
**Type:** ${feedback.type}
**Page:** ${feedback.page}
**Content:** 
${feedback.content}

**Selected Text:**
${feedback.selectedText}

(Image upload failed)
      `.trim()
    }
  }
}

module.exports = new GithubService()
