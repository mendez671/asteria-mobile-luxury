'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

interface AudioPlayerProps {
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  autoPlay?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  className?: string;
}

export function AudioPlayer({
  text,
  voice = 'nova',
  autoPlay = false,
  onStart,
  onEnd,
  className = ''
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate audio when component mounts or text changes
  useEffect(() => {
    if (text && text.trim()) {
      generateAudio();
    }
  }, [text, voice]);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && audioUrl && !isPlaying) {
      playAudio();
    }
  }, [audioUrl, autoPlay]);

  const generateAudio = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Set up audio element
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }

    } catch (err) {
      setError('Failed to generate voice. Text will remain available.');
      console.error('TTS generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
      onStart?.();
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isLoading) return;
    
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    onEnd?.();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error && !audioUrl) {
    return null; // Hide completely if audio generation failed
  }

  return (
    <motion.div
      className={`inline-flex items-center gap-3 bg-tag-dark-purple/40 backdrop-blur-sm rounded-xl p-3 border border-tag-gold/20 ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Play/Pause Button */}
      <motion.button
        onClick={togglePlay}
        disabled={isLoading || !audioUrl}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
          isLoading || !audioUrl
            ? 'bg-tag-neutral-gray/30 cursor-not-allowed'
            : 'bg-gradient-to-r from-tag-gold to-tag-gold-light hover:from-tag-gold-light hover:to-tag-gold cursor-pointer shadow-sm hover:shadow-md'
        }`}
        whileHover={!isLoading && audioUrl ? { scale: 1.05 } : {}}
        whileTap={!isLoading && audioUrl ? { scale: 0.95 } : {}}
      >
        {isLoading ? (
          <div className="w-3 h-3 border border-tag-dark-purple border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4 text-tag-dark-purple" />
        ) : (
          <Play className="w-4 h-4 text-tag-dark-purple ml-0.5" />
        )}
      </motion.button>

      {/* Progress Bar */}
      {audioUrl && duration > 0 && (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-16 h-1 bg-tag-gold/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-tag-gold to-tag-gold-light"
              style={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <span className="text-xs text-tag-gold/60 font-mono min-w-0">
            {formatTime(currentTime)}
          </span>
        </div>
      )}

      {/* Mute Button */}
      {audioUrl && (
        <motion.button
          onClick={toggleMute}
          className="w-6 h-6 rounded-full flex items-center justify-center text-tag-gold/60 hover:text-tag-gold transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isMuted ? (
            <VolumeX className="w-3 h-3" />
          ) : (
            <Volume2 className="w-3 h-3" />
          )}
        </motion.button>
      )}

      {/* Voice indicator */}
      <div className="text-xs text-tag-gold/40 font-light tracking-wide">
        Asteria
      </div>
    </motion.div>
  );
} 