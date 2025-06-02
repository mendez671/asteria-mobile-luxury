import CollapsibleSection from '@/components/ui/CollapsibleSection';

export default function HowItWorksSection() {
  return (
    <CollapsibleSection 
      title="How It Works" 
      defaultCollapsed={true}
      className="mb-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-tag-gold rounded-full flex items-center justify-center text-tag-purple font-bold text-xl mb-4 mx-auto">
            1
          </div>
          <h4 className="text-tag-cream font-medium mb-2">Request</h4>
          <p className="text-tag-cream/70 text-sm">
            Tell Asteria what you need or click any service below to get started instantly.
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-tag-gold rounded-full flex items-center justify-center text-tag-purple font-bold text-xl mb-4 mx-auto">
            2
          </div>
          <h4 className="text-tag-cream font-medium mb-2">We Handle</h4>
          <p className="text-tag-cream/70 text-sm">
            Our concierge team coordinates with exclusive partners to fulfill your request.
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-tag-gold rounded-full flex items-center justify-center text-tag-purple font-bold text-xl mb-4 mx-auto">
            3
          </div>
          <h4 className="text-tag-cream font-medium mb-2">Enjoy</h4>
          <p className="text-tag-cream/70 text-sm">
            Receive curated options within hours. We handle every detail.
          </p>
        </div>
      </div>
    </CollapsibleSection>
  );
} 