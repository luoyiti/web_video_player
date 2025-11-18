/**
 * 状态管理模块
 * 负责应用状态的存储、读取和同步
 */

import { CONFIG, INITIAL_STATE } from "./config.js";
import { apiClient } from "./api.js";
import { setBackendBadge, isBlobUrl } from "./utils.js";

export class StateManager {
  constructor() {
    this.state = { ...INITIAL_STATE };
    this.listeners = [];
  }

  /**
   * 获取当前状态
   */
  getState() {
    return this.state;
  }

  /**
   * 更新状态并通知监听者
   */
  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
    this.saveToLocalStorage();
  }

  /**
   * 添加状态变化监听器
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * 通知所有监听者
   */
  notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * 从 localStorage 加载状态
   */
  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      this.state = { ...this.state, ...parsed };
    } catch (e) {
      console.warn("加载本地状态失败，使用默认数据。", e);
    }
  }

  /**
   * 保存状态到 localStorage
   */
  saveToLocalStorage() {
    try {
      const persistentVideos = this.state.videos.filter((v) => !v.isLocal);
      const dataToSave = {
        currentTab: this.state.currentTab,
        videos: persistentVideos,
        photos: this.state.photos,
        currentVideoId: this.state.currentVideoId,
        currentPhotoId: this.state.currentPhotoId,
        activeTag: this.state.activeTag
      };
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn("保存本地状态失败。", e);
    }
  }

  /**
   * 获取当前选中的视频
   */
  getCurrentVideo() {
    return this.state.videos.find((v) => v.id === this.state.currentVideoId) || null;
  }

  /**
   * 获取当前选中的照片
   */
  getCurrentPhoto() {
    return this.state.photos.find((p) => p.id === this.state.currentPhotoId) || null;
  }

  /**
   * 同步当前选择项（确保选中项有效）
   */
  syncCurrentSelection() {
    if (!this.getCurrentVideo() && this.state.videos.length > 0) {
      this.state.currentVideoId = this.state.videos[0].id;
    }
    if (!this.getCurrentPhoto() && this.state.photos.length > 0) {
      this.state.currentPhotoId = this.state.photos[0].id;
    }
  }

  /**
   * 获取当前标签页的所有标签
   */
  getTagsForCurrentTab() {
    const list = this.state.currentTab === "video" ? this.state.videos : this.state.photos;
    const set = new Set();
    list.forEach((item) => {
      (item.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }

  /**
   * 规范化后端视频数据
   */
  normalizeBackendVideo(raw) {
    const backendId = Number(raw.id);
    const tags = Array.isArray(raw.tags) ? raw.tags.filter(Boolean) : [];
    return {
      id: backendId ? backendId + 1000000 : Date.now(),
      backendId,
      title: raw.title || "未命名视频",
      src: raw.src || "",
      tags,
      isLocal: false,
      fromBackend: true
    };
  }

  /**
   * 合并后端视频数据到本地状态
   */
  mergeBackendVideos(list) {
    if (!Array.isArray(list)) return;
    let changed = false;
    list.forEach((raw) => {
      const video = this.normalizeBackendVideo(raw);
      const existed = this.state.videos.find((v) => v.backendId === video.backendId);
      if (existed) {
        existed.title = video.title;
        existed.src = video.src;
        existed.tags = video.tags;
      } else {
        this.state.videos.push(video);
      }
      changed = true;
    });
    if (changed) {
      this.syncCurrentSelection();
      this.notifyListeners();
      this.saveToLocalStorage();
    }
  }

  /**
   * 同步视频标签到后端
   */
  async syncVideoTagsToBackend(video) {
    if (!video || !video.backendId) return;
    try {
      await apiClient.updateVideoTags(video.backendId, video.tags || []);
      setBackendBadge("已连接后端 · 标签已更新", "ok");
    } catch (err) {
      setBackendBadge("标签未同步：后端不可用", "error");
    }
  }

  /**
   * 将本地视频持久化到后端
   */
  async persistVideoToBackend(video, providedPath) {
    if (!video) return;
    const chosenPath = providedPath || video.src;
    if (isBlobUrl(chosenPath)) return;
    const previousId = video.id;
    try {
      const payload = await apiClient.saveVideo({
        title: video.title,
        src: chosenPath,
        tags: video.tags || [],
        is_local: !!video.isLocal
      });
      const data = payload && (payload.data || payload);
      if (data && data.id) {
        video.backendId = Number(data.id);
        video.id = video.backendId + 1000000;
        video.isLocal = false;
        if (this.state.currentVideoId === previousId) {
          this.state.currentVideoId = video.id;
        }
        setBackendBadge("已同步到后端", "ok");
        this.saveToLocalStorage();
        this.notifyListeners();
      }
    } catch (err) {
      setBackendBadge("无法同步到后端，已保持本地播放", "error");
    }
  }

  /**
   * 添加视频
   */
  addVideo(video) {
    this.state.videos.unshift(video);
    this.state.currentVideoId = video.id;
    this.notifyListeners();
    this.saveToLocalStorage();
  }

  /**
   * 删除视频
   */
  removeVideo(videoId) {
    this.state.videos = this.state.videos.filter((v) => v.id !== videoId);
    this.syncCurrentSelection();
    this.notifyListeners();
    this.saveToLocalStorage();
  }

  /**
   * 删除照片
   */
  removePhoto(photoId) {
    this.state.photos = this.state.photos.filter((p) => p.id !== photoId);
    this.syncCurrentSelection();
    this.notifyListeners();
    this.saveToLocalStorage();
  }

  /**
   * 添加视频标签
   */
  addVideoTag(videoId, tag) {
    const video = this.state.videos.find((v) => v.id === videoId);
    if (!video) return;
    video.tags = video.tags || [];
    if (!video.tags.includes(tag)) {
      video.tags.push(tag);
    }
    this.syncVideoTagsToBackend(video);
    this.notifyListeners();
    this.saveToLocalStorage();
  }

  /**
   * 删除视频标签
   */
  removeVideoTag(videoId, tagIndex) {
    const video = this.state.videos.find((v) => v.id === videoId);
    if (!video || !video.tags) return;
    if (tagIndex < 0 || tagIndex >= video.tags.length) return;
    video.tags.splice(tagIndex, 1);
    this.syncVideoTagsToBackend(video);
    this.notifyListeners();
    this.saveToLocalStorage();
  }

  /**
   * 添加照片标签
   */
  addPhotoTag(photoId, tag) {
    const photo = this.state.photos.find((p) => p.id === photoId);
    if (!photo) return;
    photo.tags = photo.tags || [];
    if (!photo.tags.includes(tag)) {
      photo.tags.push(tag);
    }
    this.notifyListeners();
    this.saveToLocalStorage();
  }

  /**
   * 删除照片标签
   */
  removePhotoTag(photoId, tagIndex) {
    const photo = this.state.photos.find((p) => p.id === photoId);
    if (!photo || !photo.tags) return;
    if (tagIndex < 0 || tagIndex >= photo.tags.length) return;
    photo.tags.splice(tagIndex, 1);
    this.notifyListeners();
    this.saveToLocalStorage();
  }

  /**
   * 从后端同步视频数据
   */
  async bootstrapBackendSync() {
    setBackendBadge("正在连接后端...", null);
    try {
      const payload = await apiClient.fetchVideos();
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      this.mergeBackendVideos(list);
      setBackendBadge(`已连接后端 · ${list.length} 条视频`, "ok");
    } catch (err) {
      apiClient.markOffline();
      setBackendBadge("未检测到后端，当前为本地模式", "error");
    }
  }
}
