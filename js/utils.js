/**
 * 工具函数模块
 */

/**
 * HTML 转义函数，防止 XSS 攻击
 */
export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c] || c;
  });
}

/**
 * 解析标签字符串，支持中英文逗号分隔
 */
export function parseTags(raw) {
  return (raw || "")
    .split(/[，,]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * 判断是否为 Blob URL
 */
export function isBlobUrl(src) {
  return typeof src === "string" && src.startsWith("blob:");
}

/**
 * 设置本地视频提示信息
 */
export function setLocalVideoHint(message, isError = false) {
  const localVideoHint = document.getElementById("localVideoHint");
  if (!localVideoHint) return;
  localVideoHint.textContent = message;
  localVideoHint.style.color = isError ? "#fecaca" : "var(--text-muted)";
}

/**
 * 设置后端连接状态徽章
 */
export function setBackendBadge(text, status) {
  const backendStatus = document.getElementById("backendStatus");
  if (!backendStatus) return;
  backendStatus.textContent = "";
  const dot = document.createElement("span");
  dot.className = "status-dot";
  backendStatus.appendChild(dot);
  backendStatus.append(document.createTextNode(text));
  backendStatus.classList.remove("ok", "error");
  if (status === "ok") {
    backendStatus.classList.add("ok");
  }
  if (status === "error") {
    backendStatus.classList.add("error");
  }
}
