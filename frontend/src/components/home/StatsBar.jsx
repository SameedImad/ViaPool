import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const stats = [
  { value: 12400, suffix: '+', label: 'Rides Completed' },
  { value: 4.9, suffix: '★', label: 'Avg Rating' },
  { value: 850, prefix: '₹', suffix: '+', label: 'Avg Savings/Trip' },
  { value: 8, suffix: '', label: 'Cities Active' },
];

const Counter = ({ value, suffix = '', prefix = '', decimals = 0 }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    if (!isInView) return;
    const duration = 1600;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * value;
      setDisplay(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.floor(current));
      if (progress < 1) requestAnimationFrame(tick);
      else setDisplay(value);
    };

    requestAnimationFrame(tick);
  }, [isInView, value, decimals]);

  return (
    <span ref={ref}>
      {prefix}{decimals > 0 ? display.toFixed(decimals) : display.toLocaleString()}{suffix}
    </span>
  );
};

const StatsBar = () => {
  return (
    <section className="relative py-12 border-y border-white/[0.06] overflow-hidden">
      {/* Subtle glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-white/[0.06]">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
              className="flex flex-col items-center md:items-start px-0 md:px-8 text-center md:text-left"
            >
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums">
                <Counter
                  value={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix || ''}
                  decimals={stat.value % 1 !== 0 ? 1 : 0}
                />
              </p>
              <p className="text-sm text-white/35 font-medium mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
    </section>
  );
};

export default StatsBar;
