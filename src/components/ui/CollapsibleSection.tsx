'use client';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
}

export default function CollapsibleSection({ 
  title, 
  children, 
  defaultCollapsed = true,
  className = "" 
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`border border-tag-gold/20 rounded-2xl overflow-hidden ${className}`}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-6 py-4 bg-tag-purple/20 hover:bg-tag-purple/30 transition-all duration-300 flex items-center justify-between group"
      >
        <h3 className="text-lg font-medium text-tag-cream">{title}</h3>
        {isCollapsed ? (
          <ChevronDownIcon className="w-5 h-5 text-tag-gold group-hover:text-tag-gold-light transition-colors" />
        ) : (
          <ChevronUpIcon className="w-5 h-5 text-tag-gold group-hover:text-tag-gold-light transition-colors" />
        )}
      </button>
      
      <div className={`transition-all duration-300 overflow-hidden ${
        isCollapsed ? 'max-h-0' : 'max-h-[1000px]'
      }`}>
        <div className="p-6 bg-tag-purple/10">
          {children}
        </div>
      </div>
    </div>
  );
} 