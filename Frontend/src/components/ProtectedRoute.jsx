import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { setPendingBookingPath } from "../utils/bookingIntent";
import Spinner from "./Spinner";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const currentPath = `${location.pathname}${location.search}${location.hash}`;
  const isBookingStart = location.pathname.startsWith("/booking/start/");

  useEffect(() => {
    if (!loading && !isAuthenticated && isBookingStart) {
      setPendingBookingPath(currentPath);
    }
  }, [currentPath, isAuthenticated, isBookingStart, loading]);

  if (loading) {
    return <Spinner label="Checking session" />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          ...(isBookingStart ? { message: "Sign in or create a free traveller account to continue booking." } : {})
        }}
        replace
      />
    );
  }

  return children;
}
