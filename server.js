const express = require("express");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const PORT = process.env.PORT || 5001;
const DB_PATH = path.join(__dirname, "data", "media.db");
const STATIC_ROOT = __dirname;

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new sqlite3.Database(DB_PATH);
db.serialize(() => {
  db.run(
    `
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        src TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        is_local INTEGER DEFAULT 0
      )
    `
  );
});

const app = express();

app.use(express.json());

// Basic CORS headers keep the API usable even if assets are served elsewhere.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.static(STATIC_ROOT));

const sendJson = (res, status, data) => {
  res.status(status).json({ ok: status < 400, data });
};

const handleError = (res, error) => {
  console.error(error);
  sendJson(res, 500, { message: "服务器内部错误" });
};

const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags;
  }
  return [];
};

const parseRowTags = (value) => {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

app.get("/api/videos", async (_req, res) => {
  try {
    const rows = await dbAll("SELECT id, title, src, tags, is_local FROM videos ORDER BY id DESC");
    const data = rows.map((row) => ({
      id: row.id,
      title: row.title,
      src: row.src,
      tags: parseRowTags(row.tags),
      is_local: Boolean(row.is_local)
    }));
    sendJson(res, 200, data);
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/api/videos", async (req, res) => {
  const { title, src, tags, is_local: isLocal } = req.body || {};
  if (!src || typeof src !== "string") {
    return sendJson(res, 400, { message: "src 必填" });
  }
  const payload = {
    title: title?.trim() || "未命名视频",
    src: src.trim(),
    tags: normalizeTags(tags),
    is_local: Boolean(isLocal)
  };
  try {
    const result = await dbRun(
      "INSERT INTO videos (title, src, tags, is_local) VALUES (?, ?, ?, ?)",
      [payload.title, payload.src, JSON.stringify(payload.tags), Number(payload.is_local)]
    );
    sendJson(res, 201, { id: result.lastID });
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/api/videos/:id/tags", async (req, res) => {
  const videoId = Number(req.params.id);
  if (!Number.isInteger(videoId)) {
    return sendJson(res, 400, { message: "无效的视频 ID" });
  }
  try {
    const tags = normalizeTags(req.body?.tags);
    await dbRun("UPDATE videos SET tags = ? WHERE id = ?", [JSON.stringify(tags), videoId]);
    sendJson(res, 200, { id: videoId, tags });
  } catch (error) {
    handleError(res, error);
  }
});

app.delete("/api/videos/:id", async (req, res) => {
  const videoId = Number(req.params.id);
  if (!Number.isInteger(videoId)) {
    return sendJson(res, 400, { message: "无效的视频 ID" });
  }
  try {
    await dbRun("DELETE FROM videos WHERE id = ?", [videoId]);
    sendJson(res, 200, { deleted: videoId });
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(STATIC_ROOT, "index.html"));
});

app.listen(PORT, () => {
  console.log("Web + API server running:");
  console.log(`  Frontend: http://localhost:${PORT}`);
  console.log(`  API:      http://localhost:${PORT}/api/videos`);
});

const gracefulShutdown = () => {
  console.log("\nShutting down server...");
  db.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
