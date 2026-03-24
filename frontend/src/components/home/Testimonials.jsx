import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { staggerContainer, childFadeUp, viewportOnce } from '../../lib/animations';

const testimonials = [
  {
    name: 'Ananya Krishnan',
    role: 'Software Engineer, Hyderabad',
    avatar: 'AK',
    avatarColor: 'bg-purple-500',
    rating: 5,
    text: "I saved over ₹6,000 last month using ViaPool for my daily commute from Gachibowli to Secunderabad. The drivers are super friendly and punctual. Can't imagine going back to Ola.",
  },
  {
    name: 'Rahul Desai',
    role: 'Product Manager, Bengaluru',
    avatar: 'RD',
    avatarColor: 'bg-blue-500',
    rating: 5,
    text: "The booking experience is incredibly smooth. Found a ride to Mysore at 6 AM, the driver was exactly on time, and the car was spotless. ViaPool has nailed the small details.",
  },
  {
    name: 'Sneha Iyer',
    role: 'Medical Student, Chennai',
    avatar: 'SI',
    avatarColor: 'bg-emerald-600',
    rating: 5,
    text: "As a solo female traveler, safety was my #1 concern. The rating system, verified profiles, and real-time tracking gave me full confidence. Traveled from Chennai to Vellore twice now.",
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 sm:py-32 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">Real riders, real stories</p>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Loved by Thousands
          </h2>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          className="grid md:grid-cols-3 gap-5"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              variants={childFadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative rounded-2xl border border-white/[0.07] bg-[#111118] p-7 hover:border-white/[0.13] transition-all duration-300 overflow-hidden"
            >
              {/* Quote icon */}
              <Quote size={28} className="text-emerald-500/20 mb-5" />

              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={12} className="text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-sm text-white/55 leading-relaxed mb-6">"{t.text}"</p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                <div className={`w-9 h-9 ${t.avatarColor} rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/35">{t.role}</p>
                </div>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
