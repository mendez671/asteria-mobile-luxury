'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const luxuryServices = [
  {
    icon: '🏨',
    title: 'Luxury Accommodations',
    description: 'Curated selection of world-class hotels and private residences',
    category: 'hospitality',
    tier: 'platinum',
    processing: false
  },
  {
    icon: '✈️',
    title: 'Private Aviation',
    description: 'Seamless private jet experiences and helicopter transfers',
    category: 'travel',
    tier: 'diamond',
    processing: false
  },
  {
    icon: '🍾',
    title: 'Fine Dining',
    description: 'Exclusive reservations at Michelin-starred establishments',
    category: 'dining',
    tier: 'platinum',
    processing: false
  },
  {
    icon: '🎭',
    title: 'Cultural Experiences',
    description: 'Private tours, exclusive events, and cultural immersions',
    category: 'entertainment',
    tier: 'gold',
    processing: false
  },
  {
    icon: '💎',
    title: 'Personal Shopping',
    description: 'Curated luxury goods and bespoke shopping experiences',
    category: 'lifestyle',
    tier: 'platinum',
    processing: false
  },
  {
    icon: '🏖️',
    title: 'Wellness & Spa',
    description: 'Restorative experiences at premier wellness destinations',
    category: 'wellness',
    tier: 'gold',
    processing: false
  }
];

