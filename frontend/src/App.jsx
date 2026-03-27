import './App.css';
import { Routes, Route } from 'react-router-dom';

// Public
import Home             from './pages/Home';
import Register         from './pages/Register';
import Login            from './pages/Login';
import ForgotPassword   from './pages/ForgotPassword';
import ResetPassword    from './pages/ResetPassword';

// Shared authenticated
import Profile          from './pages/Profile';
import Notifications    from './pages/Notifications';
import PublicUserProfile from './pages/PublicUserProfile';
import Settings         from './pages/Settings';

// Driver flow
import DriverOnboarding from './pages/DriverOnboarding';
import DriverDashboard  from './pages/DriverDashboard';
import PostRide         from './pages/PostRide';
import RideManagement   from './pages/RideManagement';
import LiveRideView     from './pages/LiveRideView';
import DriverChat       from './pages/DriverChat';
import Earnings         from './pages/Earnings';
import MyVehicles       from './pages/MyVehicles';

// Passenger flow
import SearchRides      from './pages/SearchRides';
import RideDetail       from './pages/RideDetail';
import BookRide         from './pages/BookRide';
import Payment          from './pages/Payment';
import PaymentStatus    from './pages/PaymentStatus';
import MyBookings       from './pages/MyBookings';
import BookingDetail    from './pages/BookingDetail';
import LiveTracking     from './pages/LiveTracking';
import PassengerChat    from './pages/PassengerChat';
import LeaveReview      from './pages/LeaveReview';

// Error / Utility
import NotFound         from './pages/NotFound';
import Forbidden        from './pages/Forbidden';

function App() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/"                                        element={<Home />} />
      <Route path="/register"                                element={<Register />} />
      <Route path="/login"                                   element={<Login />} />
      <Route path="/forgot-password"                         element={<ForgotPassword />} />
      <Route path="/reset-password/:token"                   element={<ResetPassword />} />

      {/* ── Shared authenticated ── */}
      <Route path="/profile"                                 element={<Profile />} />
      <Route path="/notifications"                           element={<Notifications />} />
      <Route path="/u/:userId"                               element={<PublicUserProfile />} />
      <Route path="/settings"                                element={<Settings />} />

      {/* ── Driver flow ── */}
      <Route path="/driver/setup"                            element={<DriverOnboarding />} />
      <Route path="/driver/dashboard"                        element={<DriverDashboard />} />
      <Route path="/driver/rides/create"                     element={<PostRide />} />
      <Route path="/driver/rides/:rideId"                    element={<RideManagement />} />
      <Route path="/driver/rides/:rideId/live"               element={<LiveRideView />} />
      <Route path="/rides/:rideId/chat/:passengerId"         element={<DriverChat />} />
      <Route path="/driver/earnings"                         element={<Earnings />} />
      <Route path="/driver/vehicles"                         element={<MyVehicles />} />

      {/* ── Passenger flow ── */}
      <Route path="/search"                                  element={<SearchRides />} />
      <Route path="/rides/:rideId"                           element={<RideDetail />} />
      <Route path="/rides/:rideId/book"                      element={<BookRide />} />
      <Route path="/bookings/:bookingId/payment"             element={<Payment />} />
      <Route path="/bookings/:bookingId/payment/status"      element={<PaymentStatus />} />
      <Route path="/passenger/bookings"                      element={<MyBookings />} />
      <Route path="/passenger/bookings/:bookingId"           element={<BookingDetail />} />
      <Route path="/rides/:rideId/track"                     element={<LiveTracking />} />
      <Route path="/rides/:rideId/chat/:driverId"            element={<PassengerChat />} />
      <Route path="/rides/:rideId/review"                    element={<LeaveReview />} />

      {/* ── Error / Utility ── */}
      <Route path="/403"                                     element={<Forbidden />} />
      <Route path="*"                                        element={<NotFound />} />
    </Routes>
  );
}

export default App;

