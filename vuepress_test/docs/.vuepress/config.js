module.exports = {
  lang: 'zh-CN',
  title: '环信 IM 文档',
  description: 'A simple markdown website built with VuePress',
  head: [
    ['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1,user-scalable=no' }]
  ],
  markdown: {
    lineNumbers: true
  },
  themeConfig: {
    logo: '/logo.png',
    repo: 'https://github.com/yourusername/your-repo', // GitHub仓库链接
    head: [['link', { rel: 'icon', href: '/logo.png' }]],
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'About', link: '/about/' },
    ],
    sidebar: {
      '/guide/': [
        '',
        'getting-started',
        'advanced',
      ],
      '/': [
        '',
        'about',
        'contact',
      ]
    }
  }
}
