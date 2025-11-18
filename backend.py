import json
import sqlite3
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlparse

DB_PATH = Path("data/media.db")
PORT = 5001


def ensure_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            src TEXT NOT NULL,
            tags TEXT DEFAULT '[]',
            is_local INTEGER DEFAULT 0
        )
        """
    )
    conn.commit()
    conn.close()


def fetch_all_videos():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute("SELECT id, title, src, tags, is_local FROM videos ORDER BY id DESC")
    rows = cur.fetchall()
    conn.close()
    data = []
    for row in rows:
        try:
            tags = json.loads(row[3]) if row[3] else []
        except json.JSONDecodeError:
            tags = []
        data.append(
            {
                "id": row[0],
                "title": row[1],
                "src": row[2],
                "tags": tags,
                "is_local": bool(row[4]),
            }
        )
    return data


def insert_video(title, src, tags, is_local=False):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute(
        "INSERT INTO videos (title, src, tags, is_local) VALUES (?, ?, ?, ?)",
        (title, src, json.dumps(tags or []), int(bool(is_local))),
    )
    conn.commit()
    video_id = cur.lastrowid
    conn.close()
    return video_id


def update_tags(video_id, tags):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "UPDATE videos SET tags = ? WHERE id = ?",
        (json.dumps(tags or []), int(video_id)),
    )
    conn.commit()
    conn.close()


def delete_video(video_id):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM videos WHERE id = ?", (int(video_id),))
    conn.commit()
    conn.close()


class VideoHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        # Keep console output quiet for cleaner demos
        return

    def _parse_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        try:
            raw = self.rfile.read(length)
            return json.loads(raw)
        except json.JSONDecodeError:
            return {}

    def _respond(self, status=200, data=None):
        self._set_headers(status)
        payload = {"ok": status < 400, "data": data}
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def do_OPTIONS(self):
        self._set_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/videos":
            data = fetch_all_videos()
            self._respond(200, data)
            return
        self._respond(404, {"message": "Not Found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        body = self._parse_body()

        if parsed.path == "/api/videos":
            title = body.get("title") or "未命名视频"
            src = body.get("src") or ""
            tags = body.get("tags") or []
            is_local = bool(body.get("is_local", False))
            if not src:
                self._respond(400, {"message": "src 必填"})
                return
            video_id = insert_video(title, src, tags, is_local)
            self._respond(201, {"id": video_id})
            return

        if parsed.path.startswith("/api/videos/") and parsed.path.endswith("/tags"):
            try:
                video_id = int(parsed.path.split("/")[3])
            except (ValueError, IndexError):
                self._respond(400, {"message": "无效的视频 ID"})
                return
            tags = body.get("tags") or []
            update_tags(video_id, tags)
            self._respond(200, {"id": video_id, "tags": tags})
            return

        self._respond(404, {"message": "Not Found"})

    def do_DELETE(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/videos/"):
            try:
                video_id = int(parsed.path.split("/")[3])
            except (ValueError, IndexError):
                self._respond(400, {"message": "无效的视频 ID"})
                return
            delete_video(video_id)
            self._respond(200, {"deleted": video_id})
            return
        self._respond(404, {"message": "Not Found"})


def run_server():
    ensure_db()
    server = HTTPServer(("", PORT), VideoHandler)
    print(f"Backend server running on http://localhost:{PORT}")
    print("Available endpoints:")
    print("  GET    /api/videos")
    print("  POST   /api/videos")
    print("  POST   /api/videos/<id>/tags")
    print("  DELETE /api/videos/<id>")
    server.serve_forever()


if __name__ == "__main__":
    run_server()
