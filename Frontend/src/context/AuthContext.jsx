import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as authService from "../services/authService";
import * as userService from "../services/userService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("fernweh_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  const persistSession = useCallback((payload) => {
    localStorage.setItem("fernweh_token", payload.token);
    setToken(payload.token);
    setUser(payload.user);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem("fernweh_token")) {
      setLoading(false);
      return null;
    }

    try {
      const response = await authService.getMe();
      setUser(response.data.user);
      return response.data.user;
    } catch {
      localStorage.removeItem("fernweh_token");
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser, token]);

  const login = useCallback(
    async (credentials) => {
      const response = await authService.login(credentials);
      persistSession(response.data);
      return response.data.user;
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload) => {
      const response = await authService.register(payload);
      persistSession(response.data);
      return response.data.user;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("fernweh_token");
    setToken(null);
    setUser(null);
  }, []);

  const saveTour = useCallback(async (tourId) => {
    const response = await userService.saveTour(tourId);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const removeSavedTour = useCallback(async (tourId) => {
    const response = await userService.removeSavedTour(tourId);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      isStaff: user?.role === "admin" || user?.role === "moderator",
      loading,
      login,
      logout,
      refreshUser,
      register,
      removeSavedTour,
      saveTour,
      token,
      user
    }),
    [loading, login, logout, refreshUser, register, removeSavedTour, saveTour, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
