import { useState, useEffect, useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { X, RotateCcw } from "lucide-react";

interface CountdownToastProps {
  message: string;
  duration: number; // in seconds
  onUndo: () => void;
  onComplete: () => void;
  onDismiss: () => void;
}

export function CountdownToast({
  message,
  duration,
  onUndo,
  onComplete,
  onDismiss,
}: CountdownToastProps) {
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) return;

    startTimeRef.current = performance.now();

    const updateProgress = (currentTime: number) => {
      if (!startTimeRef.current) return;

      const elapsed = (currentTime - startTimeRef.current) / 1000; // seconds
      const newProgress = (elapsed / duration) * 100;

      if (newProgress >= 100) {
        setProgress(100);
        setIsActive(false);
        onComplete();
        return;
      }

      setProgress(newProgress);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, duration, onComplete]);

  const handleUndo = () => {
    setIsActive(false);
    onUndo();
  };

  const timeLeft = Math.max(0, duration - (progress / 100) * duration);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[320px] max-w-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{message}</p>
          <p className="text-xs text-gray-600 mt-1">
            {timeLeft > 0 ? (
              <>Auto-deleting in {Math.ceil(timeLeft)} second{Math.ceil(timeLeft) !== 1 ? 's' : ''}</>
            ) : (
              'Deleted'
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="p-1 h-auto"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {timeLeft > 0 && (
        <>
          <Progress value={progress} className="h-1 mb-3" />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              className="text-xs px-3 py-1"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Undo
            </Button>
          </div>
        </>
      )}
    </div>
  );
}