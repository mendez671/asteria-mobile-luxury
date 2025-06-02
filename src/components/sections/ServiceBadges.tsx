'use client';

import { useState } from 'react';
import { LUXURY_SERVICES, ServiceCardData } from '@/data/services';
import PromptsModal from '@/components/ui/PromptsModal';

interface ServiceBadgesProps {
  onPromptSelect?: (prompt: string) => void;
}

export default function ServiceBadges({ onPromptSelect }: ServiceBadgesProps) {
  const [modalService, setModalService] = useState<ServiceCardData | null>(null);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'DIAMOND': return 'bg-blue-500/20 text-blue-300';
      case 'PLATINUM': return 'bg-gray-300/20 text-gray-200';
      case 'GOLD': return 'bg-tag-gold/20 text-tag-gold';
      default: return 'bg-tag-gold/20 text-tag-gold';
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
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LUXURY_SERVICES.map((service) => (
              <div
                key={service.id}
                className="bg-tag-purple/30 border border-tag-gold/20 rounded-2xl p-6 
                          cursor-pointer transition-all duration-300 
                          hover:border-tag-gold/40 hover:bg-tag-purple/40 service-card
                          hover:transform hover:scale-[1.02]"
                onClick={() => handleCardClick(service)}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{service.icon}</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTierColor(service.tier)}`}>
                    {service.tier}
                  </span>
                </div>

                {/* Card Content */}
                <h3 className="text-tag-cream font-medium text-lg mb-2">{service.title}</h3>
                <p className="text-tag-cream/70 text-sm mb-4">{service.description}</p>

                {/* Explore Button */}
                <div className="flex items-center justify-between">
                  <span className="text-tag-gold text-sm font-medium">
                    Explore Service
                  </span>
                  <div className="w-8 h-8 border border-tag-gold/40 rounded-full 
                                  flex items-center justify-center group-hover:border-tag-gold
                                  transition-all duration-300">
                    <svg className="w-4 h-4 text-tag-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Prompts Modal */}
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