import { motion } from 'framer-motion';
import { Search, UserCheck, Wind } from 'lucide-react';
import { staggerContainer, childFadeUp, viewportOnce } from '../../lib/animations';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Search Your Route',
    description:
      'Enter your origin, destination, and travel date. We will instantly show you available rides from verified drivers heading your way.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    number: '02',
    icon: UserCheck,
    title: 'Pick Your Driver',
    description:
      'Browse driver profiles with ratings, vehicle info, and preferences. Choose the ride that fits your comfort level and budget.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    number: '03',
    icon: Wind,
    title: 'Enjoy the Ride',
    description:
      'Book your seat, pay securely, and get real-time updates. Rate your experience after the trip to help the community.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          className="text-center mb-16"
        >
          <motion.p variants={childFadeUp} className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">
            Simple by design
          </motion.p>
          <motion.h2 variants={childFadeUp} className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            How ViaPool Works
          </motion.h2>
          <motion.p variants={childFadeUp} className="text-white/40 text-base sm:text-lg max-w-xl mx-auto">
            From search to destination in three straightforward steps. No complexity, no friction.
          </motion.p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-10 left-[calc(33.33%+20px)] right-[calc(33.33%+20px)] h-px bg-gradient-to-r from-emerald-500/30 via-blue-500/30 to-purple-500/30" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="relative group"
              >
                <div className="h-full rounded-2xl border border-white/[0.07] bg-[#111118] p-8 hover:border-white/[0.14] hover:bg-[#13131f] transition-all duration-300">
                  {/* Step number + icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 ${step.bg} border ${step.border} rounded-xl flex items-center justify-center ${step.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={22} />
                    </div>
                    <span className="text-4xl font-black text-white/[0.06] select-none">{step.number}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{step.description}</p>

                  {/* Bottom accent line */}
                  <div className={`absolute bottom-0 left-8 right-8 h-px ${step.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} style={{ background: 'currentColor' }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
