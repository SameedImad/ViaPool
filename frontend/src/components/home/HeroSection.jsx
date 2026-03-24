import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, ArrowRight, Sparkles, ChevronDown } from 'lucide-react';
import { staggerContainer, childFadeUp, viewportOnce } from '../../lib/animations';

const HeroSection = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [seats, setSeats] = useState(1);

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: Navigate to /rides with query params
    console.log({ from, to, date, seats });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-5 sm:px-8 pt-28 pb-16 overflow-hidden">

      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.12, 0.18, 0.12] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/15 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.08, 0.13, 0.08] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[140px]"
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex flex-col items-center text-center max-w-4xl w-full"
      >
        {/* Eyebrow badge */}
        <motion.div variants={childFadeUp}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-emerald-400 text-xs font-semibold tracking-wide mb-8">
            <Sparkles size={12} />
            Available in 8 cities across India
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={childFadeUp}
          className="text-[2.6rem] sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.05] mb-6"
        >
          Share the Journey,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400">
            Split the Cost
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          variants={childFadeUp}
          className="text-base sm:text-lg text-white/50 max-w-xl mb-10 leading-relaxed"
        >
          Carpool with verified drivers going your way. Save money, reduce emissions, and make new connections — every single trip.
        </motion.p>

        {/* Search Widget */}
        <motion.div
          variants={childFadeUp}
          className="w-full max-w-3xl"
        >
          <form
            onSubmit={handleSearch}
            className="relative rounded-2xl border border-white/[0.1] bg-[#111118] shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Top inputs row */}
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
              {/* From */}
              <div className="flex items-center gap-3 flex-1 px-5 py-4 group">
                <MapPin size={16} className="text-emerald-400 shrink-0" />
                <div className="flex-1 text-left">
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-0.5">From</p>
                  <input
                    type="text"
                    placeholder="Leaving from..."
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
                  />
                </div>
              </div>

              {/* Swap divider (decorative) */}
              <div className="hidden md:flex items-center justify-center w-10 relative">
                <div className="absolute w-6 h-6 rounded-full bg-[#1A1A26] border border-white/[0.1] flex items-center justify-center z-10">
                  <ArrowRight size={10} className="text-white/40" />
                </div>
              </div>

              {/* To */}
              <div className="flex items-center gap-3 flex-1 px-5 py-4">
                <MapPin size={16} className="text-white/25 shrink-0" />
                <div className="flex-1 text-left">
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-0.5">To</p>
                  <input
                    type="text"
                    placeholder="Going to..."
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3 px-5 py-4 border-t md:border-t-0 md:border-l border-white/[0.08]">
                <Calendar size={16} className="text-white/25 shrink-0" />
                <div className="text-left">
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-0.5">Date</p>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent text-sm text-white/60 focus:outline-none w-full [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Seats */}
              <div className="flex items-center gap-3 px-5 py-4 border-t md:border-t-0 md:border-l border-white/[0.08]">
                <Users size={16} className="text-white/25 shrink-0" />
                <div className="text-left">
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-0.5">Seats</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSeats(Math.max(1, seats - 1))}
                      className="w-5 h-5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 flex items-center justify-center text-xs transition-colors"
                    >
                      −
                    </button>
                    <span className="text-sm text-white font-semibold w-4 text-center">{seats}</span>
                    <button
                      type="button"
                      onClick={() => setSeats(Math.min(8, seats + 1))}
                      className="w-5 h-5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 flex items-center justify-center text-xs transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Row */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 p-4 bg-white/[0.02] border-t border-white/[0.06]">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200"
              >
                <MapPin size={16} />
                Find Rides
              </motion.button>
              <motion.a
                href="#drive"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-white/70 hover:text-white font-semibold text-sm rounded-xl transition-all duration-200"
              >
                Post a Ride
                <ArrowRight size={14} />
              </motion.a>
            </div>
          </form>

          {/* Popular routes */}
          <motion.div variants={childFadeUp} className="flex flex-wrap justify-center gap-2 mt-5">
            <span className="text-xs text-white/25 self-center">Popular:</span>
            {['Hyd → Vizag', 'Bengaluru → Chennai', 'Mumbai → Pune', 'Delhi → Agra'].map((route) => (
              <button
                key={route}
                className="px-3 py-1 text-xs text-white/40 hover:text-emerald-400 bg-white/[0.04] hover:bg-emerald-500/10 border border-white/[0.06] hover:border-emerald-500/30 rounded-full transition-all duration-200"
              >
                {route}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/20"
      >
        <span className="text-[10px] uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
