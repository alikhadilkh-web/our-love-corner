import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, Sparkles, Calendar, MessageSquareHeart, Music, Star, Info,
  HeartCrack, HelpCircle
} from "lucide-react";
import { FullData, Config, Note, Memory, ImportantDate } from "./types";
import { 
  fetchAllData, updateConfig, updateImportantDates, createNote, 
  deleteNote, createMemory, likeMemory, deleteMemory 
} from "./utils/api";
import RelationshipCounter from "./components/RelationshipCounter";
import ImportantDates from "./components/ImportantDates";
import NotesBoard from "./components/NotesBoard";
import Timeline from "./components/Timeline";

export default function App() {
  const [data, setData] = useState<FullData | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "notes">("timeline");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const fullData = await fetchAllData();
        setData(fullData);
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError("Не удалось загрузить данные. Пожалуйста, перезагрузите страницу.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update Config handler
  const handleUpdateConfig = async (newConfig: Partial<Config>) => {
    try {
      const updatedConfig = await updateConfig(newConfig);
      setData(prev => prev ? { ...prev, config: updatedConfig } : null);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Update Important Dates handler
  const handleUpdateDates = async (newDates: ImportantDate[]) => {
    try {
      const updatedDates = await updateImportantDates(newDates);
      setData(prev => prev ? { ...prev, config: { ...prev.config, importantDates: updatedDates } } : null);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Add Note handler
  const handleAddNote = async (content: string, color: string, author: string) => {
    try {
      const newNote = await createNote(content, color, author);
      setData(prev => prev ? { ...prev, notes: [newNote, ...prev.notes] } : null);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Delete Note handler
  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
      setData(prev => prev ? { ...prev, notes: prev.notes.filter(n => n.id !== id) } : null);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Add Memory handler
  const handleAddMemory = async (payload: {
    title: string;
    description: string;
    date: string;
    photoBase64?: string;
    audioBase64?: string;
    audioDuration?: number;
  }) => {
    try {
      const newMemory = await createMemory(payload);
      setData(prev => prev ? { ...prev, memories: [newMemory, ...prev.memories] } : null);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Like Memory handler
  const handleLikeMemory = async (id: string) => {
    try {
      const newLikes = await likeMemory(id);
      setData(prev => prev ? {
        ...prev,
        memories: prev.memories.map(m => m.id === id ? { ...m, likes: newLikes } : m)
      } : null);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Delete Memory handler
  const handleDeleteMemory = async (id: string) => {
    try {
      await deleteMemory(id);
      setData(prev => prev ? { ...prev, memories: prev.memories.filter(m => m.id !== id) } : null);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Loading animation view
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center font-sans">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-rose-500 mb-4"
        >
          <Heart className="w-12 h-12 fill-rose-500 text-rose-500" />
        </motion.div>
        <p className="text-sm font-medium text-rose-400">Creating our cozy space...</p>
      </div>
    );
  }

  // Error boundary view
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center font-sans p-6 text-center">
        <HeartCrack className="w-16 h-16 text-rose-300 mb-4 stroke-1" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Oops! Something went wrong...</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6">{error || "Unknown loading error"}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-rose-500 text-white rounded-full text-xs font-semibold shadow-md hover:bg-rose-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#2D2A2A] font-sans pb-16 selection:bg-rose-100 selection:text-rose-900 relative overflow-hidden">
      
      {/* Decorative background hearts */}
      <div className="absolute top-10 left-10 text-rose-100/30 select-none pointer-events-none">
        <Heart className="w-24 h-24 fill-rose-100/10" />
      </div>
      <div className="absolute top-1/3 right-12 text-rose-100/30 select-none pointer-events-none">
        <Sparkles className="w-16 h-16" />
      </div>
      <div className="absolute bottom-12 left-16 text-rose-100/30 select-none pointer-events-none">
        <Heart className="w-32 h-32 fill-rose-100/5" />
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 relative z-10">
        
        {/* Navigation / Floating Brand */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-rose-100/40">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100/60 rounded-2xl text-rose-500">
              <Heart className="w-6 h-6 fill-rose-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 tracking-tight flex items-center gap-1.5">
                Our Story
                <Sparkles className="w-4 h-4 text-rose-400" />
              </h1>
              <p className="text-[10px] text-gray-400">Our personal, cozy corner 🏡</p>
            </div>
          </div>

          <div className="text-xs text-rose-400 font-medium px-3.5 py-1.5 bg-rose-50 rounded-full border border-rose-100/30 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            Happy Together
          </div>
        </header>

        {/* Hero Section: Days Counter + Dates Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-start">
          {/* Left Column: Days counter widget */}
          <div className="lg:col-span-4 h-full">
            <RelationshipCounter 
              config={data.config} 
              onUpdateConfig={handleUpdateConfig} 
            />
          </div>

          {/* Right Column: Important dates grid */}
          <div className="lg:col-span-8 bg-white/40 border border-rose-100/30 rounded-3xl p-6 shadow-sm">
            <ImportantDates 
              dates={data.config.importantDates} 
              onUpdateDates={handleUpdateDates} 
            />
          </div>
        </div>

        {/* Interactive Workspace / Tabs Switcher */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex p-1.5 bg-rose-100/40 border border-rose-100/20 rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === "timeline"
                  ? "text-rose-600 bg-white shadow-sm"
                  : "text-gray-500 hover:text-rose-500"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Memory Lane
              {activeTab === "timeline" && (
                <motion.div
                  layoutId="active-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full hidden"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === "notes"
                  ? "text-rose-600 bg-white shadow-sm"
                  : "text-gray-500 hover:text-rose-500"
              }`}
            >
              <MessageSquareHeart className="w-4 h-4" />
              Love Notes
            </button>
          </div>
        </div>

        {/* Main Tab Workspace */}
        <main>
          <AnimatePresence mode="wait">
            {activeTab === "timeline" ? (
              <motion.div
                key="timeline-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <Timeline 
                  memories={data.memories} 
                  onAddMemory={handleAddMemory}
                  onLikeMemory={handleLikeMemory}
                  onDeleteMemory={handleDeleteMemory}
                />
              </motion.div>
            ) : (
              <motion.div
                key="notes-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <NotesBoard 
                  notes={data.notes} 
                  config={data.config}
                  onAddNote={handleAddNote}
                  onDeleteNote={handleDeleteNote}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Sweet Footer */}
        <footer className="text-center mt-16 pt-8 border-t border-rose-100/30 text-xs text-gray-400 font-sans">
          <p className="flex items-center justify-center gap-1.5 font-medium">
            With love, crafted for the most wonderful girl in the world 🌸
          </p>
          <p className="mt-1 text-[10px] opacity-70">© {new Date().getFullYear()} Our Fairytale • Cherish each other</p>
        </footer>

      </div>
    </div>
  );
}

