/**
 * 应用主入口
 * 负责初始化和启动整个应用
 */

import { StateManager } from "./state.js";
import { UIRenderer } from "./ui.js";
import { EventHandler } from "./events.js";
import { ThemeManager } from "./theme.js";

class MediaManager {
  constructor() {
    this.stateManager = new StateManager();
    this.uiRenderer = new UIRenderer(this.stateManager);
    this.eventHandler = new EventHandler(this.stateManager, this.uiRenderer);
    this.themeManager = new ThemeManager();
  }

  /**
   * 初始化应用
   */
  init() {
    // 初始化主题
    this.themeManager.init();

    // 加载本地存储的状态
    this.stateManager.loadFromLocalStorage();
    this.stateManager.syncCurrentSelection();

    // 检查 URL hash，如果有则切换到对应标签页
    this.handleUrlHash();

    // 订阅状态变化，自动重新渲染
    this.stateManager.subscribe(() => {
      this.uiRenderer.renderAll();
    });

    // 初始渲染
    this.uiRenderer.renderAll();

    // 绑定事件
    this.eventHandler.init();

    // 从后端同步数据
    this.stateManager.bootstrapBackendSync();
  }

  /**
   * 处理 URL hash，支持从其他页面跳转过来时自动定位
   */
  handleUrlHash() {
    const hash = window.location.hash.substring(1); // 去掉 # 号
    if (hash === "video" || hash === "photo") {
      const state = this.stateManager.getState();
      if (state.currentTab !== hash) {
        this.stateManager.setState({ currentTab: hash });
      }
    }
  }
}

// 应用启动
document.addEventListener("DOMContentLoaded", () => {
  const app = new MediaManager();
  app.init();
});
