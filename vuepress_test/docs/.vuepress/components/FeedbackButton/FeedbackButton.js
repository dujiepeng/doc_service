import html2canvas from 'html2canvas'
export default {
  name: 'FeedbackButton',
  data() {
    return {
      showFeedbackForm: false,
      feedbackType: 'bug',
      feedbackTypes: [
        { value: 'bug', label: 'Bug 报告' },
        { value: 'feature', label: '功能建议' },
        { value: 'content', label: '内容问题' },
        { value: 'other', label: '其他' }
      ],
      feedbackContent: '',
      currentPage: '',
      selectedText: '',
      screenshot: '',
      showBigPreview: false,
      bigEditMode: false,
      bigCanvasWidth: 0,
      bigCanvasHeight: 0,
      bigDrawing: false,
      bigLastPoint: null,
      bigEditBackup: ''
    }
  },
  mounted() {
    if (this.$route && this.$route.path) {
      this.currentPage = this.$route.path;
    } else {
      this.currentPage = '';
    }
    if (this.$eventBus) {
      this.$eventBus.$on('show-feedback', this.handleFeedbackEvent);
    }
    this.$root.$on('show-feedback', this.handleFeedbackEvent);
  },
  beforeDestroy() {
    if (this.$eventBus) {
      this.$eventBus.$off('show-feedback', this.handleFeedbackEvent);
    }
    this.$root.$off('show-feedback', this.handleFeedbackEvent);
  },
  methods: {
    async handleOpenFeedback() {
      this.showFeedbackForm = true;
      this.screenshot = '';
      await this.$nextTick();
      const dialog = document.querySelector('.feedback-form');
      if (dialog) dialog.style.display = 'none';

      let selectionRect = null;
      let selectionAnchorNode = null;
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (
          rect.width > 0 && rect.height > 0 &&
          document.body.contains(range.startContainer) &&
          document.body.contains(range.endContainer)
        ) {
          selectionRect = {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height
          };
          selectionAnchorNode = range.startContainer;
        }
      }

      // 使用body全量截图，避免选中内容被弹窗遮挡
      document.body.classList.add('no-feedback-mask');
      // 只截取当前窗口可视区域
      const bodyRect = document.body.getBoundingClientRect();
      const canvas = await html2canvas(document.body, {
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        backgroundColor: null,
        useCORS: true
      });
      document.body.classList.remove('no-feedback-mask');

      if (selectionRect) {
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.strokeStyle = '#1677ff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;

        ctx.strokeRect(
          selectionRect.left,
          selectionRect.top,
          selectionRect.width,
          selectionRect.height
        );
        ctx.restore();
      }

      this.screenshot = canvas.toDataURL('image/png');
      if (dialog) dialog.style.display = '';
    },
    handleFeedbackEvent(data) {
      console.log('Received feedback event with data:', data);
      this.showFeedbackForm = true;
      if (data && data.selectedText) {
        this.selectedText = data.selectedText;
        this.feedbackContent = '';
      }
      this.screenshot = '';
      this.$nextTick(async () => {
        const dialog = document.querySelector('.feedback-form');
        if (dialog) dialog.style.display = 'none';

        let selectionRect = null;
        let selectionAnchorNode = null;
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (
            rect.width > 0 && rect.height > 0 &&
            document.body.contains(range.startContainer) &&
            document.body.contains(range.endContainer)
          ) {
            selectionRect = {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height
            };
            selectionAnchorNode = range.startContainer;
          }
        }

        // 使用body全量截图，避免选中内容被弹窗遮挡
        document.body.classList.add('no-feedback-mask');
        const canvas = await html2canvas(document.body, {
          x: window.scrollX,
          y: window.scrollY,
          width: window.innerWidth,
          height: window.innerHeight,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          backgroundColor: null,
          useCORS: true
        });
        document.body.classList.remove('no-feedback-mask');

        if (selectionRect) {
          const ctx = canvas.getContext('2d');
          ctx.save();
          ctx.strokeStyle = '#1677ff';
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.7;
          ctx.strokeRect(
            selectionRect.left - window.scrollX,
            selectionRect.top - window.scrollY,
            selectionRect.width,
            selectionRect.height
          );
          ctx.restore();
        }

        this.screenshot = canvas.toDataURL('image/png');
        if (dialog) dialog.style.display = '';
      });
    },
    async submitFeedback() {
      try {
        if (!this.screenshot) {
          alert('请先截图');
          return;
        }

        // 转换base64为文件对象
        const blob = await fetch(this.screenshot).then(r => r.blob());
        const file = new File([blob], 'screenshot.png', { type: 'image/png' });

        const formData = new FormData();
        formData.append('image', file);
        formData.append('title', `${this.feedbackType}反馈`);
        formData.append('content', this.feedbackContent);
        formData.append('page', window.location.href);
        formData.append('selectedText', this.selectedText);

        const response = await fetch('http://localhost:3000/api/feedback', {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || '提交失败');
        }

        alert(result.message || '反馈提交成功！');
        this.feedbackType = 'bug';
        this.feedbackContent = '';
        this.selectedText = '';
        this.screenshot = '';
        this.showFeedbackForm = false;
      } catch (error) {
        console.error('提交反馈失败:', error);
        alert(error.message || '提交反馈失败，请稍后再试');
      }
    },
    closeFeedbackForm() {
      this.showFeedbackForm = false;
      this.screenshot = '';
    },
    enterBigEditMode() {
      this.bigEditMode = true;
      this.bigEditBackup = this.screenshot;
      const img = new window.Image();
      img.onload = () => {
        this.bigCanvasWidth = img.width;
        this.bigCanvasHeight = img.height;
        this.$nextTick(() => {
          const canvas = this.$refs.bigEditCanvas;
          if (!canvas) return;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, img.width, img.height);
        });
      };
      img.src = this.screenshot;
    },
    exitBigEditMode(save) {
      if (save) {
        const canvas = this.$refs.bigEditCanvas;
        if (canvas) {
          const img = new window.Image();
          img.onload = () => {
            const mergeCanvas = document.createElement('canvas');
            mergeCanvas.width = img.width;
            mergeCanvas.height = img.height;
            const mergeCtx = mergeCanvas.getContext('2d');
            mergeCtx.drawImage(img, 0, 0, img.width, img.height);
            mergeCtx.drawImage(canvas, 0, 0, img.width, img.height);
            this.screenshot = mergeCanvas.toDataURL('image/png');
            this.bigEditMode = false;
            this.bigEditBackup = '';
            this.showBigPreview = false; 
          };
          img.src = this.bigEditBackup;
          return;
        }
      } else {
        this.screenshot = this.bigEditBackup;
      }
      this.bigEditMode = false;
      this.bigEditBackup = '';
      this.showBigPreview = false; // 关键：退出大图预览模式
    },
    startBigDraw(e) {
      const canvas = this.$refs.bigEditCanvas;
      let clientX, clientY;
      if (e.touches && e.touches.length) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      this.bigDrawing = true;
      const rect = canvas.getBoundingClientRect();
      this.bigLastPoint = {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
      };
    },
    bigDraw(e) {
      if (!this.bigDrawing) return;
      const canvas = this.$refs.bigEditCanvas;
      const ctx = canvas.getContext('2d');
      let clientX, clientY;
      if (e.touches && e.touches.length) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (canvas.width / rect.width);
      const y = (clientY - rect.top) * (canvas.height / rect.height);
      ctx.strokeStyle = '#1677ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.bigLastPoint.x, this.bigLastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      this.bigLastPoint = { x, y };
    },
    endBigDraw() {
      this.bigDrawing = false;
      this.bigLastPoint = null;
    }
  },
  watch: {
    showBigPreview(val) {
      if (!val) {
        this.bigEditMode = false;
        this.bigEditBackup = '';
      }
    }
  }
}
