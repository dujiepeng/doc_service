import Vue from 'vue'
import SelectionToolbar from './components/SelectionToolbar.vue'
import FeedbackButton from './components/FeedbackButton.vue'

// 创建全局事件总线
const EventBus = new Vue()

export default ({
  Vue,
  router
}) => {
  // 将事件总线添加到 Vue 原型
  Vue.prototype.$eventBus = EventBus
  
  // 注册组件
  // Vue.component('SelectionToolbar', SelectionToolbar)
  Vue.component('FeedbackButton', FeedbackButton)
  
  // 在每个页面加载后添加组件
  router.afterEach(() => {
    setTimeout(() => {
      // 添加工具栏
      // if (!document.querySelector('.selection-toolbar-container')) {
      //   const toolbarContainer = document.createElement('div')
      //   toolbarContainer.className = 'selection-toolbar-container'
      //   document.body.appendChild(toolbarContainer)
        
      //   new Vue({
      //     render: h => h(SelectionToolbar)
      //   }).$mount(toolbarContainer)
      // }
      
      // 确保反馈按钮也存在
      if (!document.querySelector('.feedback-button-container')) {
        const feedbackContainer = document.createElement('div')
        feedbackContainer.className = 'feedback-button-container'
        document.body.appendChild(feedbackContainer)
        
        new Vue({
          render: h => h(FeedbackButton)
        }).$mount(feedbackContainer)
      }
    }, 500)
  })
}
