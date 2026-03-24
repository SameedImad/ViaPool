import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import HeroSection from '../components/home/HeroSection';
import StatsBar from '../components/home/StatsBar';
import HowItWorks from '../components/home/HowItWorks';
import FeaturedRides from '../components/home/FeaturedRides';
import Testimonials from '../components/home/Testimonials';
import DriverCTA from '../components/home/DriverCTA';
import Footer from '../components/home/Footer';

const Home = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <HowItWorks />
        <FeaturedRides />
        <Testimonials />
        <DriverCTA />
      </main>
      <Footer />
    </motion.div>
  );
};

export default Home;