"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, RotateCw, RotateCcw, Loader2 } from "lucide-react";
import { TbMessageLanguage } from "react-icons/tb";
import { Button } from "@/shared/components/ui/button";
import { Slider } from "@/shared/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

type WordTimestamp = {
  s: number; // start time in milliseconds
  e: number; // end time in milliseconds  
  t: string; // text/word
};

type Line = {
  speaker?: string;           // "Lan", "Minh", ...
  vi: string;                 // câu tiếng Việt
  en?: string;                // câu tiếng Anh (hiển thị trong tooltip)
  start?: number;             // giây bắt đầu trong sprite (tuỳ chọn)
  end?: number;               // giây kết thúc trong sprite (tuỳ chọn)
  audioUrl?: string | null;   // nếu phát file riêng từng câu (tuỳ chọn)
  highlight_words?: string[]; // gợi ý highlight (tuỳ chọn)
  words?: WordTimestamp[];    // word-level timestamps
};

type SpeakerStyle = {
  bg: string;
  border: string;
  text: string;
  tail: string;
};

const DEFAULT_PALETTE: SpeakerStyle[] = [
  // 0: Xanh (Lan)
  {
    bg: "bg-[#E8F2FF]",
    border: "border-[#bcd9ff]",
    text: "text-[#0b5bbf]",
    tail: "bg-[#E8F2FF] border-[#bcd9ff]",
  },
  // 1: Vàng (Minh)
  {
    bg: "bg-[#FFF6CC]",
    border: "border-[#f1dc86]",
    text: "text-[#8a6a00]",
    tail: "bg-[#FFF6CC] border-[#f1dc86]",
  },
  // 2+: fallback nhạt
  {
    bg: "bg-[#F1F5F9]",
    border: "border-[#d7dee7]",
    text: "text-[#0f172a]",
    tail: "bg-[#F1F5F9] border-[#d7dee7]",
  },
];

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, words?: string[]) {
  if (!text || !words?.length) return text;
  const pattern = words.filter(Boolean).map(escapeRegex).join("|");
  if (!pattern) return text;
  const re = new RegExp(`(${pattern})`, "gi");
  return text.split(re).map((part, i) =>
    i % 2
      ? <mark key={i} className="bg-yellow-200/70 rounded px-0.5">{part}</mark>
      : <span key={i}>{part}</span>
  );
}

