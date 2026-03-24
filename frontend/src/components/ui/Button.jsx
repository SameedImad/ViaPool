import { motion } from 'framer-motion';

const variants = {
  primary:
    'bg-emerald-500 text-black font-bold hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40',
  ghost:
    'bg-white/[0.04] text-white/80 border border-white/10 hover:bg-white/[0.08] hover:text-white',
  outline:
    'border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500',
  white:
    'bg-white text-black font-bold hover:bg-gray-100 shadow-lg shadow-white/10',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
  xl: 'px-10 py-5 text-base',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -1 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl font-semibold tracking-tight
        transition-all duration-200 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant] ?? variants.primary}
        ${sizes[size] ?? sizes.md}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
