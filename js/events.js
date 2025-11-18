/**
 * 事件处理模块
 * 负责绑定所有用户交互事件
 */

import { parseTags, setLocalVideoHint } from "./utils.js";
import { apiClient } from "./api.js";

export class EventHandler {
  constructor(stateManager, uiRenderer) {
    this.stateManager = stateManager;
    this.uiRenderer = uiRenderer;
  }

  /**
   * 初始化所有事件监听器
   */
  init() {
    this.bindTabSwitching();
    this.bindTagFiltering();
    this.bindVideoSelection();
    this.bindPhotoSelection();
    this.bindVideoTagManagement();
    this.bindPhotoTagManagement();
    this.bindLocalVideoUpload();
    this.bindDeleteActions();
  }

  /**
   * 绑定标签页切换事件
   */
  bindTabSwitching() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        const state = this.stateManager.getState();
        if (tab === state.currentTab) return;
        this.stateManager.setState({
          currentTab: tab,
          activeTag: null
        });
        this.uiRenderer.renderAll();
      });
    });
  }

  /**
   * 绑定标签筛选事件
   */
  bindTagFiltering() {
    const tagFilterBar = document.getElementById("tagFilterBar");
    tagFilterBar.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-tag]");
      if (!btn) return;
      const raw = btn.getAttribute("data-tag");
      let activeTag = null;
      if (raw !== "__all") {
        try {
          activeTag = decodeURIComponent(raw);
        } catch (err) {
          activeTag = null;
        }
      }
      this.stateManager.setState({ activeTag });
      this.uiRenderer.renderAll();
    });
  }

  /**
   * 绑定视频列表选择事件
   */
  bindVideoSelection() {
    const videoListEl = document.getElementById("videoList");
    videoListEl.addEventListener("click", (e) => {
      const item = e.target.closest("[data-video-id]");
      if (!item) return;
      const id = Number(item.getAttribute("data-video-id"));
      const state = this.stateManager.getState();
      if (!id || id === state.currentVideoId) return;
      this.stateManager.setState({ currentVideoId: id });
      this.uiRenderer.renderAll();
    });
  }

  /**
   * 绑定照片网格选择事件
   */
  bindPhotoSelection() {
    const photoGridEl = document.getElementById("photoGrid");
    photoGridEl.addEventListener("click", (e) => {
      const item = e.target.closest("[data-photo-id]");
      if (!item) return;
      const id = Number(item.getAttribute("data-photo-id"));
      const state = this.stateManager.getState();
      if (!id || id === state.currentPhotoId) return;
      this.stateManager.setState({ currentPhotoId: id });
      this.uiRenderer.renderAll();
    });
  }

  /**
   * 绑定视频标签管理事件
   */
  bindVideoTagManagement() {
    // 删除标签
    const currentVideoTags = document.getElementById("currentVideoTags");
    currentVideoTags.addEventListener("click", (e) => {
      const btn = e.target.closest(".tag-chip-removable");
      if (!btn) return;
      const mediaType = btn.getAttribute("data-media-type");
      const mediaId = Number(btn.getAttribute("data-media-id"));
      const tagIndex = Number(btn.getAttribute("data-tag-index"));
      if (mediaType !== "video" || isNaN(mediaId) || isNaN(tagIndex)) return;

      this.stateManager.removeVideoTag(mediaId, tagIndex);
      this.uiRenderer.renderAll();
    });

    // 添加标签
    const addVideoTagForm = document.getElementById("addVideoTagForm");
    const videoTagInput = document.getElementById("videoTagInput");
    addVideoTagForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = (videoTagInput.value || "").trim();
      if (!value) return;
      const video = this.stateManager.getCurrentVideo();
      if (!video) return;
      this.stateManager.addVideoTag(video.id, value);
      videoTagInput.value = "";
      this.uiRenderer.renderAll();
    });
  }

  /**
   * 绑定照片标签管理事件
   */
  bindPhotoTagManagement() {
    // 删除标签
    const currentPhotoTags = document.getElementById("currentPhotoTags");
    currentPhotoTags.addEventListener("click", (e) => {
      const btn = e.target.closest(".tag-chip-removable");
      if (!btn) return;
      const mediaType = btn.getAttribute("data-media-type");
      const mediaId = Number(btn.getAttribute("data-media-id"));
      const tagIndex = Number(btn.getAttribute("data-tag-index"));
      if (mediaType !== "photo" || isNaN(mediaId) || isNaN(tagIndex)) return;

      this.stateManager.removePhotoTag(mediaId, tagIndex);
      this.uiRenderer.renderAll();
    });

    // 添加标签
    const addPhotoTagForm = document.getElementById("addPhotoTagForm");
    const photoTagInput = document.getElementById("photoTagInput");
    addPhotoTagForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = (photoTagInput.value || "").trim();
      if (!value) return;
      const photo = this.stateManager.getCurrentPhoto();
      if (!photo) return;
      this.stateManager.addPhotoTag(photo.id, value);
      photoTagInput.value = "";
      this.uiRenderer.renderAll();
    });
  }

  /**
   * 绑定本地视频上传事件
   */
  bindLocalVideoUpload() {
    const localVideoForm = document.getElementById("localVideoForm");
    const localVideoFileInput = document.getElementById("localVideoFile");
    const localVideoTitleInput = document.getElementById("localVideoTitle");
    const localVideoTagsInput = document.getElementById("localVideoTags");
    const localVideoPathInput = document.getElementById("localVideoPath");

    localVideoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const file = localVideoFileInput.files[0];
      if (!file) {
        setLocalVideoHint("请选择一个本地视频文件。", true);
        return;
      }

      const title = (localVideoTitleInput.value || file.name).trim();
      const tags = parseTags(localVideoTagsInput.value);
      const manualPath = (localVideoPathInput.value || "").trim();
      const newVideo = {
        id: Date.now(),
        title: title || file.name,
        src: URL.createObjectURL(file),
        tags,
        isLocal: true,
        fileName: file.name,
        fileSize: file.size,
        persistedSrc: manualPath || null
      };

      this.stateManager.addVideo(newVideo);
      this.uiRenderer.renderAll();
      localVideoForm.reset();
      setLocalVideoHint(
        manualPath
          ? "已加载本地视频，填写的路径将用于后端同步"
          : "已加载本地视频，刷新后需重新选择文件。"
      );

      if (manualPath) {
        this.stateManager.persistVideoToBackend(newVideo, manualPath);
      }
    });
  }

  /**
   * 绑定删除操作事件
   */
  bindDeleteActions() {
    // 删除当前视频
    const deleteCurrentVideoBtn = document.getElementById("deleteCurrentVideoBtn");
    deleteCurrentVideoBtn.addEventListener("click", async () => {
      const video = this.stateManager.getCurrentVideo();
      if (!video) return;
      if (!confirm(`确定要从列表中移除视频「${video.title}」吗？\n（仅前端本地演示）`)) {
        return;
      }
      this.stateManager.removeVideo(video.id);
      if (video.backendId) {
        try {
          await apiClient.deleteVideo(video.backendId);
          const { setBackendBadge } = await import("./utils.js");
          setBackendBadge("后端已删除视频", "ok");
        } catch {
          const { setBackendBadge } = await import("./utils.js");
          setBackendBadge("后端删除失败，已在前端移除", "error");
        }
      }
      this.uiRenderer.renderAll();
    });

    // 删除当前照片
    const deleteCurrentPhotoBtn = document.getElementById("deleteCurrentPhotoBtn");
    deleteCurrentPhotoBtn.addEventListener("click", () => {
      const photo = this.stateManager.getCurrentPhoto();
      if (!photo) return;
      if (!confirm(`确定要从列表中移除照片「${photo.title}」吗？\n（仅前端本地演示）`)) {
        return;
      }
      this.stateManager.removePhoto(photo.id);
      this.uiRenderer.renderAll();
    });
  }
}
