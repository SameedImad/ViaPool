import { motion } from 'framer-motion';
import { MapPin, Clock, Users, Star, ArrowRight, ChevronRight } from 'lucide-react';
import { staggerContainer, childScaleIn, viewportOnce } from '../../lib/animations';

const rides = [
  {
    id: 1,
    driver: { name: 'Arjun Verma', rating: 4.9, trips: 234, avatar: 'AV' },
    from: 'Hyderabad',
    to: 'Visakhapatnam',
    date: 'Tomorrow',
    time: '06:30 AM',
    price: 650,
    seatsAvailable: 3,
    totalSeats: 4,
    vehicle: 'Toyota Innova • White',
    preferences: ['No Smoking', 'Music OK'],
  },
  {
    id: 2,
    driver: { name: 'Priya Shetty', rating: 5.0, trips: 89, avatar: 'PS' },
    from: 'Bengaluru',
    to: 'Chennai',
    date: 'Today',
    time: '08:00 AM',
    price: 450,
    seatsAvailable: 2,
    totalSeats: 4,
    vehicle: 'Honda City • Silver',
    preferences: ['Women Only', 'Pets OK'],
  },
  {
    id: 3,
    driver: { name: 'Karan Mehta', rating: 4.7, trips: 512, avatar: 'KM' },
    from: 'Mumbai',
    to: 'Pune',
    date: 'Tomorrow',
    time: '07:00 AM',
    price: 280,
    seatsAvailable: 1,
    totalSeats: 4,
    vehicle: 'Maruti Ertiga • Blue',
    preferences: ['No Smoking'],
  },
];

const avatarColors = ['bg-emerald-500', 'bg-purple-500', 'bg-amber-500'];

const RideCard = ({ ride, index }) => (
  <motion.div
    variants={childScaleIn}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="group relative rounded-2xl border border-white/[0.07] bg-[#111118] overflow-hidden hover:border-emerald-500/20 transition-colors duration-300 cursor-pointer"
  >
    {/* Top accent bar */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

    <div className="p-6">
      {/* Driver row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${avatarColors[index % 3]} rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0`}>
            {ride.driver.avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{ride.driver.name}</p>
            <div className="flex items-center gap-1 text-xs text-white/40">
              <Star size={10} className="text-amber-400 fill-amber-400" />
              <span className="text-amber-400 font-semibold">{ride.driver.rating}</span>
              <span>· {ride.driver.trips} trips</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold text-white">₹{ride.price}</p>
          <p className="text-xs text-white/30">per seat</p>
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex flex-col items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <div className="w-px h-6 bg-white/10" />
          <div className="w-2 h-2 rounded-full border border-white/30" />
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-white">{ride.from}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-white/60">{ride.to}</p>
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-white/35 mb-5">
        <div className="flex items-center gap-1.5">
          <Clock size={12} />
          <span>{ride.date}, {ride.time}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users size={12} />
          <span>{ride.seatsAvailable} of {ride.totalSeats} seats left</span>
        </div>
      </div>

      {/* Vehicle tag */}
      <p className="text-xs text-white/25 mb-5 flex items-center gap-1.5">
        <MapPin size={10} />
        {ride.vehicle}
      </p>

      {/* Preferences */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {ride.preferences.map((p) => (
          <span key={p} className="px-2.5 py-0.5 text-xs bg-white/[0.04] border border-white/[0.07] rounded-full text-white/40">
            {p}
          </span>
        ))}
      </div>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm rounded-xl hover:bg-emerald-500 hover:text-black hover:border-emerald-500 transition-all duration-300 flex items-center justify-center gap-2"
      >
        Book Seat
        <ChevronRight size={14} />
      </motion.button>
    </div>
  </motion.div>
);

const FeaturedRides = () => {
  return (
    <section id="find-rides" className="py-24 sm:py-32 px-5 sm:px-8 bg-[#0D0D14]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12"
        >
          <div>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">Live Rides</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Rides Available Now
            </h2>
          </div>
          <button className="flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-emerald-400 transition-colors duration-200 shrink-0">
            View all rides
            <ArrowRight size={14} />
          </button>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {rides.map((ride, i) => (
            <RideCard key={ride.id} ride={ride} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedRides;
