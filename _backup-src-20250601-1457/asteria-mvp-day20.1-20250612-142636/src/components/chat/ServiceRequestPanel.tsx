// ===============================
// PHASE 5.2: SERVICE REQUEST MANAGEMENT PANEL
// Dedicated panel for tracking service requests and workflows
// ===============================

'use client';

import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';

interface ServiceRequest {
  id: string;
  category: string;
  status: string;
  urgency: string;
  timestamp?: Date;
  description?: string;
}

interface WorkflowInfo {
  id: string;
  type: string;
  status: string;
  progress?: number;
  estimatedCompletion?: Date;
}

interface ServiceRequestPanelProps {
  serviceRequests: ServiceRequest[];
  activeWorkflows: WorkflowInfo[];
  className?: string;
}

export function ServiceRequestPanel({ 
  serviceRequests, 
  activeWorkflows, 
  className = '' 
}: ServiceRequestPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'workflows'>('requests');

  const hasActivity = serviceRequests.length > 0 || activeWorkflows.length > 0;

  if (!hasActivity) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
      case 'in_progress':
      case 'processing':
      case 'initiated':
        return <ArrowPathIcon className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'failed':
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />;
      default:
        return <ClockIcon className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'text-red-300 bg-red-500/20 border-red-400/30';
      case 'medium':
        return 'text-yellow-300 bg-yellow-500/20 border-yellow-400/30';
      default:
        return 'text-green-300 bg-green-500/20 border-green-400/30';
    }
  };

  return (
    <div className={`backdrop-blur-md bg-white/5 border border-white/10 rounded-lg ${className}`}>
      {/* Panel Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {serviceRequests.length > 0 && (
              <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">
                {serviceRequests.length} Request{serviceRequests.length !== 1 ? 's' : ''}
              </span>
            )}
            {activeWorkflows.length > 0 && (
              <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs">
                {activeWorkflows.length} Workflow{activeWorkflows.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <span className="text-white text-sm font-medium">Activity Center</span>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="w-4 h-4 text-white/70" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-white/70" />
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-white/10">
          {/* Tab Navigation */}
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeTab === 'requests'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Service Requests ({serviceRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('workflows')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeTab === 'workflows'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Active Workflows ({activeWorkflows.length})
            </button>
          </div>

          {/* Content Area */}
          <div className="p-3 pt-0 max-h-60 overflow-y-auto">
            {activeTab === 'requests' && (
              <div className="space-y-2">
                {serviceRequests.length === 0 ? (
                  <div className="text-center text-white/50 text-sm py-4">
                    No active service requests
                  </div>
                ) : (
                  serviceRequests.map((request) => (
                    <div 
                      key={request.id}
                      className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <span className="text-white font-medium text-sm font-mono">
                            {request.id}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs border ${getUrgencyColor(request.urgency)}`}>
                          {request.urgency}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-white/70">Category:</span>
                          <span className="text-white">{request.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Status:</span>
                          <span className="text-white">{request.status}</span>
                        </div>
                        {request.timestamp && (
                          <div className="text-xs text-white/50 mt-2">
                            Created: {request.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'workflows' && (
              <div className="space-y-2">
                {activeWorkflows.length === 0 ? (
                  <div className="text-center text-white/50 text-sm py-4">
                    No active workflows
                  </div>
                ) : (
                  activeWorkflows.map((workflow) => (
                    <div 
                      key={workflow.id}
                      className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(workflow.status)}
                          <span className="text-white font-medium text-sm">
                            {workflow.type}
                          </span>
                        </div>
                        <span className="text-white/70 text-xs font-mono">
                          {workflow.id}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-white/70">Status:</span>
                          <span className="text-white">{workflow.status}</span>
                        </div>
                        {workflow.progress !== undefined && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-white/70">Progress:</span>
                              <span className="text-white">{workflow.progress}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1.5">
                              <div 
                                className="bg-blue-400 h-1.5 rounded-full transition-all duration-300" 
                                style={{ width: `${workflow.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        {workflow.estimatedCompletion && (
                          <div className="text-xs text-white/50 mt-2">
                            ETA: {workflow.estimatedCompletion.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 