/**
 * 主题管理器
 * 负责处理夜间模式切换与持久化
 */
export class ThemeManager {
  constructor() {
    this.toggleBtn = document.getElementById('themeToggle');
    this.body = document.body;
    this.STORAGE_KEY = 'mediaManagerTheme';
  }

  init() {
    this.loadTheme();
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggleTheme());
    }
  }

  loadTheme() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
      this.enableDarkMode();
    } else {
      this.disableDarkMode();
    }
  }

  toggleTheme() {
    if (this.body.classList.contains('dark-mode')) {
      this.disableDarkMode();
      localStorage.setItem(this.STORAGE_KEY, 'light');
    } else {
      this.enableDarkMode();
      localStorage.setItem(this.STORAGE_KEY, 'dark');
    }
  }

  enableDarkMode() {
    this.body.classList.add('dark-mode');
    if (this.toggleBtn) {
      const icon = this.toggleBtn.querySelector('.icon');
      if (icon) icon.textContent = '☀️';
      
      // 更新文本节点
      this.updateButtonText('日间模式');
    }
  }

  disableDarkMode() {
    this.body.classList.remove('dark-mode');
    if (this.toggleBtn) {
      const icon = this.toggleBtn.querySelector('.icon');
      if (icon) icon.textContent = '🌙';
      
      // 更新文本节点
      this.updateButtonText('夜间模式');
    }
  }

  updateButtonText(text) {
    // 找到文本节点并更新
    const nodes = this.toggleBtn.childNodes;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].nodeType === Node.TEXT_NODE && nodes[i].textContent.trim() !== '') {
        nodes[i].textContent = ` ${text}`;
        break;
      }
    }
  }
}
