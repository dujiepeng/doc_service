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
  }

    async createIssue(feedback) {
      try {
        const issueData = {
          title: feedback.title,
          body: await this.buildIssueBody(feedback),
          labels: config.github.issueLabels
        }

        console.log('Creating GitHub issue with data:', issueData)
        console.log('GitHub API URL:', `${this.baseURL}/issues`)

        const response = await axios.post(`${this.baseURL}/issues`, issueData, {
          headers: this.headers
        })

        console.log('GitHub issue created successfully:', {
          issueUrl: response.data.html_url,
          issueNumber: response.data.number
        })

        return response.data
      } catch (error) {
        console.error('GitHub issue creation failed:', {
          status: error.response?.status,
          message: error.message,
          responseData: error.response?.data
        })
        throw error
      }
  }

  async buildIssueBody(feedback) {
    try {
      // 读取图片文件并转为base64
      const imagePath = path.join(__dirname, '../../', feedback.imageUrl.replace('/uploads/', 'uploads/'))
      const imageData = fs.readFileSync(imagePath)
      const base64Image = imageData.toString('base64')
      const imageType = path.extname(imagePath).slice(1)
      
      return `
**Type:** ${feedback.type}
**Page:** ${feedback.page}
**Content:** 
${feedback.content}

**Selected Text:**
${feedback.selectedText}

![Screenshot](data:image/${imageType};base64,${base64Image})
      `.trim()
    } catch (err) {
      console.error('Failed to embed image:', err)
      // 回退到URL方式
      return `
**Type:** ${feedback.type}
**Page:** ${feedback.page}
**Content:** 
${feedback.content}

**Selected Text:**
${feedback.selectedText}

![Screenshot](${feedback.imageUrl})
      `.trim()
    }
  }
}

module.exports = new GithubService()
