import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, Sparkles, Flame, Compass, Gift, Coffee, Music, Camera, 
  Plus, Calendar, Trash2, X, Check, Edit2, ChevronDown, ChevronUp 
} from "lucide-react";
import { ImportantDate } from "../types";

// Icon components mapping
const iconMap: Record<string, any> = {
  Heart: Heart,
  Sparkles: Sparkles,
  Flame: Flame,
  Compass: Compass,
  Gift: Gift,
  Coffee: Coffee,
  Music: Music,
  Camera: Camera,
};

interface ImportantDatesProps {
  dates: ImportantDate[];
  onUpdateDates: (newDates: ImportantDate[]) => Promise<void>;
}

export default function ImportantDates({ dates, onUpdateDates }: ImportantDatesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [title, setTitle] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [iconName, setIconName] = useState("Heart");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper to calculate days info
  const getDaysInfo = (dateString: string) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    targetDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    const diffTime = today.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Calculate next annual occurrence
    const nextAnniversary = new Date(targetDate);
    nextAnniversary.setFullYear(today.getFullYear());
    if (nextAnniversary.getTime() < today.getTime()) {
      nextAnniversary.setFullYear(today.getFullYear() + 1);
    }
    const daysUntilNext = Math.floor((nextAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      daysPassed: diffDays >= 0 ? diffDays : null,
      daysUntil: diffDays < 0 ? Math.abs(diffDays) : null,
      daysUntilAnniversary: daysUntilNext === 0 ? 0 : daysUntilNext
    };
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateStr) return;
    setLoading(true);

    const newDate: ImportantDate = {
      id: `date_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title,
      date: dateStr,
      icon: iconName,
      description
    };

    try {
      await onUpdateDates([...dates, newDate]);
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !title || !dateStr) return;
    setLoading(true);

    const updated = dates.map(d => {
      if (d.id === editingId) {
        return { ...d, title, date: dateStr, icon: iconName, description };
      }
      return d;
    });

    try {
      await onUpdateDates(updated);
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this special date? 🥺")) return;
    try {
      await onUpdateDates(dates.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (d: ImportantDate) => {
    setEditingId(d.id);
    setTitle(d.title);
    setDateStr(d.date);
    setIconName(d.icon);
    setDescription(d.description);
    setIsAdding(true);
  };

  const resetForm = () => {
    setTitle("");
    setDateStr("");
    setIconName("Heart");
    setDescription("");
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div id="important-dates" className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold font-sans text-gray-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-500" />
          Important Dates
        </h2>
        {!isAdding && (
          <button
            id="add-date-btn"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-full font-medium transition-all duration-300 shadow-sm border border-rose-100/30"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Date
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/80 backdrop-blur-md border border-rose-100 rounded-2xl p-5 mb-6 shadow-sm overflow-hidden"
          >
            <form onSubmit={editingId ? handleEditSubmit : handleAddSubmit} className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-rose-50 pb-2">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-rose-400" />
                  {editingId ? "Edit Date" : "New Special Event"}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">Event Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Our first kiss"
                    className="px-4 py-2 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 bg-gray-50/50 text-sm font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">Date</label>
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    required
                    className="px-4 py-2 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 bg-gray-50/50 text-sm font-sans"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief note about this magical day..."
                  className="px-4 py-2 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 bg-gray-50/50 text-sm font-sans resize-none h-16"
                />
              </div>

              {/* Icon selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">Choose Icon</label>
                <div className="flex flex-wrap gap-2.5">
                  {Object.keys(iconMap).map((iconNameOption) => {
                    const IconComponent = iconMap[iconNameOption];
                    return (
                      <button
                        key={iconNameOption}
                        type="button"
                        onClick={() => setIconName(iconNameOption)}
                        className={`p-2.5 rounded-xl border transition-all ${
                          iconName === iconNameOption
                            ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                            : "bg-gray-50 border-gray-100 text-gray-400 hover:text-rose-400 hover:bg-rose-50"
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-rose-50">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-1.5 text-xs text-white bg-rose-500 hover:bg-rose-600 rounded-lg shadow-sm font-medium transition-colors"
                  disabled={loading}
                >
                  <Check className="w-3.5 h-3.5" />
                  {loading ? "Saving..." : editingId ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Grid display of dates */}
      {dates.length === 0 ? (
        <div className="text-center p-8 border border-dashed border-rose-100 bg-white/40 rounded-2xl">
          <p className="text-sm text-gray-400 font-sans">You don't have any important dates yet. Add your first one! 💞</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {dates.map((d) => {
            const Icon = iconMap[d.icon] || Heart;
            const info = getDaysInfo(d.date);
            const dateObj = new Date(d.date);

            return (
              <motion.div
                key={d.id}
                layout
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="group relative flex flex-col p-4 bg-white/70 backdrop-blur-sm border border-rose-100/50 rounded-2xl shadow-sm hover:shadow-md hover:border-rose-200 transition-all duration-300"
              >
                {/* Actions (visible on hover) */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => startEdit(d)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Icon & Title */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-100/50 text-rose-500 rounded-xl">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-800 tracking-tight leading-tight group-hover:text-rose-600 transition-colors">
                      {d.title}
                    </h3>
                    <span className="text-xs text-gray-400 font-sans mt-0.5 block">
                      {dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {d.description && (
                  <p className="text-xs text-gray-500 font-sans mt-3 line-clamp-2 leading-relaxed italic bg-rose-50/20 p-2 rounded-lg">
                    "{d.description}"
                  </p>
                )}

                {/* Days Countdown/Countup Calculations */}
                <div className="mt-auto pt-3 border-t border-rose-50/50 flex flex-col gap-1 text-[11px] font-medium font-mono text-gray-500">
                  {info.daysPassed !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Days passed:</span>
                      <span className="text-rose-500 font-semibold">{info.daysPassed} days</span>
                    </div>
                  )}
                  {info.daysUntil !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Days until:</span>
                      <span className="text-emerald-500 font-semibold">{info.daysUntil} days</span>
                    </div>
                  )}
                  {info.daysPassed !== null && info.daysUntilAnniversary !== 0 && (
                    <div className="flex items-center justify-between text-[10px] text-purple-500 mt-1">
                      <span className="text-gray-400 font-sans">Until anniversary:</span>
                      <span>{info.daysUntilAnniversary} days</span>
                    </div>
                  )}
                  {info.daysUntilAnniversary === 0 && (
                    <div className="text-center text-[10px] text-pink-600 font-sans font-bold bg-pink-50 py-0.5 rounded animate-pulse mt-1">
                      🎉 Today is the anniversary! 🎉
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
