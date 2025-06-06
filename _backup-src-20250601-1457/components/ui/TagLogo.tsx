interface TagLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function TagLogo({ className = '', size = 'md', showText = true }: TagLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Placeholder for TAG logo - replace with actual logo when provided */}
      <div className={`${sizeClasses[size]} rounded bg-tag-gold/20 border border-tag-gold/30 flex items-center justify-center`}>
        <span className="text-tag-gold text-sm font-bold">TAG</span>
      </div>
      
      {showText && (
        <span className="text-tag-cream text-sm font-medium tracking-wide">
          Energy. Connection. Transcendence.
        </span>
      )}
    </div>
  );
} 