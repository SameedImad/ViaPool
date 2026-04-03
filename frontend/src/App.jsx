import "./App.css";
import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import OfflineNotice from "./components/OfflineNotice";

const Home = lazy(() => import("./pages/Home"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const PublicUserProfile = lazy(() => import("./pages/PublicUserProfile"));
const Settings = lazy(() => import("./pages/Settings"));

const DriverOnboarding = lazy(() => import("./pages/DriverOnboarding"));
const DriverDashboard = lazy(() => import("./pages/DriverDashboard"));
const PostRide = lazy(() => import("./pages/PostRide"));
const RideManagement = lazy(() => import("./pages/RideManagement"));
const LiveRideView = lazy(() => import("./pages/LiveRideView"));
const DriverChat = lazy(() => import("./pages/DriverChat"));
const Earnings = lazy(() => import("./pages/Earnings"));
const MyVehicles = lazy(() => import("./pages/MyVehicles"));
const MyRides = lazy(() => import("./pages/MyRides"));

const SearchRides = lazy(() => import("./pages/SearchRides"));
const RideDetail = lazy(() => import("./pages/RideDetail"));
const BookRide = lazy(() => import("./pages/BookRide"));
const Payment = lazy(() => import("./pages/Payment"));
const PaymentStatus = lazy(() => import("./pages/PaymentStatus"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const BookingDetail = lazy(() => import("./pages/BookingDetail"));
const LiveTracking = lazy(() => import("./pages/LiveTracking"));
const PassengerChat = lazy(() => import("./pages/PassengerChat"));
const LeaveReview = lazy(() => import("./pages/LeaveReview"));

const NotFound = lazy(() => import("./pages/NotFound"));
const Forbidden = lazy(() => import("./pages/Forbidden"));

function RouteLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--cream)",
      }}
    >
      <div className="auth-spinner" style={{ margin: 0 }} />
    </div>
  );
}

function App() {
  return (
    <>
      <OfflineNotice />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/u/:userId" element={<PublicUserProfile />} />
          <Route path="/settings" element={<Settings />} />

          <Route path="/driver/setup" element={<DriverOnboarding />} />
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/driver/rides/create" element={<PostRide />} />
          <Route path="/driver/rides" element={<MyRides />} />
          <Route path="/driver/rides/:rideId" element={<RideManagement />} />
          <Route path="/driver/rides/:rideId/live" element={<LiveRideView />} />
          <Route
            path="/driver/rides/:rideId/chat/:passengerId"
            element={<DriverChat />}
          />
          <Route path="/driver/earnings" element={<Earnings />} />
          <Route path="/driver/vehicles" element={<MyVehicles />} />

          <Route path="/search" element={<SearchRides />} />
          <Route path="/rides/:rideId" element={<RideDetail />} />
          <Route path="/rides/:rideId/book" element={<BookRide />} />
          <Route path="/bookings/:bookingId/payment" element={<Payment />} />
          <Route
            path="/bookings/:bookingId/payment/status"
            element={<PaymentStatus />}
          />
          <Route path="/passenger/bookings" element={<MyBookings />} />
          <Route
            path="/passenger/bookings/:bookingId"
            element={<BookingDetail />}
          />
          <Route path="/rides/:rideId/track" element={<LiveTracking />} />
          <Route
            path="/rides/:rideId/chat/driver/:driverId"
            element={<PassengerChat />}
          />
          <Route path="/rides/:rideId/review" element={<LeaveReview />} />

          <Route path="/403" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
