import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Ensure database folders exist
const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Initial seed data
const initialData = {
  config: {
    startDate: "2026-06-20",
    user: "Alihan",
    partner: "Beste",
    importantDates: []
  },
  notes: [],
  memories: []
};

// Seed db.json if not exists or if it's the old database
let shouldWriteSeed = false;
if (!fs.existsSync(DB_FILE)) {
  shouldWriteSeed = true;
} else {
  try {
    const current = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    if (current.config.user !== "Alihan") {
      shouldWriteSeed = true;
    }
  } catch (e) {
    shouldWriteSeed = true;
  }
}

if (shouldWriteSeed) {
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
}

// Read database helper
function readDB() {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading db.json, returning initial", err);
    return initialData;
  }
}

// Write database helper
function writeDB(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

// Base64 helper to save files
function saveBase64File(base64Data: string, prefix: string, extension: string): string {
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 string format");
  }
  const buffer = Buffer.from(matches[2], "base64");
  const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
  const filepath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  return `/uploads/${filename}`;
}

// JSON body parser with 50mb limit for base64 uploads (photos + voice notes)
app.use(express.json({ limit: "50mb" }));

// Serving uploaded files static route
app.use("/uploads", express.static(UPLOADS_DIR));

// API: Get all data
app.get("/api/data", (req, res) => {
  res.json(readDB());
});

// API: Save config
app.post("/api/config", (req, res) => {
  const db = readDB();
  db.config = { ...db.config, ...req.body };
  writeDB(db);
  res.json({ success: true, config: db.config });
});

// API: Save important dates
app.post("/api/config/dates", (req, res) => {
  const db = readDB();
  db.config.importantDates = req.body;
  writeDB(db);
  res.json({ success: true, importantDates: db.config.importantDates });
});

// API: Create note
app.post("/api/notes", (req, res) => {
  const db = readDB();
  const { content, color, author } = req.body;
  const newNote = {
    id: `n_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    content,
    color: color || "rose",
    author: author || db.config.user || "Александр",
    date: new Date().toISOString()
  };
  db.notes.unshift(newNote);
  writeDB(db);
  res.json({ success: true, note: newNote });
});

// API: Delete note
app.delete("/api/notes/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.notes = db.notes.filter((n: any) => n.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// API: Create memory
app.post("/api/memories", (req, res) => {
  const db = readDB();
  const { title, description, date, photoBase64, audioBase64, audioDuration } = req.body;
  
  let photoUrl = "";
  let audioUrl = "";

  try {
    if (photoBase64) {
      photoUrl = saveBase64File(photoBase64, "photo", "jpg");
    }
    if (audioBase64) {
      // Audio from MediaRecorder is usually webm or mp4/aac. Let's save as webm or mp3 based on mime
      const ext = audioBase64.includes("mp4") || audioBase64.includes("aac") ? "m4a" : "webm";
      audioUrl = saveBase64File(audioBase64, "audio", ext);
    }

    const newMemory = {
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title,
      description,
      date: date || new Date().toISOString().split("T")[0],
      photoUrl,
      audioUrl,
      audioDuration: audioDuration || 0,
      likes: 0
    };

    db.memories.unshift(newMemory);
    writeDB(db);
    res.json({ success: true, memory: newMemory });
  } catch (error: any) {
    console.error("Error saving memory file:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Like memory
app.post("/api/memories/:id/like", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const memory = db.memories.find((m: any) => m.id === id);
  if (memory) {
    memory.likes = (memory.likes || 0) + 1;
    writeDB(db);
    res.json({ success: true, likes: memory.likes });
  } else {
    res.status(404).json({ success: false, error: "Memory not found" });
  }
});

// API: Delete memory
app.delete("/api/memories/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const memoryIndex = db.memories.findIndex((m: any) => m.id === id);
  
  if (memoryIndex !== -1) {
    const memory = db.memories[memoryIndex];
    // Attempt to delete files
    try {
      if (memory.photoUrl) {
        const photoPath = path.join(process.cwd(), "data", memory.photoUrl);
        if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
      }
      if (memory.audioUrl) {
        const audioPath = path.join(process.cwd(), "data", memory.audioUrl);
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      }
    } catch (err) {
      console.error("Error deleting physical files for memory", err);
    }

    db.memories.splice(memoryIndex, 1);
    writeDB(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: "Memory not found" });
  }
});

// Vite Middleware & Production Routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
