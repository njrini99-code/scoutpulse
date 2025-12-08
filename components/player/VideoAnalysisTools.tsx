'use client';

import { useState, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize, Edit3, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface Annotation {
  id: string;
  timestamp: number;
  note: string;
  type: 'highlight' | 'note' | 'technique';
}

interface VideoAnalysisToolsProps {
  videoUrl: string;
  videoId: string;
}

export function VideoAnalysisTools({ videoUrl, videoId }: VideoAnalysisToolsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const addAnnotation = () => {
    if (videoRef.current) {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        timestamp: videoRef.current.currentTime,
        note: '',
        type: 'note'
      };
      setAnnotations([...annotations, newAnnotation]);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Annotations overlay */}
        {showAnnotations && annotations.length > 0 && (
          <div className="absolute top-4 right-4 space-y-2">
            {annotations
              .filter(ann => Math.abs(ann.timestamp - currentTime) < 2)
              .map(ann => (
                <div
                  key={ann.id}
                  className="bg-yellow-500/90 text-black px-3 py-1 rounded text-sm"
                >
                  {ann.note || `Note at ${formatTime(ann.timestamp)}`}
                </div>
              ))}
          </div>
        )}

        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={duration}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex items-center justify-between text-white text-sm">
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              <div className="flex items-center gap-2">
                <select
                  value={playbackRate}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value);
                    setPlaybackRate(rate);
                    if (videoRef.current) {
                      videoRef.current.playbackRate = rate;
                    }
                  }}
                  className="bg-black/50 text-white rounded px-2 py-1 text-xs"
                >
                  <option value="0.25">0.25x</option>
                  <option value="0.5">0.5x</option>
                  <option value="1">1x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = Math.max(0, currentTime - 10);
              }
            }}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = Math.min(duration, currentTime + 10);
              }
            }}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={addAnnotation}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Add Note
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnnotations(!showAnnotations)}
          >
            {showAnnotations ? 'Hide' : 'Show'} Annotations
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.requestFullscreen();
                setIsFullscreen(true);
              }
            }}
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Annotations list */}
      {annotations.length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Annotations</h4>
          <div className="space-y-2">
            {annotations.map(ann => (
              <div
                key={ann.id}
                className="flex items-center justify-between p-2 rounded bg-muted"
              >
                <div>
                  <span className="text-sm font-mono">{formatTime(ann.timestamp)}</span>
                  {ann.note && <p className="text-sm">{ann.note}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = ann.timestamp;
                    }
                  }}
                >
                  Jump to
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