export default function ServiceBadges() {
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const [services, setServices] = useState(luxuryServices);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleServiceClick = (category: string) => {
    console.log(`Selected service: ${category}`);
    // Handle service selection logic here
  };

  // TODO: Implement service processing functionality
  // const handleServiceProcess = (category: string) => {
  //   setServices(prev => prev.map(service => 
  //     service.category === category 
  //       ? { ...service, processing: true }
  //       : service
  //   ));
  //   setTimeout(() => {
  //     setServices(prev => prev.map(service => 
  //       service.category === category 
  //         ? { ...service, processing: false }
  //         : service
  //     ));
  //   }, 3000);
  // };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'diamond': return 'from-blue-400 to-purple-500';
      case 'platinum': return 'from-gray-300 to-gray-500';
      case 'gold': return 'from-tag-gold to-tag-gold-light';
      default: return 'from-tag-gold to-tag-gold-light';
    }
  };

  const getTierGlow = (tier: string) => {
    switch (tier) {
      case 'diamond': return 'shadow-blue-500/30';
      case 'platinum': return 'shadow-gray-400/30';
      case 'gold': return 'shadow-tag-gold/30';
      default: return 'shadow-tag-gold/30';
    }
  };

  // Touch gesture handlers for carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsSwipeMode(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipeMode) return;
    
    const touchCurrentX = e.touches[0].clientX;
    const diff = touchStartX - touchCurrentX;
    
    if (Math.abs(diff) > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwipeMode) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentSlide < Math.ceil(services.length / 3) - 1) {
        setCurrentSlide(prev => prev + 1);
      } else if (diff < 0 && currentSlide > 0) {
        setCurrentSlide(prev => prev - 1);
      }
    }
    
    setIsSwipeMode(false);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => 
      prev < Math.ceil(services.length / 3) - 1 ? prev + 1 : 0
    );
  };

  const prevSlide = () => {
    setCurrentSlide(prev => 
      prev > 0 ? prev - 1 : Math.ceil(services.length / 3) - 1
    );
  };

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif text-tag-cream mb-6 stagger-1 fade-in-elegant">
            Curated Experiences That Transcend
          </h2>
          <p className="text-xl text-tag-neutral-gray max-w-3xl mx-auto leading-relaxed stagger-2 fade-in-elegant">
            True luxury is the energy that emerges when exceptional craftsmanship, meaningful connections, and personal values align. 
            Each experience is curated to spark that non-negotiable resonance within you.
          </p>
        </motion.div>

        {/* Enhanced Service Grid with Gesture Navigation */}
        <div className="relative">
          {/* Navigation Arrows for Desktop */}
          <div className="hidden md:flex absolute inset-y-0 left-0 items-center z-10">
            <button
              onClick={prevSlide}
              className="min-h-touch-min p-3 rounded-full bg-tag-dark-purple/80 border border-tag-gold/30 ml-4 interactive-luxury transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-tag-gold" />
            </button>
          </div>
          
          <div className="hidden md:flex absolute inset-y-0 right-0 items-center z-10">
            <button
              onClick={nextSlide}
              className="min-h-touch-min p-3 rounded-full bg-tag-dark-purple/80 border border-tag-gold/30 mr-4 interactive-luxury transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-5 h-5 text-tag-gold" />
            </button>
          </div>

          {/* Service Cards Container */}
          <div 
            ref={containerRef}
            className="carousel-container overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <motion.div
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${currentSlide * 100}%)`
              }}
            >
              {Array.from({ length: Math.ceil(services.length / 3) }).map((_, slideIndex) => (
                <div
                  key={slideIndex}
                  className="w-full flex-shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4"
                >
                  {services
                    .slice(slideIndex * 3, (slideIndex + 1) * 3)
                    .map((service, index) => (
                    <motion.div
                      key={service.category}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      className={`service-category-animated group relative ${slideIndex === currentSlide ? 'carousel-slide' : ''}`}
                      onMouseEnter={() => setHoveredService(service.category)}
                      onMouseLeave={() => setHoveredService(null)}
                    >
                      <div
                        onClick={() => handleServiceClick(service.category)}
                        className={`service-badge glass p-6 rounded-2xl border transition-all duration-300 hover:border-tag-gold/60 ${
                          index === 1 ? 'border-tag-gold/40 bg-gradient-to-br from-tag-gold/10 via-tag-dark-purple/80 to-tag-light-purple/10' 
                          : 'border-tag-light-purple/30'
                        } ${service.processing ? 'animate-pulse bg-tag-gold/10' : ''} ${getTierGlow(service.tier)}`}
                      >
                        {/* Service Processing Overlay */}
                        {service.processing && (
                          <div className="absolute inset-0 bg-tag-dark-purple/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
                            <div className="tag-spinner mb-4"></div>
                            <p className="text-tag-gold text-sm">Processing your request...</p>
                            <div className="progress-bar-luxury w-32 mt-2">
                              <div className="progress-fill"></div>
                            </div>
                          </div>
                        )}

                        {/* Tier Badge */}
                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getTierColor(service.tier)} text-white shadow-lg ${getTierGlow(service.tier)}`}>
                          {service.tier.toUpperCase()}
                        </div>

                        {/* Service Icon with Enhanced Animation */}
                        <div className={`text-6xl mb-6 floating-luxury ${hoveredService === service.category ? 'champagne-celebration' : ''}`}>
                          {service.icon}
                        </div>

                        {/* Service Content */}
                        <h3 className="text-xl font-serif text-tag-cream mb-4 group-hover:text-tag-gold transition-colors">
                          {service.title}
                        </h3>
                        
                        <p className="text-tag-neutral-gray leading-relaxed mb-6">
                          {service.description}
                        </p>

                        {/* Interactive CTA */}
                        <div className="flex items-center justify-between">
                          <span className="text-tag-gold font-medium group-hover:shimmer-gold transition-all">
                            Explore Service
                          </span>
                          <div className="w-8 h-8 rounded-full border-2 border-tag-gold/30 flex items-center justify-center group-hover:border-tag-gold group-hover:bg-tag-gold/10 transition-all">
                            →
                          </div>
                        </div>

                        {/* Hover Enhancement Effects */}
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-br from-tag-gold/5 to-transparent rounded-2xl"></div>
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tag-gold to-transparent opacity-50"></div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Slide Indicators */}
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: Math.ceil(services.length / 3) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-tag-gold scale-125'
                    : 'bg-tag-gold/30 hover:bg-tag-gold/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="min-h-touch-min bg-gradient-to-r from-tag-gold to-tag-gold-light text-tag-dark-purple px-8 py-4 rounded-xl font-medium interactive-luxury transition-all duration-200 hover:scale-105 active:scale-95">
              Curate Your Experience
            </button>
            <button className="min-h-touch-min glass px-8 py-4 rounded-xl font-medium text-tag-cream border border-tag-gold/30 interactive-luxury transition-all duration-200 hover:scale-105 active:scale-95">
              Discover Your Energy
            </button>
          </div>

          {/* Swipe Hint for Mobile */}
          <div className="mt-6 md:hidden">
            <div className="text-tag-neutral-gray text-sm flex items-center justify-center gap-2">
              <span>Swipe to explore</span>
              <div className="swipe-indicator">👆</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 