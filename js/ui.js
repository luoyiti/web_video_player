/**
 * UI 渲染模块
 * 负责所有界面元素的渲染和更新
 */

import { escapeHtml } from "./utils.js";

export class UIRenderer {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.initDOMRefs();
  }

  /**
   * 初始化 DOM 引用
   */
  initDOMRefs() {
    this.tabButtons = document.querySelectorAll(".tab-btn");
    this.tagFilterBar = document.getElementById("tagFilterBar");
    this.sideListTitle = document.getElementById("sideListTitle");
    this.sideListSubtitle = document.getElementById("sideListSubtitle");
    this.videoListEl = document.getElementById("videoList");
    this.photoGridEl = document.getElementById("photoGrid");
    this.videoView = document.getElementById("videoView");
    this.photoView = document.getElementById("photoView");
    this.videoPlayer = document.getElementById("videoPlayer");
    this.currentVideoTitle = document.getElementById("currentVideoTitle");
    this.currentVideoMeta = document.getElementById("currentVideoMeta");
    this.currentVideoTags = document.getElementById("currentVideoTags");
    this.photoPreviewWrapper = document.getElementById("photoPreviewWrapper");
    this.currentPhotoTitle = document.getElementById("currentPhotoTitle");
    this.currentPhotoMeta = document.getElementById("currentPhotoMeta");
    this.currentPhotoTags = document.getElementById("currentPhotoTags");
  }

  /**
   * 渲染所有组件
   */
  renderAll() {
    const state = this.stateManager.getState();
    this.stateManager.syncCurrentSelection();
    this.renderTabs(state);
    this.renderTagFilterBar(state);
    this.renderSideList(state);
    this.renderVideoView(state);
    this.renderPhotoView(state);
  }

  /**
   * 渲染标签页切换按钮
   */
  renderTabs(state) {
    this.tabButtons.forEach((btn) => {
      const tab = btn.getAttribute("data-tab");
      const isActive = tab === state.currentTab;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
  }

  /**
   * 渲染标签筛选栏
   */
  renderTagFilterBar(state) {
    const tags = this.stateManager.getTagsForCurrentTab();
    if (tags.length === 0) {
      this.tagFilterBar.innerHTML =
        '<span class="empty-text">当前模块暂无标签，可先为视频 / 照片添加标签</span>';
      return;
    }

    let html = "";
    const isActiveAll = !state.activeTag;
    html += `
      <button class="tag-filter ${isActiveAll ? "tag-filter-active" : ""}"
              type="button"
              data-tag="__all">
        <span class="tag-filter-dot"></span>
        全部
      </button>
    `;

    tags.forEach((tag) => {
      const encoded = encodeURIComponent(tag);
      const isActive = state.activeTag === tag;
      html += `
        <button class="tag-filter ${
          isActive ? "tag-filter-active" : ""
        }" type="button" data-tag="${encoded}">
          <span class="tag-filter-dot"></span>
          ${escapeHtml(tag)}
        </button>
      `;
    });

    this.tagFilterBar.innerHTML = html;
  }

  /**
   * 渲染侧边栏列表（视频列表或照片网格）
   */
  renderSideList(state) {
    const isVideoTab = state.currentTab === "video";

    if (isVideoTab) {
      this.renderVideoList(state);
    } else {
      this.renderPhotoGrid(state);
    }
  }

  /**
   * 渲染视频列表
   */
  renderVideoList(state) {
    this.sideListTitle.innerHTML = '<span class="card-title-icon">🎬</span> 视频播放列表';
    this.sideListSubtitle.textContent = "点击条目开始播放";
    this.videoListEl.style.display = "flex";
    this.photoGridEl.style.display = "none";

    let videos = state.videos.slice();
    if (state.activeTag) {
      videos = videos.filter((v) => (v.tags || []).includes(state.activeTag));
    }

    if (videos.length === 0) {
      this.videoListEl.innerHTML =
        '<div class="empty-text">当前筛选条件下没有可用视频。</div>';
      return;
    }

    const html = videos
      .map((v) => {
        const isActive = v.id === state.currentVideoId;
        const tagHtml = (v.tags || [])
          .map((t) => `<span class="mini-tag">${escapeHtml(t)}</span>`)
          .join("");
        const localBadge = v.isLocal
          ? '<span class="mini-tag mini-tag-local">本地</span>'
          : "";
        const combinedTags = `${localBadge}${
          tagHtml || '<span class="mini-tag" style="opacity:0.7;">无标签</span>'
        }`;

        return `
          <div class="video-item ${
            isActive ? "video-item-active" : ""
          }" data-video-id="${v.id}">
            <div class="video-thumb">
              <div class="video-thumb-play"></div>
            </div>
            <div class="video-meta">
              <div class="video-title" title="${escapeHtml(v.title)}">
                ${escapeHtml(v.title)}
              </div>
              <div class="video-extra">
                <div class="video-tags">
                  ${combinedTags}
                </div>
                <span class="counter">${v.tags ? v.tags.length : 0} 标签</span>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    this.videoListEl.innerHTML = html;
  }

  /**
   * 渲染照片网格
   */
  renderPhotoGrid(state) {
    this.sideListTitle.innerHTML = '<span class="card-title-icon">🖼️</span> 照片集合';
    this.sideListSubtitle.textContent = "点击缩略图预览";
    this.videoListEl.style.display = "none";
    this.photoGridEl.style.display = "grid";

    let photos = state.photos.slice();
    if (state.activeTag) {
      photos = photos.filter((p) => (p.tags || []).includes(state.activeTag));
    }

    if (photos.length === 0) {
      this.photoGridEl.innerHTML =
        '<div class="empty-text">当前筛选条件下没有可用照片。</div>';
      return;
    }

    const html = photos
      .map((p) => {
        const isActive = p.id === state.currentPhotoId;
        return `
          <div class="photo-card ${
            isActive ? "photo-card-active" : ""
          }" data-photo-id="${p.id}">
            <img src="${escapeHtml(p.src)}" alt="${escapeHtml(p.title)}" />
            <div class="photo-card-footer">
              <span class="photo-card-title" title="${escapeHtml(p.title)}">
                ${escapeHtml(p.title)}
              </span>
              <span class="photo-card-count">${p.tags ? p.tags.length : 0} 标签</span>
            </div>
          </div>
        `;
      })
      .join("");

    this.photoGridEl.innerHTML = html;
  }

  /**
   * 渲染视频播放视图
   */
  renderVideoView(state) {
    if (state.currentTab !== "video") {
      this.videoView.style.display = "none";
      return;
    }
    this.videoView.style.display = "block";

    const video = this.stateManager.getCurrentVideo();
    if (!video) {
      this.videoPlayer.removeAttribute("src");
      this.videoPlayer.load();
      this.currentVideoTitle.textContent = "暂无可播放视频";
      this.currentVideoMeta.textContent = "0 个标签";
      this.currentVideoTags.innerHTML =
        '<span class="empty-text">请先在左侧添加视频数据</span>';
      return;
    }

    if (this.videoPlayer.getAttribute("src") !== video.src) {
      this.videoPlayer.setAttribute("src", video.src);
      this.videoPlayer.load();
    }

    this.currentVideoTitle.textContent = video.title;
    const tagCount = video.tags ? video.tags.length : 0;
    const metaSuffix = video.isLocal
      ? " · 本地文件"
      : video.fromBackend
        ? " · 后端同步"
        : "";
    this.currentVideoMeta.textContent = `${tagCount} 个标签${metaSuffix}`;

    if (!video.tags || video.tags.length === 0) {
      this.currentVideoTags.innerHTML =
        '<span class="empty-text">暂无标签，可在下方输入框中添加</span>';
    } else {
      const html = video.tags
        .map((t, index) => {
          return `
            <button
              type="button"
              class="tag-chip tag-chip-removable"
              data-media-type="video"
              data-media-id="${video.id}"
              data-tag-index="${index}">
              <span>${escapeHtml(t)}</span>
              <span class="tag-chip-remove-x" aria-hidden="true">×</span>
            </button>
          `;
        })
        .join("");
      this.currentVideoTags.innerHTML = html;
    }
  }

  /**
   * 渲染照片预览视图
   */
  renderPhotoView(state) {
    if (state.currentTab !== "photo") {
      this.photoView.style.display = "none";
      return;
    }
    this.photoView.style.display = "block";

    const photo = this.stateManager.getCurrentPhoto();

    if (!photo) {
      this.photoPreviewWrapper.innerHTML =
        '<div class="photo-placeholder">暂无可预览的照片</div>';
      this.currentPhotoTitle.textContent = "暂无照片";
      this.currentPhotoMeta.textContent = "0 个标签";
      this.currentPhotoTags.innerHTML =
        '<span class="empty-text">请先在左侧添加照片数据</span>';
      return;
    }

    this.photoPreviewWrapper.innerHTML = `
      <img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.title)}" />
    `;
    this.currentPhotoTitle.textContent = photo.title;
    const tagCount = photo.tags ? photo.tags.length : 0;
    this.currentPhotoMeta.textContent = `${tagCount} 个标签`;

    if (!photo.tags || photo.tags.length === 0) {
      this.currentPhotoTags.innerHTML =
        '<span class="empty-text">暂无标签，可在下方输入框中添加</span>';
    } else {
      const html = photo.tags
        .map((t, index) => {
          return `
            <button
              type="button"
              class="tag-chip tag-chip-removable"
              data-media-type="photo"
              data-media-id="${photo.id}"
              data-tag-index="${index}">
              <span>${escapeHtml(t)}</span>
              <span class="tag-chip-remove-x" aria-hidden="true">×</span>
            </button>
          `;
        })
        .join("");
      this.currentPhotoTags.innerHTML = html;
    }
  }
}
