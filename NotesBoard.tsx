import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Plus, Trash2, Check, Send, Sparkles } from "lucide-react";
import { Note, Config } from "../types";

// Colors Mapping for notes
const colors = [
  { name: "rose", bg: "bg-rose-100/80 border-rose-200/60 text-rose-800", dot: "bg-rose-400", hex: "#ffe4e6" },
  { name: "amber", bg: "bg-amber-100/80 border-amber-200/60 text-amber-800", dot: "bg-amber-400", hex: "#fef3c7" },
  { name: "purple", bg: "bg-purple-100/80 border-purple-200/60 text-purple-800", dot: "bg-purple-400", hex: "#f3e8ff" },
  { name: "emerald", bg: "bg-emerald-100/80 border-emerald-200/60 text-emerald-800", dot: "bg-emerald-400", hex: "#d1fae5" },
];

interface NotesBoardProps {
  notes: Note[];
  config: Config;
  onAddNote: (content: string, color: string, author: string) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
}

export default function NotesBoard({ notes, config, onAddNote, onDeleteNote }: NotesBoardProps) {
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState("rose");
  const [author, setAuthor] = useState(config.user || "Alihan");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    try {
      await onAddNote(content.trim(), selectedColor, author);
      setContent("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteNote(id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="notes-board" className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
        <h2 className="text-xl font-bold font-sans text-gray-800">Love Notes Board</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Note Creator Form */}
        <div className="lg:col-span-4 bg-white/70 backdrop-blur-md p-5 border border-rose-100 rounded-3xl shadow-sm h-fit">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 border-b border-rose-50 pb-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              Leave a Sweet Note
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Who is writing?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAuthor(config.user)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                    author === config.user
                      ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                      : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  {config.user}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthor(config.partner)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                    author === config.partner
                      ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                      : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  {config.partner}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Note Content</label>
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 150))}
                  required
                  placeholder="Write something sweet, funny, or just wish a wonderful day... ❤️"
                  className="w-full h-28 px-4 py-3 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-300 bg-gray-50/50 text-sm font-sans resize-none text-gray-700 leading-relaxed"
                />
                <span className="absolute bottom-2.5 right-3 text-[10px] font-mono text-gray-400">
                  {content.length}/150
                </span>
              </div>
            </div>

            {/* Pastel Color Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Sticker Color</label>
              <div className="flex gap-3">
                {colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-7 h-7 rounded-full border relative transition-all ${
                      selectedColor === c.name
                        ? "ring-2 ring-rose-400 ring-offset-2 scale-110 border-gray-300"
                        : "border-gray-100 hover:scale-105"
                    }`}
                    title={`${c.name} color`}
                  >
                    {selectedColor === c.name && (
                      <Check className="w-3.5 h-3.5 text-gray-600 absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="flex items-center justify-center gap-1.5 w-full mt-2 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white rounded-xl shadow-sm text-xs font-medium transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? "Sending..." : "Pin Note"}
            </button>
          </form>
        </div>

        {/* Notes list */}
        <div className="lg:col-span-8">
          {notes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 border border-dashed border-rose-100 bg-white/30 rounded-3xl text-center">
              <Heart className="w-8 h-8 text-rose-200 mb-2 stroke-1" />
              <p className="text-sm text-gray-400 font-sans">
                The board is empty. Time to leave your first sweet note! ✨
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <AnimatePresence initial={false}>
                {notes.map((note, index) => {
                  const colorConfig = colors.find((c) => c.name === note.color) || colors[0];
                  // Let's alternate sticky notes rotation angles slightly for a realistic paper look!
                  const rotations = ["rotate-1", "-rotate-1", "rotate-[1.5deg]", "-rotate-[1.5deg]", "rotate-[0.5deg]", "-rotate-[0.5deg]"];
                  const rotationClass = rotations[index % rotations.length];

                  return (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{ duration: 0.3 }}
                      layout
                      whileHover={{ scale: 1.02, rotate: 0, zIndex: 10, transition: { duration: 0.2 } }}
                      className={`relative flex flex-col p-5 border-t-4 rounded-b-xl rounded-t-sm shadow-sm hover:shadow-md transition-shadow ${colorConfig.bg} ${rotationClass}`}
                    >
                      {/* Sweet tape visual at the top */}
                      <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-14 h-4 bg-white/45 backdrop-blur-sm border-x border-dashed border-gray-300/40 rotate-[1.5deg] shadow-sm z-10" />

                      {/* Delete note */}
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="absolute top-2.5 right-2.5 p-1 text-gray-400 hover:text-red-600 rounded hover:bg-white/50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Note Content */}
                      <div className="text-sm font-sans italic whitespace-pre-wrap leading-relaxed py-2 flex-grow pr-4">
                        {note.content}
                      </div>

                      {/* Footer */}
                      <div className="mt-4 pt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-sans opacity-70">
                        <span className="font-semibold flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${colorConfig.dot}`} />
                          From: {note.author}
                        </span>
                        <span>
                          {new Date(note.date).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
