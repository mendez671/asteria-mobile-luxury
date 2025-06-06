'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { InteractiveCrystalHero, CrystalLines, PulseCrystal } from '@/components/effects/InteractiveCrystalHero';
import ChatInterface from '@/components/chat/ChatInterface';

interface HeroWithStepsProps {
  currentTime: Date;
}

const steps = [
  {
    number: "01",
    title: "Make any Service Request",
      description: "Ask Asteria to for anything you&apos;d like, even if you&apos;re not sure what you want.",
    icon: "💬"
  },
  {
    number: "02", 
    title: "Let's Book It!",
      description: "Once you and Asteria agree on the details, click the &apos;Let&apos;s Book It&apos; button once it pops up.",
    icon: "🎯"
  },
  {
    number: "03",
    title: "Get Results", 
    description: "Look for updates or your reservation details in your email, texts, and member dashboard!",
    icon: "✨"
  }
];

export default function HeroWithSteps({ currentTime }: HeroWithStepsProps) {
  return (
    <section className="relative min-h-screen flex flex-col px-6 pt-20 md:pt-24">
      {/* Interactive crystal background effects - shared across entire section */}
      <InteractiveCrystalHero />
      <CrystalLines />
      <PulseCrystal />
      
      {/* Hero Content - Upper portion */}
      <div className="relative z-10 max-w-4xl mx-auto text-center mb-12 md:mb-20 flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          {/* ENHANCED: "Meet Asteria" with luxury concierge tagline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4">
            <span className="block text-white mb-2">Meet Asteria</span>
            <span className="block text-xl sm:text-2xl md:text-4xl bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent animate-pulse">
              The World's First Luxury Services AI Concierge
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-6 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
            Luxury is no longer a product. It's a Network. 
          </p>
          
          {/* ENHANCED: Time-based luxury messaging */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/40 rounded-full text-sm text-slate-400 mb-6 border border-cyan-500/20">
            <span>✨</span>
            <span>
              {currentTime.getHours() < 12 ? 'Good morning' : 
               currentTime.getHours() < 18 ? 'Good afternoon' : 'Good evening'} - 
              Your curated experience awaits
            </span>
          </div>
        </motion.div>
      </div>

      {/* Steps Content - Lower portion with seamless integration */}
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Three Steps to Luxury
            </span>
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Your journey from aspiration to experience, simplified into three elegant steps.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 px-2 sm:px-4 md:px-6 lg:px-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 + (index * 0.2) }}
              className="relative group"
            >
              {/* Connection Line (hidden on mobile, visible on md+) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent z-0 group-hover:from-cyan-400/70 transition-all duration-300" />
              )}
              
              {/* Step Card with enhanced glass styling to match hero */}
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

                {/* Enhanced Hover Effect Glow to match hero styling */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Transition to Chat Interface - Integrated within same section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="text-center mt-12 sm:mt-16 md:mt-20 mb-8 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Start Your Journey
            </span>
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            Asteria will engage with you in voice mode too! Try it out now!
          </p>
        </motion.div>

        {/* Integrated Chat Interface with Crystal Background */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 pb-12 sm:pb-20"
        >
          <div className="relative">
            {/* Subtle glass container to frame the chat interface against crystal background */}
            <div className="bg-slate-900/20 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-3 sm:p-6 shadow-2xl shadow-cyan-500/10 min-h-[400px] sm:min-h-[500px]">
              <ChatInterface />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 