import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import api, { setToken } from "../api";

const AuthContext = createContext(null);
const KEY = "student_qr_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(KEY);
        if (saved) {
          setToken(saved);
          const { data } = await api.get("/auth/me");
          setUser(data);
        }
      } catch {
        setToken(null);
        try {
          await SecureStore.deleteItemAsync(KEY);
        } catch {}
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const finish = async ({ token, user: u }) => {
    setToken(token);
    try {
      await SecureStore.setItemAsync(KEY, token);
    } catch {}
    setUser(u);
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    await finish(data);
  };

  const register = async (form) => {
    const { data } = await api.post("/auth/register", form);
    await finish(data);
  };

  const updateUser = (updated) => setUser(updated);

  const logout = async () => {
    setToken(null);
    try {
      await SecureStore.deleteItemAsync(KEY);
    } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, booting, login, register, updateUser, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
