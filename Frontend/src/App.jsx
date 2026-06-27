import { lazy, Suspense } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Spinner from "./components/Spinner";
import About from "./pages/About";
import Admin from "./pages/Admin";
import BookingSession from "./pages/BookingSession";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import FAQ from "./pages/FAQ";
import ForgotPassword from "./pages/ForgotPassword";
import Gallery from "./pages/Gallery";
import Home from "./pages/Home";
import ListYourTours from "./pages/ListYourTours";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Testimonials from "./pages/Testimonials";
import TourDetail from "./pages/TourDetail";
import Tours from "./pages/Tours";
import VerifyEmail from "./pages/VerifyEmail";
import useAuth from "./hooks/useAuth";

const VirtualTour = lazy(() => import("./pages/VirtualTour"));

export default function App() {
  const location = useLocation();
  const { isStaff, loading, token, user } = useAuth();
  const isDashboardPath = location.pathname === "/dashboard";
  const isRoleDashboard =
    isDashboardPath && (isStaff || user?.role === "tour_company" || user?.role === "tour_guide");
  const isDashboardLoading = isDashboardPath && loading && token;
  const isWorkspace = location.pathname.startsWith("/admin") || isRoleDashboard || isDashboardLoading;

  return (
    <div className={isWorkspace ? "app-shell admin-app-shell" : "app-shell"}>
      {!isWorkspace && <Navbar />}
      <main className={isWorkspace ? "admin-main" : ""}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/tours/:slug" element={<TourDetail />} />
          <Route path="/booking/:trackingCode" element={<BookingSession />} />
          <Route path="/about" element={<About />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/partner" element={<ListYourTours />} />
          <Route path="/list-your-tours" element={<Navigate to="/partner" replace />} />
          <Route
            path="/virtual-tour"
            element={
              <Suspense fallback={<div className="section"><Spinner label="Loading virtual tour" /></div>}>
                <VirtualTour />
              </Suspense>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardEntry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isWorkspace && <Footer />}
    </div>
  );
}

function DashboardEntry() {
  const { isStaff } = useAuth();

  if (isStaff) {
    return <Navigate to="/admin" replace />;
  }

  return <Dashboard />;
}
