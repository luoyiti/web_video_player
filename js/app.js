/**
 * 应用主入口
 * 负责初始化和启动整个应用
 */

import { StateManager } from "./state.js";
import { UIRenderer } from "./ui.js";
import { EventHandler } from "./events.js";

class MediaManager {
  constructor() {
    this.stateManager = new StateManager();
    this.uiRenderer = new UIRenderer(this.stateManager);
    this.eventHandler = new EventHandler(this.stateManager, this.uiRenderer);
  }

  /**
   * 初始化应用
   */
  init() {
    // 加载本地存储的状态
    this.stateManager.loadFromLocalStorage();
    this.stateManager.syncCurrentSelection();

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
}

// 应用启动
document.addEventListener("DOMContentLoaded", () => {
  const app = new MediaManager();
  app.init();
});
