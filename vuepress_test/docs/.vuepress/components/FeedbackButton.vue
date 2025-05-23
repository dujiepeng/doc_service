<template src="./FeedbackButton/FeedbackButton.html"></template>
<script src="./FeedbackButton/FeedbackButton.js"></script>
<style scoped>
.feedback-button-container {
  position: fixed;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.feedback-button {
  background: #fff;
  color: #1677ff;
  border: 1.5px solid #1677ff;
  border-radius: 24px;
  padding: 10px 28px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(22,119,255,0.08);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.feedback-button:hover {
  background: #1677ff;
  color: #fff;
  border-color: #0958d9;
}


.feedback-form {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  width: 760px; 
  min-width: 600px; 
  height: 640px; 
  min-height: 360px;
  padding: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.feedback-form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px 0 32px;
}
.feedback-form-header h3 {
  margin: 0;
  color: #222;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.feedback-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #bbb;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0 0 0 12px;
}
.feedback-close:hover {
  color: #1677ff;
}
.feedback-form-body {
  padding: 16px 32px 0 32px;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.form-row {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
}
.form-label {
  font-size: 15px;
  font-weight: 500;
  color: #222;
  margin-bottom: 8px;
}
.form-options {
  display: flex;
  gap: 18px;
}
.option-item {
  display: flex;
  align-items: center;
  font-size: 15px;
  color: #444;
  cursor: pointer;
}
.option-item input[type="radio"] {
  margin-right: 6px;
  accent-color: #1677ff;
}
.form-input, .form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  font-size: 15px;
  background: #fafbfc;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.form-input:focus, .form-textarea:focus {
  border-color: #1677ff;
  outline: none;
}
.form-textarea {
  resize: vertical;
  min-height: 60px;
}
.feedback-form-footer {
  display: flex;
  justify-content: flex-end;
  padding: 0 32px 24px 32px;
  background: none;
}
.submit-button {
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 32px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  transition: background 0.3s;
  box-shadow: 0 2px 8px rgba(22,119,255,0.08);
}
.submit-button:hover {
  background: #0958d9;
}
.cancel-button {
  background: #fff;
  color: #1677ff;
  border: 1.5px solid #1677ff;
  border-radius: 8px;
  padding: 10px 32px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  margin-right: 16px;
  transition: background 0.3s, color 0.3s, border-color 0.3s;
}
.cancel-button:hover {
  background: #f0f5ff;
  color: #0958d9;
  border-color: #0958d9;
}
.preview-img-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  max-height: 200px;
  overflow-y: auto;
  padding: 0;
}
.preview-img {
  max-width: 100%;
  width: 100%;
  /* 移除 max-height 限制 */
  display: block;
  margin: 0 auto;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #fafbfc;
  transition: box-shadow 0.2s;
}
.preview-img:hover {
  box-shadow: 0 0 0 2px #1677ff33;
}

/* 大图预览弹窗样式 */
.big-preview-mask {
  position: fixed;
  z-index: 3000;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}
.big-preview-img-box {
  position: relative;
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.big-preview-img {
  max-width: 80vw;
  max-height: 80vh;
  border-radius: 8px;
  background: #fafbfc;
  box-shadow: 0 2px 8px rgba(22,119,255,0.08);
}
.big-preview-close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  font-size: 32px;
  color: #bbb;
  cursor: pointer;
  z-index: 1;
  transition: color 0.2s;
  line-height: 1;
}
.big-preview-close:hover {
  color: #1677ff;
}
@media (max-width: 768px) {
  .feedback-button-container {
    right: 10px;
  }
  .feedback-form {
    width: 96vw;
    min-width: 0;
    height: auto;
    min-height: 0;
  }
  .feedback-form-header, .feedback-form-body, .feedback-form-footer {
    padding-left: 8px;
    padding-right: 8px;
  }
}
</style>
