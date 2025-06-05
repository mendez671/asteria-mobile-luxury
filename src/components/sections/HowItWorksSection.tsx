'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from 'lucide-react';

export default function HowItWorksSection() {
  const [isOpen, setIsOpen] = useState(false);

  const steps = [
    {
      number: "01",
      title: "Request",
      description: "Share your vision with our AI concierge or select from our curated experiences",
      icon: "💎",
      color: "from-cyan-400 to-blue-500",
      delay: 0.1
    },
    {
      number: "02", 
      title: "We Handle",
      description: "Our network of luxury partners collaborates to craft your perfect experience",
      icon: "⚡",
      color: "from-purple-400 to-indigo-500", 
      delay: 0.2
    },
    {
      number: "03",
      title: "Enjoy",
      description: "Receive bespoke solutions within hours, with every detail meticulously arranged",
      icon: "✨",
      color: "from-amber-400 to-orange-500",
      delay: 0.3
    }
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Crystal Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-2 h-2 bg-cyan-400/30 rounded-full animate-pulse" />
        <div className="absolute bottom-20 right-1/3 w-1 h-1 bg-purple-400/40 rounded-full animate-ping" />
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-amber-400/20 rounded-full animate-bounce" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Enhanced Collapsible Header */}
        <motion.div
          className="relative max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Glass Morphism Container */}
          <div className="relative backdrop-blur-xl bg-slate-900/40 border border-cyan-500/20 rounded-3xl overflow-hidden shadow-2xl">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-amber-500/5 animate-pulse" />
            
            {/* Header Button */}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="relative w-full px-8 py-6 flex items-center justify-between group transition-all duration-500 hover:bg-slate-800/30"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Title Section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 p-[2px] group-hover:from-cyan-300 group-hover:to-purple-400 transition-all duration-500">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                      <span className="text-cyan-300 text-xl font-bold">?</span>
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-400/50 rounded-full animate-ping" />
                </div>
                
                <div className="text-left">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">
                    How It Works
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Discover the journey to luxury
                  </p>
                </div>
              </div>

              {/* Animated Chevron */}
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="relative"
              >
                <div className="relative p-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 group-hover:from-cyan-400/30 group-hover:to-purple-400/30 transition-all duration-500">
                  <ChevronDownIcon className="w-6 h-6 text-cyan-300 group-hover:text-white transition-colors duration-300" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                </div>
              </motion.div>
            </motion.button>

            {/* Expandable Content */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  {/* Crystal Divider */}
                  <div className="relative px-8">
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
                    <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-400/60 rounded-full" />
                  </div>

                  {/* Steps Content */}
                  <div className="px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {steps.map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 30, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            duration: 0.6, 
                            delay: step.delay,
                            ease: "easeOut"
                          }}
                          className="relative group"
                        >
                          {/* Step Card */}
                          <div className="relative p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-400/30 transition-all duration-500 hover:bg-slate-800/70 group-hover:transform group-hover:scale-105">
                            {/* Background Glow */}
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                            
                            {/* Step Number */}
                            <div className="relative mb-4">
                              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} p-[2px] mx-auto`}>
                                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                  <span className="text-white font-bold text-lg">{step.number}</span>
                                </div>
                              </div>
                              
                              {/* Floating Icon */}
                              <motion.div
                                animate={{ 
                                  y: [0, -8, 0],
                                  rotate: [0, 5, -5, 0]
                                }}
                                transition={{ 
                                  duration: 3,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                  delay: step.delay
                                }}
                                className="absolute -top-2 -right-2 text-2xl filter drop-shadow-lg"
                              >
                                {step.icon}
                              </motion.div>
                            </div>

                            {/* Step Content */}
                            <div className="text-center">
                              <h4 className="text-xl font-semibold text-white mb-3 group-hover:text-cyan-100 transition-colors duration-300">
                                {step.title}
                              </h4>
                              <p className="text-slate-300 leading-relaxed group-hover:text-slate-200 transition-colors duration-300">
                                {step.description}
                              </p>
                            </div>

                            {/* Connecting Lines for Desktop */}
                            {index < steps.length - 1 && (
                              <div className="hidden md:block absolute top-8 left-full w-8 h-[2px] bg-gradient-to-r from-cyan-400/50 to-transparent transform translate-x-4" />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Bottom CTA */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      className="text-center mt-8 pt-6 border-t border-slate-700/50"
                    >
                      <p className="text-slate-400 mb-4">Ready to begin your luxury journey?</p>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 cursor-pointer"
                      >
                        <span>Explore Services Below</span>
                        <span className="text-lg">↓</span>
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 