function renderWordsWithTiming(
  text: string, 
  words: WordTimestamp[] | undefined, 
  currentWordIndex: number | null,
  onWordClick: (wordIndex: number, startTime: number) => void,
  defaultHighlight?: string[]
) {
  if (!words || words.length === 0) {
    return highlightText(text, defaultHighlight);
  }

  return (
    <div className="inline leading-relaxed">
      {words.map((word, index) => (
        <span
          key={index}
          onClick={() => onWordClick(index, word.s / 1000)}
          className={`cursor-pointer transition-all duration-200 rounded-sm px-0.5 -mx-0.5 ${
            currentWordIndex === index
              ? 'bg-violet-100 text-violet-900 font-semibold shadow-sm'
              : currentWordIndex !== null && index < currentWordIndex
              ? 'text-gray-400'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
          style={{
            textDecoration: currentWordIndex === index ? 'underline' : 'none',
            textDecorationColor: currentWordIndex === index ? '#6D28D9' : 'transparent',
            textUnderlineOffset: '3px'
          }}
        >
          {word.t}
          {index < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </div>
  );
}

// Binary search for performance
function findCurrentLine(lines: any[], currentTimeMs: number): number | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.start !== undefined && line.end !== undefined) {
      const startMs = line.start * 1000;
      const endMs = line.end * 1000;
      if (currentTimeMs >= startMs && currentTimeMs <= endMs) {
        return i;
      }
    }
  }
  return null;
}

function findCurrentWord(words: WordTimestamp[], currentTimeMs: number, lineStartMs = 0): number | null {
  for (let i = 0; i < words.length; i++) {
    const absStart = lineStartMs + words[i].s; // relative to line start
    const absEnd = lineStartMs + words[i].e;
    if (currentTimeMs >= absStart && currentTimeMs <= absEnd) return i;
  }
  return null;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function DialoguePlayer({
  title,
  spriteUrl,                    // để undefined nếu dùng audio từng câu
  lines,
  meta,                         // chứa word_index
  defaultHighlight = [],
  maxVisibleLines = 10,         // chỉ đặt max-height & scrollbar khi > ngưỡng
  speakerPalette = DEFAULT_PALETTE,
}: {
  title?: string;
  spriteUrl?: string;
  lines: Line[];
  meta?: { word_index?: Record<string, WordTimestamp[]> };
  defaultHighlight?: string[];
  maxVisibleLines?: number;
  speakerPalette?: SpeakerStyle[];
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  
  // Audio player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0); // total audio duration (seconds)
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [hasOverflow, setHasOverflow] = useState(false);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const timerRef = useRef<any>(null);
  const playbackRates = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5];
  const animationFrameRef = useRef<number | undefined>(undefined);
  // When playing a specific line from the sprite we keep its end boundary (seconds)
  const lineEndRef = useRef<number | null>(null);

  // speaker theo thứ tự xuất hiện
  const speakerOrder = useMemo(() => {
    const seen = new Set<string>();
    const arr: string[] = [];
    for (const l of lines) {
      const key = (l.speaker ?? "").trim();
      if (!key) continue;
      if (!seen.has(key)) {
        seen.add(key);
        arr.push(key);
      }
    }
    return arr;
  }, [lines]);

  const speakerIdx = useMemo(() => {
    const m = new Map<string, number>();
    speakerOrder.forEach((name, i) => m.set(name, i));
    return m;
  }, [speakerOrder]);

  const prepared = useMemo(
    () =>
      lines.map((ln) => {
        const duration =
          ln.start != null && ln.end != null ? Math.max(0, (ln.end as number) - (ln.start as number)) : undefined;
        return {
          ...ln,
          _duration: duration,
          _hl: ln.highlight_words?.length ? ln.highlight_words : defaultHighlight,
          _speakerIndex: speakerIdx.get(ln.speaker ?? "") ?? 0,
        };
      }),
    [lines, speakerIdx, defaultHighlight]
  );

  const useSprite = !!spriteUrl && prepared.every((l) => l._duration != null && l.start != null);

  // Fallback duration derived from sprite cues (max end time) when metadata not available
  const fallbackDuration = useMemo(() => {
    if (!useSprite) return 0;
    let maxEnd = 0;
    for (const l of prepared) {
      if (typeof l.end === 'number' && l.end > maxEnd) maxEnd = l.end;
    }
    return maxEnd; // seconds
  }, [useSprite, prepared]);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      audioRef.current?.pause();
    };
  }, []);

  // kiểm tra overflow + fade
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const overflow = el.scrollHeight > el.clientHeight;
      setHasOverflow(overflow);
      setShowTopFade(el.scrollTop > 4);
      setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [prepared.length]);

  // Force initial overflow check after render
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = scrollRef.current;
      if (el) {
        const overflow = el.scrollHeight > el.clientHeight;
        if (overflow !== hasOverflow) {
          setHasOverflow(overflow);
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [prepared, hasOverflow]);

  const stopCurrent = () => {
    clearTimeout(timerRef.current);
    audioRef.current?.pause();
    setPlayingIndex(null);
  lineEndRef.current = null;
  };

  const playLine = (idx: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const line = prepared[idx];
    
    try {
      if (useSprite && line.start !== undefined && line.end !== undefined) {
        // Sprite audio: play only this slice then pause
        audio.currentTime = Math.max(0, line.start);
        lineEndRef.current = line.end; // seconds
        audio.play().then(() => setPlayingIndex(idx)).catch(err => {
          console.error('Play sprite line error:', err);
          setPlayingIndex(null);
          lineEndRef.current = null;
        });
      } else if (line.audioUrl) {
        // Individual audio file per line (whole file is the line)
        if (audio.src !== line.audioUrl) {
          audio.src = line.audioUrl;
        }
        lineEndRef.current = null; // full file
        audio.currentTime = 0;
        audio.play().then(() => setPlayingIndex(idx)).catch(err => {
          console.error('Play line file error:', err);
          setPlayingIndex(null);
        });
      }
    } catch (error) {
      console.error('Error playing line:', error);
      setPlayingIndex(null);
    }
  };

  // Audio player controls
  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      setIsLoading(true);
      lineEndRef.current = null;
      setPlayingIndex(null);
      audio.play().catch(console.error);
    }
  }, [isPlaying]);

  const skipTime = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    // if metadata not loaded yet, ignore
    if (!isFinite(audio.duration) || audio.duration === 0) return;
    const target = audio.currentTime + seconds;
    const newTime = Math.max(0, Math.min(target, audio.duration));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const changePlaybackRate = useCallback(() => {
    const currentIndex = playbackRates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % playbackRates.length;
    const newRate = playbackRates[nextIndex];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  }, [playbackRate, playbackRates]);

  const setSpecificPlaybackRate = useCallback((newRate: number) => {
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  }, []);

  const seekToTime = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!isFinite(audio.duration) || audio.duration === 0) return;
    const clamped = Math.max(0, Math.min(time, audio.duration));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, []);

  const handleWordClick = useCallback((wordIndex: number, startTime: number) => {
    // startTime expected as absolute seconds in full audio timeline
    seekToTime(startTime);
  }, [seekToTime]);

  // volume slider will pass value 0..100
  const changeVolume = useCallback((newVolume: number[]) => {
    const volPercent = newVolume[0];
    const vol = Math.max(0, Math.min(100, volPercent)) / 100;
    setVolume(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  }, []);

  // Track current word highlighting with animation frame for smoothness
  const updateCurrentWord = useCallback(() => {
    if (!meta?.word_index) return;
    const timeMs = currentTime * 1000;
    const foundLineIndex = findCurrentLine(prepared, timeMs);
    let foundWordIndex = null;
    if (foundLineIndex !== null) {
      const lineId = (foundLineIndex + 1).toString();
      const wordsInLine = meta.word_index[lineId];
      const lineStartMs = prepared[foundLineIndex].start ? prepared[foundLineIndex].start * 1000 : 0;
      if (wordsInLine) foundWordIndex = findCurrentWord(wordsInLine, timeMs, lineStartMs);
    }
    setCurrentLineIndex(foundLineIndex);
    setCurrentWordIndex(foundWordIndex);
  }, [meta?.word_index, prepared, currentTime]);

  // Keyboard controls for accessibility
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Only handle if focused element is not an input
      if (document.activeElement?.tagName.toLowerCase() === 'input') return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'j':
          e.preventDefault();
          skipTime(-3);
          break;
        case 'l':
          e.preventDefault();
          skipTime(3);
          break;
        case 'arrowleft':
          e.preventDefault();
          skipTime(-3);
          break;
        case 'arrowright':
          e.preventDefault();
          skipTime(3);
          break;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [togglePlayPause, skipTime]);

  // High-frequency updates for smooth word highlighting
  useEffect(() => {
    const updateFrame = () => {
      updateCurrentWord();
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateFrame);
      }
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateFrame);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updateCurrentWord]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateDuration = () => {
      let d = audio.duration; // seconds
      if (!isFinite(d) || d <= 0) {
        if (fallbackDuration > 0) d = fallbackDuration;
      }
      if (isFinite(d) && d > 0) {
        setDuration(d);
      }
    };

    const handleLoadedMetadata = () => {
      updateDuration();
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      if (!isDragging) setCurrentTime(audio.currentTime);
      // Stop automatically at end of selected line
      if (playingIndex !== null && lineEndRef.current != null) {
        if (audio.currentTime >= (lineEndRef.current - 0.01)) { // small epsilon
          audio.pause();
          lineEndRef.current = null;
          setPlayingIndex(null);
          setIsPlaying(false);
        }
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    
    const handlePause = () => setIsPlaying(false);
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentLineIndex(null);
      setCurrentWordIndex(null);
      lineEndRef.current = null;
      setPlayingIndex(null);
    };

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      updateDuration();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    // Set initial volume and playback rate
    audio.volume = volume;
    audio.playbackRate = playbackRate;

    // Try initial duration resolution (covers cached scenarios)
    updateDuration();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [spriteUrl, playbackRate, volume, isDragging, playingIndex, fallbackDuration]);

  const scrollClasses = "max-h-[60vh] overflow-y-auto scroll-area pr-1";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        {/* Karaoke-style Audio Player */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          {/* Hidden audio element */}
          <audio 
            ref={audioRef} 
            preload="auto" 
            src={spriteUrl} 
            crossOrigin="anonymous"
            className="hidden"
          />
          
          {/* Main controls row */}
          <div className="flex items-center gap-4 mb-4">
            {/* Large Play/Pause button */}
            <div className="relative">
              <Button
                onClick={togglePlayPause}
                className="w-14 h-14 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg relative"
                size="icon"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-7 h-7" />
                ) : (
                  <Play className="w-7 h-7 ml-1" />
                )}
              </Button>
            </div>

            {/* Progress area */}
            <div className="flex-1 mx-4">
              {/* Title/Speaker */}
              {title && (
                <div className="text-center mb-2">
                  <h4 className="text-sm font-medium text-gray-700 tracking-wide">{title}</h4>
                </div>
              )}
              
              {/* Progress bar with timecodes */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-gray-500 min-w-[2.5rem]">
                  {formatTime(currentTime)}
                </span>
                
                <div className="flex-1">
                  <Slider
                    value={[duration > 0 ? Math.min(currentTime, duration) : currentTime]}
                    max={duration > 0 ? duration : 1}
                    step={0.05}
                    onValueChange={([value]) => {
                      setIsDragging(true);
                      setCurrentTime(value);
                    }}
                    onValueCommit={([value]) => {
                      seekToTime(value);
                      setIsDragging(false);
                    }}
                    className="w-full cursor-pointer"
                  />
                </div>
                
                <span className="text-sm font-mono text-gray-500 min-w-[2.5rem]">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Volume control */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                >
                  <Volume2 className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-24 p-2" align="end">
                <div className="flex flex-col items-center h-24 justify-center">
                  <Slider
                    value={[Math.round(volume * 100)]}
                    max={100}
                    step={1}
                    onValueChange={changeVolume}
                    orientation="vertical"
                    className="h-24"
                  />
                  <div className="text-[10px] text-center mt-1 text-gray-500 w-full">
                    {Math.round(volume * 100)}%
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Secondary controls row */}
          <div className="flex items-center justify-center gap-6">
            {/* Skip back */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skipTime(-3)}
                  className="w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Skip back 3s</TooltipContent>
            </Tooltip>

            {/* Playback speed */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={changePlaybackRate}
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-2 text-sm font-medium min-w-[3rem]"
                >
                  {playbackRate}×
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Available speeds:</div>
                  <div className="flex gap-2 justify-center text-sm">
                    {playbackRates.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setSpecificPlaybackRate(rate)}
                        className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          rate === playbackRate
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        {rate}×
                      </button>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Skip forward */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skipTime(3)}
                  className="w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                >
                  <RotateCw className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Skip forward 3s</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Karaoke Text Panel */}
        {currentLineIndex !== null && (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="text-lg leading-relaxed text-center">
              {(() => {
                const line = prepared[currentLineIndex];
                const words = meta?.word_index?.[String(currentLineIndex + 1)];
                const lineStart = line.start ?? 0; // seconds
                return renderWordsWithTiming(
                  line.vi,
                  words,
                  currentWordIndex,
                  (idx) => {
                    const w = words?.[idx];
                    if (!w) return;
                    const absoluteSeconds = lineStart + w.s / 1000;
                    handleWordClick(idx, absoluteSeconds);
                  },
                  line.highlight_words?.length ? line.highlight_words : defaultHighlight
                );
              })()}
            </div>
            
            {/* Speaker name */}
            <div className="text-center mt-3">
              <span className="text-sm text-gray-500 font-medium">
                {prepared[currentLineIndex].speaker || 'Speaker'}
              </span>
            </div>
            
            {/* English translation */}
            {prepared[currentLineIndex].en && (
              <div className="text-center mt-2 text-sm text-gray-600 italic">
                "{prepared[currentLineIndex].en}"
              </div>
            )}
          </div>
        )}

        {/* Vùng hội thoại cuộn + fade */}
        <div className={`relative ${scrollClasses}`} ref={scrollRef}>
          {hasOverflow && (
            <>
              <div
                className={`pointer-events-none absolute left-0 right-0 top-0 h-6 bg-gradient-to-b from-white to-transparent transition-opacity ${
                  showTopFade ? "opacity-100" : "opacity-0"
                }`}
              />
              <div
                className={`pointer-events-none absolute left-0 right-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent transition-opacity ${
                  showBottomFade ? "opacity-100" : "opacity-0"
                }`}
              />
            </>
          )}

          <div className="space-y-4">
            {prepared.map((ln, i) => {
              const idx = ln._speakerIndex;               // index speaker theo dữ liệu thực
              const sideLeft = idx % 2 === 0;             // 0 trái, 1 phải, 2+ fallback theo index
              const palette = speakerPalette[idx] ?? speakerPalette[speakerPalette.length - 1];

              return (
                <div key={i} className={`flex ${sideLeft ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`relative max-w-[92%] rounded-xl border p-3 shadow-sm ${palette.bg} ${palette.border} ${
                      sideLeft ? "rounded-tl-none" : "rounded-tr-none"
                    }`}
                  >
                    {/* Tail */}
                    <span
                      className={`absolute top-3 ${sideLeft ? "-left-1.5" : "-right-1.5"} h-3 w-3 rotate-45 ${palette.bg} z-[-1]`}
                      aria-hidden
                    />

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">
                        {ln.speaker ?? (sideLeft ? "A" : "B")}
                      </span>

                      {/* Nút play từng câu (sprite hoặc audioUrl) */}
                      {(useSprite || ln.audioUrl) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => (playingIndex === i ? (stopCurrent()) : playLine(i))}
                          title="Play line"
                          className="ml-1"
                        >
                          {playingIndex === i ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                      )}

                      {/* Nút translate: Languages + Tooltip hiển thị TRÊN icon */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="p-1 h-7 w-7 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                            aria-label="See English translation"
                            onMouseEnter={() => setHoverIndex(i)}
                            onMouseLeave={() => setHoverIndex((cur) => (cur === i ? null : cur))}
                            disabled={!ln.en}
                          >
                            <TbMessageLanguage className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>

                        {ln.en && hoverIndex === i ? (
                          <TooltipContent
                            side="top"
                            align="center"
                            sideOffset={8}
                            className="max-w-[28rem] whitespace-pre-wrap leading-relaxed text-sm"
                          >
                            <p className="italic text-gray-700">“{ln.en}”</p>
                          </TooltipContent>
                        ) : null}
                      </Tooltip>
                    </div>

                    <div className={`mt-1 ${palette.text} font-medium`}>
                      {currentLineIndex === i ? (
                        // Show word-level highlighting when this line is playing
                        (() => {
                          const words = meta?.word_index?.[String(i + 1)];
                          const lineStart = ln.start ?? 0;
                          return renderWordsWithTiming(
                            ln.vi,
                            words,
                            currentWordIndex,
                            (idx) => {
                              const w = words?.[idx];
                              if (!w) return;
                              const absSeconds = lineStart + w.s / 1000;
                              handleWordClick(idx, absSeconds);
                            },
                            ln.highlight_words?.length ? ln.highlight_words : defaultHighlight
                          );
                        })()
                      ) : (
                        // Show normal highlighting when not playing
                        highlightText(ln.vi, ln.highlight_words?.length ? ln.highlight_words : defaultHighlight)
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollbar mảnh, chỉ hiện khi hover */}
        <style jsx global>{`
          .scroll-area {
            scrollbar-gutter: stable both-edges;
            scroll-behavior: smooth;
            scrollbar-width: none; /* Firefox */
          }
          .scroll-area:hover {
            scrollbar-width: thin;
          }
          .scroll-area::-webkit-scrollbar {
            width: 0px;
            height: 0px;
          }
          .scroll-area:hover::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .scroll-area::-webkit-scrollbar-track {
            background: transparent;
          }
          .scroll-area::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.0);
            border-radius: 999px;
          }
          .scroll-area:hover::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.35);
          }
          .scroll-area::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.5);
          }
        `}</style>
      </div>
    </TooltipProvider>
  );
}
