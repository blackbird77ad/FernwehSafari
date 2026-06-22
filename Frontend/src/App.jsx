import { lazy, Suspense } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Spinner from "./components/Spinner";
import About from "./pages/About";
import Admin from "./pages/Admin";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import FAQ from "./pages/FAQ";
import Gallery from "./pages/Gallery";
import Home from "./pages/Home";
import ListYourTours from "./pages/ListYourTours";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import Testimonials from "./pages/Testimonials";
import TourDetail from "./pages/TourDetail";
import Tours from "./pages/Tours";
import useAuth from "./hooks/useAuth";

const VirtualTour = lazy(() => import("./pages/VirtualTour"));

export default function App() {
  const location = useLocation();
  const { isStaff, loading, token } = useAuth();
  const isDashboardPath = location.pathname === "/dashboard";
  const isStaffDashboard = isDashboardPath && (isStaff || (loading && token));
  const isAdminWorkspace = location.pathname.startsWith("/admin") || isStaffDashboard;

  return (
    <div className={isAdminWorkspace ? "app-shell admin-app-shell" : "app-shell"}>
      {!isAdminWorkspace && <Navbar />}
      <main className={isAdminWorkspace ? "admin-main" : ""}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/tours/:slug" element={<TourDetail />} />
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
      {!isAdminWorkspace && <Footer />}
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
