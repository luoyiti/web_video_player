/**
 * API 客户端模块
 * 负责与后端服务器通信
 */

import { CONFIG } from "./config.js";

class ApiClient {
  constructor() {
    this.reachable = false;
  }

  /**
   * 通用请求方法
   */
  async request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.BACKEND_TIMEOUT);
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}${path}`, {
        ...options,
        headers,
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`请求失败：${response.status}`);
      }
      this.reachable = true;
      return response;
    } catch (err) {
      this.reachable = false;
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * 检查后端是否在线
   */
  isOnline() {
    return this.reachable;
  }

  /**
   * 获取所有视频
   */
  async fetchVideos() {
    const res = await this.request("/api/videos");
    return res.json();
  }

  /**
   * 保存新视频
   */
  async saveVideo(payload) {
    const res = await this.request("/api/videos", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  /**
   * 更新视频标签
   */
  async updateVideoTags(id, tags) {
    await this.request(`/api/videos/${id}/tags`, {
      method: "POST",
      body: JSON.stringify({ tags })
    });
  }

  /**
   * 删除视频
   */
  async deleteVideo(id) {
    await this.request(`/api/videos/${id}`, { method: "DELETE" });
  }

  /**
   * 标记后端为离线状态
   */
  markOffline() {
    this.reachable = false;
  }
}

export const apiClient = new ApiClient();
