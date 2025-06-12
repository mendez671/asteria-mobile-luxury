// ===============================
// DEMO: UI ENHANCEMENT PREVIEW
// Shows how enhanced UI components look with real API data
// ===============================

'use client';

import React from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon,
  ArrowPathIcon,
  SparklesIcon,
  ChartBarIcon
} from '@heroicons/react/24/solid';

interface DemoData {
  agent: {
    confidence: number;
    journeyPhase: string;
    nextActions: Array<{
      type: string;
      priority: string;
      data: { description: string; order: number };
    }>;
    processingTime: number;
    autonomous: boolean;
    intent: string;
  };
  urgency: string;
  service_type: string;
  show_book_button: boolean;
}

export function DemoEnhancementPreview({ data }: { data: DemoData }) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-400 bg-green-500/20 border-green-400/30';
    if (confidence >= 0.4) return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
    return 'text-orange-400 bg-orange-500/20 border-orange-400/30';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      default: return 'text-green-400 bg-green-500/20 border-green-400/30';
    }
  };

  const getJourneyProgress = (phase: string) => {
    const phases = ['discovery', 'information_gathering', 'detailed_discussion', 'confirmation', 'execution', 'follow_up'];
    const currentIndex = phases.indexOf(phase);
    return currentIndex >= 0 ? ((currentIndex + 1) / phases.length) * 100 : 0;
  };

  return (
    <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-md">
      <div className="flex items-center gap-2 mb-3">
        <SparklesIcon className="w-5 h-5 text-purple-400" />
        <span className="text-white font-medium">Enhanced UI Preview</span>
        <span className="text-white/50 text-sm">(Live API Data)</span>
      </div>

      {/* Agent Performance Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getConfidenceColor(data.agent.confidence)}`}>
          <ChartBarIcon className="w-4 h-4" />
          <div className="text-xs">
            <div className="font-medium">Confidence</div>
            <div>{Math.round(data.agent.confidence * 100)}%</div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300">
          <ClockIcon className="w-4 h-4" />
          <div className="text-xs">
            <div className="font-medium">Response</div>
            <div>{data.agent.processingTime}ms</div>
          </div>
        </div>
      </div>

      {/* Journey Phase Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-white/70">
          <span>{data.agent.journeyPhase.replace('_', ' ')} Phase</span>
          <span>{Math.round(getJourneyProgress(data.agent.journeyPhase))}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${getJourneyProgress(data.agent.journeyPhase)}%` }}
          />
        </div>
      </div>

      {/* Service Classification */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
          <span className="text-white/70 text-sm">
            {data.service_type.replace('_', ' ')}
          </span>
        </div>
        <div className={`px-2 py-1 rounded text-xs border ${getUrgencyColor(data.urgency)}`}>
          {data.urgency}
        </div>
      </div>

      {/* Agent Status */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        <span className="text-emerald-300 text-sm font-medium">
          {data.agent.autonomous ? 'Autonomous Processing' : 'Manual Mode'}
        </span>
        <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
      </div>

      {/* Next Actions Preview */}
      {data.agent.nextActions && data.agent.nextActions.length > 0 && (
        <div className="space-y-2">
          <div className="text-white/70 text-sm font-medium">Suggested Next Steps:</div>
          {data.agent.nextActions.slice(0, 2).map((action, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              <span className="text-white/80 text-xs">
                {action.data.description}
              </span>
            </div>
          ))}
          {data.show_book_button && (
            <div className="pt-2">
              <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 text-sm">
                ✨ Confirm & Book Service
              </button>
            </div>
          )}
        </div>
      )}

      {/* Demo Workflow Indicators */}
      <div className="border-t border-white/10 pt-3 space-y-2">
        <div className="text-white/50 text-xs">Demo: Future Workflow Enhancements</div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs">
            <ArrowPathIcon className="w-3 h-3 animate-spin" />
            Travel Search
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-xs">
            🎫 SR-{Date.now().toString().slice(-4)}
          </div>
        </div>
      </div>
    </div>
  );
} 