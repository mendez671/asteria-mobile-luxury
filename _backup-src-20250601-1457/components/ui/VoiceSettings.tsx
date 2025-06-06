'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceSettingsProps {
  onSettingsChange?: (settings: VoiceSettings) => void;
  className?: string;
}

export interface VoiceSettings {
  enabled: boolean;
  autoPlay: boolean;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  volume: number;
}

const VOICE_OPTIONS = [
  { value: 'nova', label: 'Nova', description: 'Warm & Professional' },
  { value: 'alloy', label: 'Alloy', description: 'Balanced & Clear' },
  { value: 'echo', label: 'Echo', description: 'Friendly & Approachable' },
  { value: 'fable', label: 'Fable', description: 'Expressive & Dynamic' },
  { value: 'onyx', label: 'Onyx', description: 'Deep & Confident' },
  { value: 'shimmer', label: 'Shimmer', description: 'Bright & Energetic' },
] as const;

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: true,
  autoPlay: false,
  voice: 'nova',
  volume: 0.8,
};

export function VoiceSettings({ onSettingsChange, className = '' }: VoiceSettingsProps) {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  const [isOpen, setIsOpen] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('asteria-voice-settings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      } catch (error) {
        console.error('Failed to parse voice settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage and notify parent
  useEffect(() => {
    localStorage.setItem('asteria-voice-settings', JSON.stringify(settings));
    onSettingsChange?.(settings);
  }, [settings, onSettingsChange]);

  const updateSetting = <K extends keyof VoiceSettings>(
    key: K,
    value: VoiceSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`relative ${className}`}>
      {/* Settings Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
          settings.enabled
            ? 'bg-tag-gold/20 text-tag-gold hover:bg-tag-gold/30'
            : 'bg-tag-neutral-gray/20 text-tag-neutral-gray hover:bg-tag-neutral-gray/30'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {settings.enabled ? (
          <Volume2 className="w-4 h-4" />
        ) : (
          <VolumeX className="w-4 h-4" />
        )}
      </motion.button>

      {/* Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 top-10 w-72 bg-tag-dark-purple/95 backdrop-blur-sm rounded-xl border border-tag-gold/20 p-4 shadow-2xl z-50"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-tag-cream font-semibold">Voice Settings</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-tag-neutral-gray hover:text-tag-cream transition-colors"
              >
                ×
              </button>
            </div>

            {/* Voice Enable/Disable */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-tag-cream text-sm">Enable Voice</label>
                <motion.button
                  onClick={() => updateSetting('enabled', !settings.enabled)}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${
                    settings.enabled ? 'bg-tag-gold' : 'bg-tag-neutral-gray/30'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                    animate={{ left: settings.enabled ? '1.5rem' : '0.125rem' }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.button>
              </div>

              {settings.enabled && (
                <>
                  {/* Auto-play */}
                  <div className="flex items-center justify-between">
                    <label className="text-tag-cream text-sm">Auto-play Responses</label>
                    <motion.button
                      onClick={() => updateSetting('autoPlay', !settings.autoPlay)}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${
                        settings.autoPlay ? 'bg-tag-gold' : 'bg-tag-neutral-gray/30'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                        animate={{ left: settings.autoPlay ? '1.5rem' : '0.125rem' }}
                        transition={{ duration: 0.2 }}
                      />
                    </motion.button>
                  </div>

                  {/* Voice Selection */}
                  <div>
                    <label className="text-tag-cream text-sm mb-2 block">Voice</label>
                    <select
                      value={settings.voice}
                      onChange={(e) => updateSetting('voice', e.target.value as VoiceSettings['voice'])}
                      className="w-full bg-tag-dark-purple/50 border border-tag-gold/20 rounded-lg px-3 py-2 text-tag-cream text-sm focus:outline-none focus:border-tag-gold/50 transition-colors"
                    >
                      {VOICE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} - {option.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Volume Control */}
                  <div>
                    <label className="text-tag-cream text-sm mb-2 block">
                      Volume ({Math.round(settings.volume * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.volume}
                      onChange={(e) => updateSetting('volume', parseFloat(e.target.value))}
                      className="w-full h-2 bg-tag-neutral-gray/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* Test Voice Button */}
                  <motion.button
                    onClick={() => {
                      // This would trigger a test message
                      const testAudio = new Audio();
                      fetch('/api/tts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          text: "Hello! This is how I sound with your current settings.",
                          voice: settings.voice
                        })
                      })
                      .then(res => res.blob())
                      .then(blob => {
                        testAudio.src = URL.createObjectURL(blob);
                        testAudio.volume = settings.volume;
                        testAudio.play();
                      })
                      .catch(console.error);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-tag-gold to-tag-gold-light text-tag-dark-purple rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Test Voice
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 