import { FullData, Config, Note, Memory, ImportantDate } from "../types";

export async function fetchAllData(): Promise<FullData> {
  const res = await fetch("/api/data");
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
}

export async function updateConfig(config: Partial<Config>): Promise<Config> {
  const res = await fetch("/api/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error("Failed to update config");
  const data = await res.json();
  return data.config;
}

export async function updateImportantDates(dates: ImportantDate[]): Promise<ImportantDate[]> {
  const res = await fetch("/api/config/dates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dates),
  });
  if (!res.ok) throw new Error("Failed to update important dates");
  const data = await res.json();
  return data.importantDates;
}

export async function createNote(content: string, color: string, author: string): Promise<Note> {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, color, author }),
  });
  if (!res.ok) throw new Error("Failed to create note");
  const data = await res.json();
  return data.note;
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete note");
}

export async function createMemory(payload: {
  title: string;
  description: string;
  date: string;
  photoBase64?: string;
  audioBase64?: string;
  audioDuration?: number;
}): Promise<Memory> {
  const res = await fetch("/api/memories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create memory");
  const data = await res.json();
  return data.memory;
}

export async function likeMemory(id: string): Promise<number> {
  const res = await fetch(`/api/memories/${id}/like`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to like memory");
  const data = await res.json();
  return data.likes;
}

export async function deleteMemory(id: string): Promise<void> {
  const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete memory");
}
