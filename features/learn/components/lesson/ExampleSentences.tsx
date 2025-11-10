"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Volume2,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { TbMessageLanguage } from "react-icons/tb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import clsx from "clsx";

// --- INTERFACES ---
interface ExamplePair {
  vi: string;
  en?: string;
  audioUrl?: string | null;
  audioPath?: string | null;
}

interface ExampleSentencesProps {
  examples: ExamplePair[];
}

// --- CONSTANTS ---
const INITIAL_VISIBLE = 2; // Hiển thị 2 câu ban đầu

// --- MAIN COMPONENT ---
export default function ExampleSentences({ examples }: ExampleSentencesProps) {
  if (!examples || examples.length === 0) return null;

  const [expanded, setExpanded] = useState(false);
  const hasOverflow = examples.length > INITIAL_VISIBLE;

  return (
    <Card className="bg-white shadow-lg rounded-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-emerald-600" />
          <CardTitle className="text-xl font-bold text-slate-800 flex-1">
            Example Sentences
          </CardTitle>
          {hasOverflow && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              className="h-7 px-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100"
              aria-expanded={expanded}
            >
              {expanded ? (
                <span className="flex items-center gap-1 text-sm font-medium">
                 Less <ChevronUp className="h-4 w-4" />
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm font-medium">
                  More <ChevronDown className="h-4 w-4" />
                </span>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <TooltipProvider>
        <CardContent className="relative">
          <div className="space-y-3">
            {examples.map((example, index) => {
              const isHidden = !expanded && index >= INITIAL_VISIBLE;
              return (
                <div key={index} className={clsx(isHidden && "hidden")}>
                  <SentenceItem example={example} />
                </div>
              );
            })}
          </div>
          {hasOverflow && !expanded && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent rounded-b-xl" />
          )}
        </CardContent>
      </TooltipProvider>
    </Card>
  );
}

// --- SUB COMPONENT: SENTENCE ITEM ---
function SentenceItem({ example }: { example: ExamplePair }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(example.audioUrl ?? null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Resolve audio URL from path if not provided directly
  useEffect(() => {
    if (!example.audioUrl && example.audioPath) {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (baseUrl) {
        setResolvedUrl(`${baseUrl}/storage/v1/object/public/lesson-materials/${example.audioPath}`);
      }
    }
  }, [example.audioUrl, example.audioPath]);


  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };


  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current?.currentTime || 0);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current?.duration || 0);
  };
  
  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && audioRef.current) {
      const barWidth = progressBarRef.current.clientWidth;
      const clickOffset = event.nativeEvent.offsetX;
      const newTime = (clickOffset / barWidth) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="group rounded-lg border border-slate-200 bg-slate-50/70 p-4 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50/60">
      {/* Hidden Audio Element */}
      {resolvedUrl && (
        <audio
          ref={audioRef}
          src={resolvedUrl}
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />
      )}

      {/* Sentence Text */}
      <div className="mb-3 flex items-start gap-2">
        <p className="font-semibold text-emerald-800 text-base leading-relaxed flex-1">
          “{example.vi}”
        </p>
        {example.en && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Show English translation"
                className="h-7 w-7 p-0 shrink-0 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100"
              >
                <TbMessageLanguage className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm italic">{example.en}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Custom Audio Player */}
      {resolvedUrl && (
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={togglePlayPause}
            className="h-8 w-8 shrink-0 rounded-full text-emerald-700 bg-emerald-100 hover:bg-emerald-200"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <div className="flex-grow flex items-center gap-2">
            <div 
              ref={progressBarRef}
              onClick={handleSeek}
              className="w-full h-1.5 bg-emerald-200/80 rounded-full cursor-pointer"
            >
              <div
                style={{ width: `${progressPercentage}%` }}
                className="h-full bg-emerald-600 rounded-full transition-all"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
