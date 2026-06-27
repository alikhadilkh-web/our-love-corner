import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Settings, Check, X, Calendar } from "lucide-react";
import { Config } from "../types";

interface RelationshipCounterProps {
  config: Config;
  onUpdateConfig: (newConfig: Partial<Config>) => Promise<void>;
}

export default function RelationshipCounter({ config, onUpdateConfig }: RelationshipCounterProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [startDate, setStartDate] = useState(config.startDate);
  const [user, setUser] = useState(config.user);
  const [partner, setPartner] = useState(config.partner);
  const [loading, setLoading] = useState(false);

  // Calculate days together
  const calculateDays = () => {
    const start = new Date(config.startDate);
    const today = new Date();
    // Set hours to 0 to avoid offset differences
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  const daysCount = calculateDays();

  // Pluralization in English
  const pluralizeDays = (count: number): string => {
    return count === 1 ? "day" : "days";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdateConfig({ startDate, user, partner });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="relationship-counter" className="relative flex flex-col items-center justify-center p-8 bg-white/70 backdrop-blur-md rounded-3xl border border-rose-100 shadow-sm max-w-xl mx-auto text-center w-full">
      {/* Settings Toggle */}
      <button
        id="toggle-settings-btn"
        onClick={() => setIsEditing(!isEditing)}
        className="absolute top-4 right-4 p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all duration-300"
        title="Anniversary and Names Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="display"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center"
          >
            {/* Heart Pulsing */}
            <motion.div
              id="pulsing-heart-container"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative w-40 h-40 flex items-center justify-center"
            >
              <Heart className="absolute w-full h-full text-rose-400 fill-rose-100/60" />
              <div className="z-10 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold font-sans text-rose-600 tracking-tight">
                  {daysCount}
                </span>
                <span className="text-sm font-sans font-medium text-rose-500 mt-1">
                  {pluralizeDays(daysCount)}
                </span>
              </div>
            </motion.div>

            {/* Names & Header */}
            <h1 className="text-2xl font-semibold font-sans text-gray-800 mt-6 tracking-tight flex items-center gap-2">
              <span>{config.user}</span>
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
              <span>{config.partner}</span>
            </h1>

            <p className="text-sm text-gray-500 font-sans mt-2">
              Together since <span className="font-semibold text-rose-400">{new Date(config.startDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</span>
            </p>

            <p className="text-xs text-rose-400 font-sans mt-3 px-4 py-1.5 bg-rose-50/60 rounded-full border border-rose-100/50">
              {daysCount === 0 ? "Our journey starts today! 💞" : "Every second with you is a treasure! ✨"}
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="edit"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col gap-4 text-left p-2"
          >
            <h3 className="text-lg font-semibold text-gray-800 border-b border-rose-50 pb-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              Configure Our Story
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Your Name</label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 bg-gray-50/50 font-sans text-sm text-gray-700"
                placeholder="Name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Your Partner's Name</label>
              <input
                type="text"
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 bg-gray-50/50 font-sans text-sm text-gray-700"
                placeholder="Partner's Name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Anniversary Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 bg-gray-50/50 font-sans text-sm text-gray-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-rose-50">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs text-white bg-rose-500 hover:bg-rose-600 rounded-lg shadow-sm font-medium transition-colors"
                disabled={loading}
              >
                <Check className="w-3.5 h-3.5" />
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
