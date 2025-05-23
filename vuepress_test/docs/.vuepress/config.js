module.exports = {
  title: 'My VuePress Site',
  description: 'A simple markdown website built with VuePress',
  head: [
    ['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1,user-scalable=no' }]
  ],
  markdown: {
    lineNumbers: true
  },
  themeConfig: {
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
