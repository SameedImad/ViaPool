const Badge = ({ children, variant = 'default', className = '' }) => {
  const styles = {
    default: 'bg-white/5 border-white/10 text-white/60',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-0.5 rounded-full
        text-xs font-semibold border
        ${styles[variant] ?? styles.default}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
