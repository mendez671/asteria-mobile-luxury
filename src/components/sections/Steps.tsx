'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    number: "01",
    title: "Choose Service",
    description: "Select from our curated collection of luxury experiences tailored to your aspirations.",
    icon: "🎯"
  },
  {
    number: "02", 
    title: "Start Chat",
    description: "Engage with our AI-powered concierge to refine your vision and clarify your desires.",
    icon: "💬"
  },
  {
    number: "03",
    title: "Get Results", 
    description: "Receive your personalized luxury experience, crafted with precision and delivered with excellence.",
    icon: "✨"
  }
];

export default function Steps() {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Three Steps to Luxury
            </span>
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Your journey from aspiration to experience, simplified into three elegant steps.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative group"
            >
              {/* Connection Line (hidden on mobile, visible on md+) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent z-0 group-hover:from-cyan-400/70 transition-all duration-300" />
              )}
              
              {/* Step Card */}
              <div className="relative z-10 text-center">
                {/* Step Number */}
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6 
                               bg-gradient-to-br from-slate-800/60 to-slate-900/60 
                               border-2 border-cyan-500/30 rounded-full
                               group-hover:border-cyan-400/60 group-hover:scale-110
                               transition-all duration-300 backdrop-blur-sm
                               shadow-lg shadow-cyan-500/10 group-hover:shadow-cyan-500/20">
                  <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {step.number}
                  </span>
                </div>

                {/* Step Icon */}
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>

                {/* Step Content */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors duration-300">
                  {step.title}
                </h3>
                
                <p className="text-slate-300 leading-relaxed text-sm max-w-xs mx-auto">
                  {step.description}
                </p>

                {/* Hover Effect Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16"
        >
          <button className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 border border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105">
            Start Your Journey
          </button>
        </motion.div>
      </div>
    </section>
  );
} 