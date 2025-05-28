const axios = require('axios')
const config = require('../config/settings')
const path = require('path')
const fs = require('fs')

/**
 * GitHub API Endpoints Used (curl examples):
 * 
 * 1. Check branch exists:
 *    curl -H "Authorization: token {token}" \
 *         -H "Accept: application/vnd.github.v3+json" \
 *         https://api.github.com/repos/{owner}/{repo}/git/refs/heads/{branch}
 * 
 * 2. Create branch:
 *    curl -X POST -H "Authorization: token {token}" \
 *         -H "Accept: application/vnd.github.v3+json" \
 *         -d '{"ref":"refs/heads/{branchName}","sha":"{baseCommitSHA}"}' \
 *         https://api.github.com/repos/{owner}/{repo}/git/refs
 * 
 * 3. Upload file:
 *    curl -X PUT -H "Authorization: token {token}" \
 *         -H "Accept: application/vnd.github.v3+json" \
 *         -d '{"message":"{commitMessage}","content":"{base64Content}","branch":"{targetBranch}"}' \
 *         https://api.github.com/repos/{owner}/{repo}/contents/{path}
 * 
 * 4. List PRs:
 *    curl -H "Authorization: token {token}" \
 *         -H "Accept: application/vnd.github.v3+json" \
 *         "https://api.github.com/repos/{owner}/{repo}/pulls?state={state}&head={headBranch}"
 * 
 * 5. Create PR:
 *    curl -X POST -H "Authorization: token {token}" \
 *         -H "Accept: application/vnd.github.v3+json" \
 *         -d '{"title":"{title}","head":"{headBranch}","base":"{baseBranch}","body":"{description}"}' \
 *         https://api.github.com/repos/{owner}/{repo}/pulls
 * 
 * 6. Create issue:
 *    curl -X POST -H "Authorization: token {token}" \
 *         -H "Accept: application/vnd.github.v3+json" \
 *         -d '{"title":"{title}","body":"{description}","labels":["label1","label2"]}' \
 *         https://api.github.com/repos/{owner}/{repo}/issues
 */
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
      // labels 统一为字符串数组，去除空项
      let labels = feedback.title
      if (!Array.isArray(labels)) {
        labels = [labels]
      }
      labels = labels.map(l => l && typeof l === 'string' ? l : String(l)).filter(Boolean)
      const issueData = {
        title: '[用户反馈]',
        body: await this.buildIssueBody(feedback),
        labels: labels
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
      const fileName = path.basename(imagePath)
      const imageData = fs.readFileSync(imagePath)
      const base64Image = imageData.toString('base64')
      const branchName = 'feedback-images'

      console.log(`Starting image upload process for: ${fileName}`)

      // 1. 检查分支是否存在，不存在则创建
      try {
        await axios.get(`${this.baseURL}/git/refs/heads/${branchName}`, { headers: this.headers })
      } catch (error) {
        if (error.response?.status === 404) {
          const mainBranch = await axios.get(`${this.baseURL}/git/refs/heads/main`, { headers: this.headers })
          await axios.post(`${this.baseURL}/git/refs`, {
            ref: `refs/heads/${branchName}`,
            sha: mainBranch.data.object.sha
          }, { headers: this.headers })
          console.log(`Created branch ${branchName} successfully`)
        } else {
          throw error
        }
      }

      // 2. 上传图片到固定分支
      console.log(`Uploading image to branch: ${branchName}`)
      const uploadRes = await axios.put(`${this.baseURL}/contents/${this.imagesDir}/${fileName}`, {
        message: `Add feedback image ${fileName}`,
        content: base64Image,
        branch: branchName
      }, { headers: this.headers })
      console.log(`Image uploaded successfully: ${uploadRes.data.content.html_url}`)

      // 3. 检查PR是否存在，不存在则创建
      let prUrl = ''
      const prs = await axios.get(`${this.baseURL}/pulls?state=open&head=${config.github.repoOwner}:${branchName}`, { headers: this.headers })
      if (prs.data.length === 0) {
        const pr = await axios.post(`${this.baseURL}/pulls`, {
          title: 'Feedback Images',
          head: branchName,
          base: 'main',
          body: 'Automatically created for feedback system'
        }, { headers: this.headers })
        prUrl = pr.data.html_url
        console.log(`PR created successfully: ${prUrl}`)
      } else {
        prUrl = prs.data[0].html_url
        console.log(`Using existing PR: ${prUrl}`)
      }

      const imageUrl = `https://raw.githubusercontent.com/${config.github.repoOwner}/${config.github.repoName}/${branchName}/${this.imagesDir}/${fileName}`
      console.log(`Generated image URL: ${imageUrl}`)

      return {
        prUrl: prUrl,
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
      if (!imagePath || !fs.existsSync(imagePath)) {
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
      return [
        `**反馈内容：**`,
        feedback.content || '(无)',
        '',
        `**联系方式：**`,
        feedback.contact || '(无)',
        '',
        `**文档链接：**`,
        feedback.page || '(无)',
        '',
        `**截图：**`,
        `![Screenshot](${imageUrl})`
      ].join('\n')
    } catch (err) {
      return [
        `**反馈内容：**`,
        feedback.content || '(无)',
        '',
        `**联系方式：**`,
        feedback.contact || '(无)',
        '',
        `**文档链接：**`,
        feedback.page || '(无)',
        '',
        `**截图：**`,
        `图片上传失败或者用户未提供图片`
      ].join('\n')
    }
  }
}

module.exports = new GithubService()
