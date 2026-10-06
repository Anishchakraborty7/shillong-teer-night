import { useState, useEffect } from "react";
import { loginAdmin, logoutAdmin, subscribeToAuth } from "../firebase/auth";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const login = async (adminId, password) => {
    const loggedInUser = await loginAdmin(adminId, password);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    await logoutAdmin();
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout
  };
}
