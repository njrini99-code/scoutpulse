'use client';

import { motion } from 'framer-motion';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "ScoutPulse completely transformed how we recruit. The video analysis tools are incredible and save us hours every week.",
    name: "Coach Martinez",
    role: "Head Coach, State University"
  },
  {
    quote: "I got recruited by my dream school thanks to ScoutPulse. The platform made it so easy to showcase my skills.",
    name: "Alex Johnson",
    role: "Pitcher, Class of 2024"
  },
  {
    quote: "The best recruiting platform we've used. The player profiles are comprehensive and the messaging system is seamless.",
    name: "Coach Williams",
    role: "Recruiting Coordinator, Big State"
  },
  {
    quote: "As a JUCO player, finding the right fit was tough. ScoutPulse connected me with programs that actually wanted me.",
    name: "Marcus Davis",
    role: "Outfielder, Transfer Portal"
  },
  {
    quote: "The stats tracking feature is a game-changer. We can see player progression over time and make data-driven decisions.",
    name: "Coach Anderson",
    role: "Assistant Coach, Regional College"
  },
  {
    quote: "I love how easy it is to upload videos and organize my highlights. Coaches can find exactly what they're looking for.",
    name: "Jordan Smith",
    role: "Catcher, High School Senior"
  }
];

// Duplicate testimonials for seamless infinite scroll
const duplicatedTestimonials = [...testimonials, ...testimonials];

export function TestimonialsCarousel() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950"></div>
      
      <div className="relative container mx-auto px-6">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-bold text-white mb-6"
          >
            Trusted by <span className="bg-gradient-to-r from-emerald-400 to-teal-400 text-transparent bg-clip-text drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]">Thousands</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/60"
          >
            See what players and coaches are saying
          </motion.p>
        </div>

        {/* Infinite scroll testimonials */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none"></div>
          
          <div className="flex gap-6 animate-scroll">
            {duplicatedTestimonials.map((testimonial, i) => (
              <div 
                key={i} 
                className="flex-shrink-0 w-96 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-300 shadow-xl shadow-black/20 hover:shadow-emerald-500/10"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/80 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400"></div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-white/50">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
