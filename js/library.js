import { StateManager } from "./state.js";
import { escapeHtml } from "./utils.js";

const tagBar = document.getElementById("libraryTagBar");
const grid = document.getElementById("libraryGrid");
const totalBadge = document.getElementById("libraryTotal");

const stateManager = new StateManager();
stateManager.loadFromLocalStorage();
stateManager.syncCurrentSelection();
stateManager.bootstrapBackendSync();

function getAllTags(state) {
  const set = new Set();
  [...state.videos, ...state.photos].forEach((item) => {
    (item.tags || []).forEach((t) => set.add(t));
  });
  return Array.from(set).sort();
}

function renderTags(state) {
  const tags = getAllTags(state);
  if (!tagBar) return;
  if (tags.length === 0) {
    tagBar.innerHTML = '<span class="empty-text">暂无标签，请先在主页面添加</span>';
    return;
  }
  const isAll = !state.activeTag;
  let html = `
    <button class="tag-filter ${isAll ? "tag-filter-active" : ""}" data-tag="__all" type="button">
      <span class="tag-filter-dot"></span>
      全部
    </button>
  `;
  tags.forEach((tag) => {
    const isActive = state.activeTag === tag;
    html += `
      <button class="tag-filter ${isActive ? "tag-filter-active" : ""}" data-tag="${encodeURIComponent(
        tag
      )}" type="button">
        <span class="tag-filter-dot"></span>
        ${escapeHtml(tag)}
      </button>
    `;
  });
  tagBar.innerHTML = html;
}

function renderTotalBadge(count) {
  if (!totalBadge) return;
  const dot = totalBadge.querySelector(".pill-badge-dot");
  const textNode = totalBadge.querySelector("span:last-child");
  if (dot) {
    dot.style.background = count > 0 ? "var(--aurora-green)" : "var(--border)";
  }
  if (textNode) {
    textNode.textContent = `${count} 条媒体`;
  }
}

function renderGrid(state) {
  if (!grid) return;
  let allItems = [
    ...state.videos.map((v) => ({
      ...v,
      type: "video",
      preview: v.src,
      count: v.tags ? v.tags.length : 0
    })),
    ...state.photos.map((p) => ({
      ...p,
      type: "photo",
      preview: p.src,
      count: p.tags ? p.tags.length : 0
    }))
  ];

  if (state.activeTag) {
    allItems = allItems.filter((item) => (item.tags || []).includes(state.activeTag));
  }

  renderTotalBadge(allItems.length);

  if (allItems.length === 0) {
    grid.innerHTML = '<div class="empty-text">当前筛选下没有媒体，换个标签试试。</div>';
    return;
  }

  const html = allItems
    .map((item) => {
      const tagsHtml = (item.tags || [])
        .map((t) => `<span class="mini-tag">${escapeHtml(t)}</span>`)
        .join("") || '<span class="mini-tag" style="opacity:0.7;">无标签</span>';
      const badge = item.type === "video" ? "🎬 视频" : "🖼️ 照片";
      const badgeClass = item.type === "video" ? "media-type-video" : "media-type-photo";
      const maybeLocal = item.isLocal ? '<span class="mini-tag mini-tag-local">本地</span>' : "";
      const safeTitle = escapeHtml(item.title);
      return `
        <article class="media-card" data-type="${item.type}" data-media-id="${item.id}" style="cursor: pointer;">
          <div class="media-card-top">
            <div class="media-type ${badgeClass}">${badge}</div>
            <div class="media-count">${item.count} 标签</div>
          </div>
          <div class="media-preview" aria-label="${safeTitle}">
            ${item.type === "photo" ? `<img src="${escapeHtml(item.preview)}" alt="${safeTitle}" />` : ""}
            ${item.type === "video" ? `<div class="media-preview-icon">⏵</div>` : ""}
          </div>
          <div class="media-meta">
            <div class="media-title" title="${safeTitle}">${safeTitle}</div>
            <div class="media-tags">${maybeLocal}${tagsHtml}</div>
          </div>
        </article>
      `;
    })
    .join("");

  grid.innerHTML = html;
}

function render() {
  const state = stateManager.getState();
  renderTags(state);
  renderGrid(state);
}

function bindTagClick() {
  if (!tagBar) return;
  tagBar.addEventListener("click", (e) => {
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
    stateManager.setState({ activeTag });
    render();
  });
}

function bindMediaClick() {
  if (!grid) return;
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".media-card");
    if (!card) return;
    
    const mediaType = card.getAttribute("data-type");
    const mediaId = card.getAttribute("data-media-id");
    
    if (!mediaType || !mediaId) return;
    
    // 保存当前选中的媒体信息到 localStorage
    const currentState = stateManager.getState();
    if (mediaType === "video") {
      currentState.currentVideoId = Number(mediaId);
      currentState.currentTab = "video";
    } else if (mediaType === "photo") {
      currentState.currentPhotoId = Number(mediaId);
      currentState.currentTab = "photo";
    }
    
    stateManager.setState(currentState);
    stateManager.saveToLocalStorage();
    
    // 跳转到主页面
    window.location.href = `index.html#${mediaType}`;
  });
}

function init() {
  stateManager.subscribe(render);
  bindTagClick();
  bindMediaClick();
  render();
}

document.addEventListener("DOMContentLoaded", init);
