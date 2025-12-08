'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { AnimatedCounter } from './AnimatedCounter';
import { ParallaxBlob } from './ParallaxBlob';
import { MagneticButton } from './MagneticButton';
import { ParticleSystem } from './ParticleSystem';
import { GradientMesh } from './GradientMesh';
import { FloatingElements } from './FloatingElements';
import { TextReveal } from './TextReveal';

export function HeroSection() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated mesh gradient background with parallax */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950">
        <div className="absolute inset-0 opacity-30">
          <ParallaxBlob 
            className="absolute top-0 -left-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"
            speed={0.3}
          />
          <ParallaxBlob 
            className="absolute top-0 -right-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"
            speed={0.5}
            delay={0.2}
          />
          <ParallaxBlob 
            className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"
            speed={0.4}
            delay={0.4}
          />
        </div>
      </div>

      {/* Noise texture overlay for depth */}
      <div 
        className="absolute inset-0 opacity-[0.015] mix-blend-soft-light pointer-events-none"
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")' 
        }}
      />

      {/* Gradient mesh network */}
      <GradientMesh />

      {/* Particle system */}
      <ParticleSystem />

      {/* Floating elements */}
      <FloatingElements />

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-6 pt-32 pb-20 text-center">
        {/* Eyebrow text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-white/5 border border-white/10 mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-sm text-white/80">Trusted by 10,000+ players nationwide</span>
        </motion.div>

        {/* Main headline - MASSIVE and gradient with text reveal */}
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-8 leading-[1.1]">
          <TextReveal delay={0.1}>
            <span className="inline-block bg-gradient-to-r from-white via-emerald-200 to-teal-200 text-transparent bg-clip-text pb-2 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              Your Path to
            </span>
          </TextReveal>
          <br />
          <TextReveal delay={0.3}>
            <span className="inline-block relative">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-transparent bg-clip-text animate-gradient bg-[length:200%_auto] drop-shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                College Baseball
              </span>
            {/* Underline decoration */}
            <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 100 12" preserveAspectRatio="none">
              <motion.path
                d="M0,7 Q25,3 50,7 T100,7"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          </TextReveal>
        </h1>

        {/* Subheading with better typography */}
        <TextReveal delay={0.5}>
          <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            The premium recruiting platform connecting{' '}
            <span className="text-white font-medium">high school players</span> with{' '}
            <span className="text-white font-medium">college programs</span> nationwide.
            Built for speed, designed for success.
          </p>
        </TextReveal>

        {/* Premium CTA buttons with magnetic effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <MagneticButton 
            href="/auth/signup"
            variant="primary"
            className="group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start For Free
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </MagneticButton>

          <MagneticButton 
            variant="secondary"
            className="flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch Demo
          </MagneticButton>
        </motion.div>

        {/* Animated stats with counting numbers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16"
        >
          {[
            { value: 10000, suffix: '+', label: 'Active Players' },
            { value: 500, suffix: '+', label: 'College Programs' },
            { value: 5000, suffix: '+', label: 'Connections Made' }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 text-transparent bg-clip-text mb-2">
                <AnimatedCounter value={stat.value} />{stat.suffix}
              </div>
              <div className="text-sm text-white/50">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <style jsx>{`
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
