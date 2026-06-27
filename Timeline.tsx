import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, Camera, Mic, Square, Play, Pause, Trash2, Heart, 
  Sparkles, Plus, Image as ImageIcon, X, AlertCircle, RefreshCw, Volume2, Check
} from "lucide-react";
import { Memory } from "../types";

interface TimelineProps {
  memories: Memory[];
  onAddMemory: (payload: {
    title: string;
    description: string;
    date: string;
    photoBase64?: string;
    audioBase64?: string;
    audioDuration?: number;
  }) => Promise<void>;
  onLikeMemory: (id: string) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
}

export default function Timeline({ memories, onAddMemory, onLikeMemory, onDeleteMemory }: TimelineProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Media attachments
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Audio Playback State for Memory Cards
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({});
  const [playbackDurations, setPlaybackDurations] = useState<Record<string, { current: number, total: number }>>({});
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioIntervalRef = useRef<any>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // File Upload Handlers
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      setPhotoBase64(reader.result as string);
    };
    reader.onerror = () => {
      setErrorMsg("Error reading file.");
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoBase64(null);
  };

  // Recording Handlers
  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);

        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to access microphone. Please check browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioDuration(recordingSeconds);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const removeAudio = () => {
    setAudioBase64(null);
    setAudioBlob(null);
    setAudioDuration(0);
    setRecordingSeconds(0);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (activeAudioIntervalRef.current) clearInterval(activeAudioIntervalRef.current);
    };
  }, []);

  // Submit Memory Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      await onAddMemory({
        title,
        description,
        date,
        photoBase64: photoBase64 || undefined,
        audioBase64: audioBase64 || undefined,
        audioDuration: audioBase64 ? audioDuration : undefined
      });
      // Reset form
      setTitle("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      removePhoto();
      removeAudio();
      setIsAdding(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error saving memory.");
    } finally {
      setLoading(false);
    }
  };

  // Memory Like Handler with floating heart effect
  const [poppingHearts, setPoppingHearts] = useState<Record<string, boolean>>({});
  const handleLike = async (id: string) => {
    setPoppingHearts(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setPoppingHearts(prev => ({ ...prev, [id]: false }));
    }, 1000);
    try {
      await onLikeMemory(id);
    } catch (err) {
      console.error(err);
    }
  };

  // Custom Audio Player controls for memory cards
  const playAudio = (id: string, url: string) => {
    // If playing the same audio, pause it
    if (playingAudioId === id) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      setPlayingAudioId(null);
      if (activeAudioIntervalRef.current) clearInterval(activeAudioIntervalRef.current);
      return;
    }

    // Stop currently playing audio if any
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      if (activeAudioIntervalRef.current) clearInterval(activeAudioIntervalRef.current);
    }

    // Create new audio element
    const audio = new Audio(url);
    activeAudioRef.current = audio;
    setPlayingAudioId(id);

    audio.play();

    // Track playback updates
    activeAudioIntervalRef.current = setInterval(() => {
      if (audio.ended) {
        setPlayingAudioId(null);
        setPlaybackProgress(prev => ({ ...prev, [id]: 0 }));
        clearInterval(activeAudioIntervalRef.current);
      } else {
        const progress = (audio.currentTime / audio.duration) * 100;
        setPlaybackProgress(prev => ({ ...prev, [id]: progress }));
        setPlaybackDurations(prev => ({
          ...prev,
          [id]: { current: audio.currentTime, total: audio.duration || 0 }
        }));
      }
    }, 100);
  };

  // Format recording timer: mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div id="timeline-container" className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold font-sans text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-rose-500" />
          Memory Lane
        </h2>
        {!isAdding && (
          <button
            id="add-memory-btn"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-full transition-all duration-300 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Capture Moment
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div
            key="add-memory-form"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/80 backdrop-blur-md border border-rose-100 rounded-3xl p-6 mb-8 shadow-sm"
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-rose-50 pb-2">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  New Precious Moment
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-sans border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">Moment Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Spontaneous coffee trip in the rain"
                    className="w-full px-4 py-2.5 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 bg-gray-50/50 text-sm font-sans"
                  />
                </div>

                <div className="md:col-span-4 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 bg-gray-50/50 text-sm font-sans"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">Your Story</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Describe what made this moment unique..."
                  className="w-full h-24 px-4 py-3 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 bg-gray-50/50 text-sm font-sans resize-none"
                />
              </div>

              {/* Media Upload Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-rose-50/50 pt-4">
                {/* Photo Upload Card */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-gray-400" />
                    Couple Photo (optional)
                  </span>

                  {!photoPreview ? (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-rose-300 hover:bg-rose-50/10 cursor-pointer rounded-2xl h-28 transition-all duration-300">
                      <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500 font-sans">Choose or drag a photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden h-28 border border-rose-100">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Voice Note Recording Card */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    <Mic className="w-3.5 h-3.5 text-gray-400" />
                    Voice Note (optional)
                  </span>

                  {!audioBase64 ? (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl h-28 p-2">
                      {!isRecording ? (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-rose-500 hover:bg-rose-50/10 rounded-xl transition-all"
                        >
                          <Mic className="w-6 h-6 text-rose-400 animate-pulse mb-1" />
                          <span className="text-xs text-gray-500 font-sans">Record voice note</span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                            <span className="text-sm font-mono font-bold text-gray-700">
                              {formatTime(recordingSeconds)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="flex items-center gap-1.5 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-[10px] font-bold shadow-sm mt-1 transition-colors"
                          >
                            <Square className="w-2.5 h-2.5" />
                            Stop
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between border border-rose-100 bg-rose-50/30 p-3.5 rounded-2xl h-28">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-rose-500 text-white rounded-xl shadow-sm">
                          <Volume2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-700 block">Voice recorded!</span>
                          <span className="text-[10px] font-mono text-rose-500 mt-0.5 block">
                            Duration: {formatTime(audioDuration)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={startRecording}
                          className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Re-record"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={removeAudio}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          title="Delete"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-rose-50">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-xs text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-5 py-2 text-xs text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-sm font-semibold transition-colors"
                  disabled={loading}
                >
                  <Check className="w-4 h-4" />
                  {loading ? "Uploading..." : "Save"}
                </button>
              </div>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Timeline display */}
      {memories.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-rose-100 bg-white/40 rounded-3xl">
          <Sparkles className="w-10 h-10 text-rose-200 mx-auto mb-3 stroke-1" />
          <p className="text-sm text-gray-500 font-sans max-w-sm mx-auto">
            Nothing here yet. Create your first memory, upload a sweet photo, and record a cute voice note! 💞
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-rose-100 flex flex-col gap-8">
          <AnimatePresence initial={false}>
            {memories.map((m) => {
              const dateObj = new Date(m.date);
              const formattedDate = dateObj.toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric"
              });

              const isPlaying = playingAudioId === m.id;
              const progress = playbackProgress[m.id] || 0;
              const durations = playbackDurations[m.id] || { current: 0, total: m.audioDuration || 0 };

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
                  className="relative group bg-white/70 backdrop-blur-md rounded-3xl border border-rose-100/50 shadow-sm hover:shadow-md hover:border-rose-200 transition-all duration-300"
                >
                  {/* Timeline point */}
                  <span className="absolute -left-[31px] sm:-left-[35px] top-6 w-4 h-4 rounded-full bg-rose-400 border-4 border-white ring-2 ring-rose-100 flex items-center justify-center z-10 transition-transform group-hover:scale-125 duration-300" />

                  {/* Header Badge: Date */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-rose-50 rounded-full border border-rose-100/30 text-[10px] font-sans font-medium text-rose-500">
                    <Calendar className="w-3 h-3" />
                    <span>{formattedDate}</span>
                  </div>

                  <div className="p-5 sm:p-6">
                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-800 tracking-tight leading-snug pr-24 group-hover:text-rose-500 transition-colors">
                      {m.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 font-sans mt-3 leading-relaxed whitespace-pre-wrap">
                      {m.description}
                    </p>

                    {/* Shared Photo */}
                    {m.photoUrl && (
                      <div className="mt-4 rounded-2xl overflow-hidden border border-rose-100 bg-gray-50/50 max-h-96">
                        <img
                          src={m.photoUrl}
                          alt={m.title}
                          className="w-full object-cover max-h-96 hover:scale-[1.02] transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Voice Message Player (Custom Interactive UI) */}
                    {m.audioUrl && (
                      <div className="mt-4 p-4 bg-rose-50/40 rounded-2xl border border-rose-100/40 flex items-center gap-4">
                        <button
                          onClick={() => playAudio(m.id, m.audioUrl!)}
                          className={`p-3.5 rounded-full text-white shadow-sm transition-all duration-300 ${
                            isPlaying 
                              ? "bg-rose-500 hover:bg-rose-600 scale-105 ring-4 ring-rose-100" 
                              : "bg-rose-400 hover:bg-rose-500 scale-100"
                          }`}
                        >
                          {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                        </button>

                        <div className="flex-grow flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-rose-500">
                            <span>{formatTime(Math.floor(durations.current))}</span>
                            <span>{formatTime(Math.floor(durations.total || m.audioDuration || 0))}</span>
                          </div>

                          {/* Progress bar slider */}
                          <div className="h-1.5 w-full bg-rose-100 rounded-full overflow-hidden relative">
                            <div 
                              style={{ width: `${progress}%` }} 
                              className="h-full bg-rose-400 transition-all duration-100 rounded-full"
                            />
                          </div>

                          {/* Animated Voice Waveform when playing */}
                          {isPlaying ? (
                            <div className="flex items-center gap-0.5 h-3 mt-1 px-1">
                              {[...Array(24)].map((_, i) => (
                                <motion.span
                                  key={i}
                                  animate={{
                                    height: [4, Math.random() * 12 + 4, 4]
                                  }}
                                  transition={{
                                    duration: 0.5 + Math.random() * 0.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                  className="w-0.5 bg-rose-400/80 rounded-full"
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-0.5 h-3 mt-1 px-1 opacity-40">
                              {[...Array(24)].map((_, i) => (
                                <span
                                  key={i}
                                  style={{ height: `${2 + (i % 3) * 2}px` }}
                                  className="w-0.5 bg-rose-300 rounded-full"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-5 pt-4 border-t border-rose-50/50 flex items-center justify-between">
                      {/* Likes with floating popups */}
                      <div className="relative">
                        <button
                          onClick={() => handleLike(m.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-500 transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${m.likes > 0 ? "fill-rose-400 text-rose-400" : ""}`} />
                          <span>{m.likes || 0}</span>
                        </button>

                        {/* Heart Burst Popup */}
                        <AnimatePresence>
                          {poppingHearts[m.id] && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5, y: 0 }}
                              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5], y: -40 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="absolute top-0 left-2 pointer-events-none text-rose-500"
                            >
                              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this memory? 🥺")) {
                            onDeleteMemory(m.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 duration-300"
                        title="Delete memory"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
