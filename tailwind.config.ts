import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Comprehensive Mobile-First Breakpoints
      screens: {
        'xs': '320px',    // Mobile Small (iPhone SE, older devices)
        'sm': '376px',    // Mobile Standard (iPhone 12/13/14, standard Android)
        'md': '415px',    // Mobile Large (Plus/Max models, large Android)
        'lg': '481px',    // Tablet Portrait
        'xl': '769px',    // Tablet Landscape
        '2xl': '1025px',  // Desktop
        '3xl': '1441px',  // Large Desktop
        '4xl': '1921px',  // Ultra Wide
        
        // Touch-specific breakpoints
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'no-touch': { 'raw': '(hover: hover) and (pointer: fine)' },
        
        // Orientation breakpoints
        'portrait': { 'raw': '(orientation: portrait)' },
        'landscape': { 'raw': '(orientation: landscape)' },
      },

      // TAG Brand Luxury Palette
      colors: {
        tag: {
          purple: {
            DEFAULT: '#0D0016',
            light: '#964DE0',
            secondary: '#7E69AB', 
            tertiary: '#6E59A5',
            deep: '#05000A',
          },
          gold: {
            DEFAULT: '#DBBB44',
            light: '#E8C547',
            dark: '#C8A63C',
          },
          cream: '#FCFAF7',
          gray: '#8E9196',
        },
        // Luxury color scheme shortcuts
        luxury: {
          primary: '#0D0016',
          accent: '#DBBB44',
          text: '#FCFAF7',
          muted: '#8E9196',
        }
      },

      // Mobile-Optimized Typography Scale
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }], // Mobile base
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '32px' }],
        '2xl': ['24px', { lineHeight: '36px' }],
        '3xl': ['30px', { lineHeight: '40px' }],
        '4xl': ['36px', { lineHeight: '48px' }],
        '5xl': ['48px', { lineHeight: '56px' }],
        '6xl': ['60px', { lineHeight: '68px' }],
        '7xl': ['72px', { lineHeight: '80px' }],
        '8xl': ['96px', { lineHeight: '104px' }],
        
        // Mobile-specific sizes
        'mobile-hero': ['28px', { lineHeight: '36px' }],
        'mobile-title': ['24px', { lineHeight: '32px' }],
        'mobile-subtitle': ['18px', { lineHeight: '28px' }],
        'mobile-body': ['16px', { lineHeight: '24px' }],
        'mobile-caption': ['14px', { lineHeight: '20px' }],
      },

      // Touch-Optimized Spacing
      spacing: {
        // Minimum touch target (44px)
        'touch-min': '44px',
        'touch-lg': '48px',
        'touch-xl': '52px',
        
        // Mobile-specific spacing
        'mobile-xs': '8px',
        'mobile-sm': '12px',
        'mobile-md': '16px',
        'mobile-lg': '20px',
        'mobile-xl': '24px',
        'mobile-2xl': '32px',
      },

      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'serif'],
      },

      // Enhanced Animations for Mobile Performance
      animation: {
        'gold-shimmer': 'goldShimmer 3s infinite',
        'elegant-fade-in': 'elegantFadeIn 0.8s ease-out forwards',
        'luxury-pulse': 'luxuryPulse 2s ease-in-out infinite',
        
        // Mobile-optimized animations (60fps)
        'mobile-slide-up': 'mobileSlideUp 0.3s ease-out forwards',
        'mobile-slide-down': 'mobileSlideDown 0.3s ease-out forwards',
        'mobile-fade-in': 'mobileFadeIn 0.2s ease-out forwards',
        'mobile-scale-in': 'mobileScaleIn 0.2s ease-out forwards',
        'mobile-bounce': 'mobileBounce 0.4s ease-out forwards',
        
        // Touch feedback animations
        'touch-feedback': 'touchFeedback 0.15s ease-out',
        'ripple-effect': 'rippleEffect 0.6s ease-out',
        
        // Gesture animations
        'swipe-left': 'swipeLeft 0.3s ease-out forwards',
        'swipe-right': 'swipeRight 0.3s ease-out forwards',
        'pull-refresh': 'pullRefresh 0.4s ease-out forwards',
      },

      keyframes: {
        goldShimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        elegantFadeIn: {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(20px) scale(0.95)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0) scale(1)' 
          },
        },
        luxuryPulse: {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 rgba(219, 187, 68, 0.4)' 
          },
          '50%': { 
            boxShadow: '0 0 0 10px rgba(219, 187, 68, 0)' 
          },
        },
        
        // Mobile-optimized keyframes
        mobileSlideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        mobileSlideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        mobileFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        mobileScaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        mobileBounce: {
          '0%': { transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        
        // Touch feedback
        touchFeedback: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        rippleEffect: {
          '0%': { transform: 'scale(0)', opacity: '0.6' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        
        // Gesture animations
        swipeLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        swipeRight: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pullRefresh: {
          '0%': { transform: 'translateY(-40px) scale(0.8)', opacity: '0' },
          '50%': { transform: 'translateY(0) scale(1.1)', opacity: '0.8' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
      },

      backgroundImage: {
        'gradient-luxury': 'linear-gradient(135deg, var(--tag-dark-purple) 0%, var(--tag-purple-deep) 100%)',
        'gradient-morning': 'linear-gradient(135deg, var(--tag-cream) 0%, rgba(219, 187, 68, 0.2) 30%, var(--tag-dark-purple) 100%)',
        'gradient-afternoon': 'linear-gradient(135deg, rgba(219, 187, 68, 0.3) 0%, var(--tag-secondary-purple) 50%, var(--tag-dark-purple) 100%)',
        'gradient-evening': 'linear-gradient(135deg, var(--tag-dark-purple) 0%, rgba(150, 77, 224, 0.2) 50%, var(--tag-purple-deep) 100%)',
        'gradient-night': 'linear-gradient(135deg, var(--tag-purple-deep) 0%, var(--tag-dark-purple) 50%, rgba(219, 187, 68, 0.1) 100%)',
      },

      backdropBlur: {
        'luxury': '20px',
        'mobile': '16px', // Reduced for mobile performance
      },

      boxShadow: {
        'luxury': '0 8px 32px rgba(13, 0, 22, 0.4)',
        'gold-glow': '0 4px 20px rgba(219, 187, 68, 0.3)',
        'elegant': '0 10px 40px rgba(13, 0, 22, 0.2)',
        
        // Mobile-optimized shadows
        'mobile-soft': '0 2px 8px rgba(13, 0, 22, 0.2)',
        'mobile-medium': '0 4px 12px rgba(13, 0, 22, 0.3)',
        'mobile-strong': '0 6px 16px rgba(13, 0, 22, 0.4)',
        'touch-feedback': '0 8px 24px rgba(219, 187, 68, 0.2)',
      },

      // Touch-optimized border radius
      borderRadius: {
        'touch': '12px',
        'touch-lg': '16px',
        'touch-xl': '20px',
      },

      // Mobile-specific z-index layers
      zIndex: {
        'mobile-header': '40',
        'mobile-modal': '50',
        'mobile-overlay': '45',
        'mobile-fab': '35',
        'mobile-toast': '55',
      },
    },
  },
  plugins: [],
};

export default config; 