import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Wallet, Users } from 'lucide-react';
import { viewportOnce } from '../../lib/animations';

const perks = [
  { icon: Wallet, label: 'Earn on every trip — offset your fuel' },
  { icon: Users, label: 'Meet interesting people, build connections' },
  { icon: ShieldCheck, label: 'Fully insured rides, verified passengers' },
];

const DriverCTA = () => {
  return (
    <section id="drive" className="py-20 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-[#0f1f18] to-[#0D0D14] p-10 sm:p-16"
        >
          {/* Decorative orb */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-500/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
            {/* Left */}
            <div className="max-w-lg">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-4">For Drivers</p>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
                Your car, your route.{' '}
                <span className="text-emerald-400">Your earnings.</span>
              </h2>
              <p className="text-white/45 text-base leading-relaxed mb-8">
                Already driving between cities? Fill your empty seats and let ViaPool handle the rest — matching, payments, and safety all built in.
              </p>

              <ul className="flex flex-col gap-3 mb-9">
                {perks.map((perk) => {
                  const Icon = perk.icon;
                  return (
                    <li key={perk.label} className="flex items-center gap-3 text-sm text-white/60">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Icon size={13} className="text-emerald-400" />
                      </div>
                      {perk.label}
                    </li>
                  );
                })}
              </ul>

              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200"
              >
                Start Driving with ViaPool
                <ArrowRight size={16} />
              </motion.button>
            </div>

            {/* Right — Driver card preview */}
            <div className="w-full lg:w-72 shrink-0">
              <div className="rounded-2xl border border-white/[0.09] bg-[#111118] p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white font-bold">
                    AP
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Amit Patel</p>
                    <p className="text-xs text-white/35">Hyderabad → Pune driver</p>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  {[
                    { label: 'Rides this month', value: '14' },
                    { label: 'Earnings', value: '₹8,400' },
                    { label: 'Rating', value: '4.9 ★' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-white/[0.05]">
                      <span className="text-xs text-white/35">{item.label}</span>
                      <span className="text-sm font-semibold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs text-emerald-400 font-semibold text-center">
                    Next ride: Tomorrow 6:30 AM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DriverCTA;
