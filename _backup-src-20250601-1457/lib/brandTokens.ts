// TAG Brand Design System Tokens
// Centralized source of truth for all brand styling

export const tagBrandTokens = {
  colors: {
    // Primary Brand Colors
    primary: '#d4af37',        // TAG Gold
    primaryLight: '#f7dc6f',   // TAG Gold Light
    primaryDark: '#b8941f',    // TAG Gold Dark
    
    // Secondary Colors
    dark: '#0f172a',           // TAG Dark Purple
    purple: '#581c87',         // TAG Purple
    lightPurple: '#3B1E5C',    // TAG Light Purple
    
    // Neutral Colors
    white: '#ffffff',
    cream: '#F5F5DC',          // TAG Cream
    neutralGray: '#9CA3AF',    // TAG Neutral Gray
    
    // Status Colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  
  fonts: {
    primary: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace',
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
  },
  
  borderRadius: {
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px'
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    luxury: '0 8px 32px rgba(212, 175, 55, 0.3)',
    glow: '0 0 20px rgba(212, 175, 55, 0.5)'
  },
  
  animations: {
    duration: {
      fast: '0.15s',
      normal: '0.3s',
      slow: '0.5s',
      slower: '0.75s'
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      luxury: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070,
    videoIntro: 9999
  }
};

// Utility functions for consistent styling
export const createGradient = (from: string, to: string, direction = '45deg') => 
  `linear-gradient(${direction}, ${from}, ${to})`;

export const createBoxShadow = (color: string, opacity = 0.3, blur = 32) => 
  `0 8px ${blur}px rgba(${color}, ${opacity})`;

export const createGlassEffect = (opacity = 0.1) => ({
  background: `rgba(255, 255, 255, ${opacity})`,
  backdropFilter: 'blur(10px)',
  border: `1px solid rgba(255, 255, 255, ${opacity * 2})`
});

// Component-specific token sets
export const componentTokens = {
  button: {
    primary: {
      background: createGradient(tagBrandTokens.colors.primary, tagBrandTokens.colors.primaryLight),
      color: tagBrandTokens.colors.dark,
      shadow: tagBrandTokens.shadows.luxury,
      borderRadius: tagBrandTokens.borderRadius.lg
    },
    secondary: {
      background: createGlassEffect(0.1),
      color: tagBrandTokens.colors.cream,
      border: `1px solid ${tagBrandTokens.colors.primary}30`,
      borderRadius: tagBrandTokens.borderRadius.lg
    }
  },
  
  card: {
    glass: {
      ...createGlassEffect(0.05),
      borderRadius: tagBrandTokens.borderRadius['2xl'],
      border: `1px solid ${tagBrandTokens.colors.primary}20`
    }
  },
  
  input: {
    primary: {
      background: createGlassEffect(0.05),
      border: `1px solid ${tagBrandTokens.colors.primary}30`,
      borderRadius: tagBrandTokens.borderRadius.xl,
      color: tagBrandTokens.colors.cream
    }
  }
};

export default tagBrandTokens; 