'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LUXURY_SERVICES, ServiceCardData } from '@/data/services';
import PromptsModal from '@/components/ui/PromptsModal';

interface ServiceBadgesProps {
  onPromptSelect?: (prompt: string) => void;
}

export default function ServiceBadges({ onPromptSelect }: ServiceBadgesProps) {
  const [modalService, setModalService] = useState<ServiceCardData | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'DIAMOND': return 'bg-gradient-to-r from-blue-400 to-purple-500 text-white';
      case 'PLATINUM': return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 'GOLD': return 'bg-gradient-to-r from-tag-gold to-tag-gold-light text-black';
      default: return 'bg-gradient-to-r from-tag-gold to-tag-gold-light text-black';
    }
  };

  const getTierGlow = (tier: string) => {
    switch (tier) {
      case 'DIAMOND': return 'shadow-blue-500/40';
      case 'PLATINUM': return 'shadow-gray-400/40';
      case 'GOLD': return 'shadow-tag-gold/40';
      default: return 'shadow-tag-gold/40';
    }
  };

  const handleCardClick = (service: ServiceCardData) => {
    setModalService(service);
  };

  const handlePromptSelect = (prompt: string) => {
    if (onPromptSelect) {
      onPromptSelect(prompt);
    }
    setModalService(null);
  };

  return (
    <>
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Curated Experiences
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Each service represents the pinnacle of luxury, designed to transcend the ordinary and create 
              moments that resonate with your deepest aspirations.
            </p>
          </motion.div>

          {/* Enhanced Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {LUXURY_SERVICES.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative group"
                onMouseEnter={() => setHoveredCard(service.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* ENHANCED: Crystal Glass Card with Multi-layer Depth */}
                <div
                  className="glass-card relative h-full p-8 rounded-2xl cursor-pointer 
                            transition-all duration-500 hover:scale-[1.02]
                            backdrop-blur-xl border border-white/10
                            bg-gradient-to-br from-slate-900/40 via-slate-800/30 to-slate-900/40
                            hover:from-slate-800/50 hover:via-slate-700/40 hover:to-slate-800/50
                            hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10"
                  onClick={() => handleCardClick(service)}
                >
                  {/* Enhanced Tier Badge */}
                  <div className={`absolute top-4 right-4 px-4 py-2 rounded-full text-xs font-bold ${getTierColor(service.tier)} ${getTierGlow(service.tier)} shadow-lg`}>
                    {service.tier}
                  </div>

                  {/* Service Icon with Enhanced Animation */}
                  <div className={`text-5xl mb-6 transition-all duration-300 ${hoveredCard === service.id ? 'scale-110 animate-pulse' : ''}`}>
                    {service.icon}
                  </div>

                  {/* Enhanced Card Content */}
                  <h3 className="text-white font-bold text-xl mb-3 group-hover:text-cyan-400 transition-colors duration-300">
                    {service.title}
                  </h3>
                  
                  <p className="text-slate-300 leading-relaxed mb-6 text-sm">
                    {service.description}
                  </p>

                  {/* Enhanced Interactive CTA */}
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-semibold group-hover:text-cyan-300 transition-colors duration-300">
                      Explore Service
                    </span>
                    <div className="w-10 h-10 border-2 border-cyan-500/60 rounded-full 
                                    flex items-center justify-center group-hover:border-cyan-400
                                    group-hover:bg-cyan-500/10 transition-all duration-300
                                    group-hover:shadow-lg group-hover:shadow-cyan-500/30">
                      <svg className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-all duration-300 group-hover:translate-x-0.5" 
                           fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>

                  {/* Enhanced Hover Effects */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    {/* Subtle glow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-purple-500/5 rounded-2xl"></div>
                    {/* Top edge highlight */}
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"></div>
                    {/* Corner accent */}
                    <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-cyan-400/40 rounded-tl-lg"></div>
                  </div>
                </div>

                {/* Background Card Shadow for Depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 to-slate-800/20 rounded-2xl transform translate-x-1 translate-y-1 -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-300"></div>
              </motion.div>
            ))}
          </div>

          {/* Enhanced Call-to-Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 text-center"
          >
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 border border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105">
                Begin Your Journey
              </button>
              <button className="px-8 py-4 bg-slate-800/40 text-cyan-300 rounded-xl font-semibold border border-cyan-500/30 hover:bg-slate-800/60 hover:border-cyan-400/50 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-cyan-500/10">
                Discover More
              </button>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Enhanced Prompts Modal */}
      <PromptsModal
        isOpen={!!modalService}
        onClose={() => setModalService(null)}
        prompts={modalService?.prompts || []}
        onPromptSelect={handlePromptSelect}
        serviceTitle={modalService?.title || ''}
      />
    </>
  );
} 