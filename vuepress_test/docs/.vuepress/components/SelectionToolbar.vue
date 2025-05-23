<template>
  <div class="selection-toolbar" v-show="isVisible" :style="toolbarPosition">
    <button class="toolbar-button copy-button" @click="copySelection">复制</button>
    <button class="toolbar-button feedback-button" @click="showFeedbackForm">问题反馈</button>
  </div>
</template>

<script>
export default {
  name: 'SelectionToolbar',
  data() {
    return {
      isVisible: false,
      toolbarPosition: {
        top: '0px',
        left: '0px'
      },
      selectedText: ''
    }
  },
  mounted() {
    document.addEventListener('mouseup', this.handleSelection);
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeDestroy() {
    document.removeEventListener('mouseup', this.handleSelection);
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    handleSelection(event) {
      const selection = window.getSelection();
      this.selectedText = selection.toString().trim();
      
      if (this.selectedText.length > 0) {
        // 获取选择区域的位置
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // 设置工具栏位置在选择区域上方
        this.toolbarPosition = {
          top: `${rect.top - 60 + window.scrollY}px`,
          left: `${rect.left + (rect.width / 2) - 75}px`
        };
        
        this.isVisible = true;
      } else {
        this.isVisible = false;
      }
    },
    handleClickOutside(event) {
      if (!event.target.closest('.selection-toolbar')) {
        // this.isVisible = false;
      }
    },
    copySelection() {
      navigator.clipboard.writeText(this.selectedText)
        .then(() => {
          this.isVisible = false;
          // 可以添加复制成功的提示
        });
    },
    showFeedbackForm() {
      // 使用事件总线而不是 $root
      if (this.$eventBus) {
        this.$eventBus.$emit('show-feedback', {
          selectedText: this.selectedText,
          currentPage: this.$route ? this.$route.path : window.location.pathname
        });
      } else {
        // 回退到原来的方法
        this.$root.$emit('show-feedback', {
          selectedText: this.selectedText,
          currentPage: this.$route ? this.$route.path : window.location.pathname
        });
      }
      this.isVisible = false;
    }
  }
}
</script>

<style scoped>
.selection-toolbar {
  position: absolute;
  z-index: 1000;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 8px;
  display: flex;
  gap: 8px;
}

.toolbar-button {
  background-color: #3eaf7c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.3s;
}

.toolbar-button:hover {
  background-color: #2c8f63;
}

.copy-button {
  background-color: #4a4a4a;
}

.copy-button:hover {
  background-color: #333333;
}
</style>
