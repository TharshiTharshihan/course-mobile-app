import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import api, { setToken } from "../api";

const AuthContext = createContext(null);
const KEY = "student_qr_token";
const USER_KEY = "student_qr_user";

const clearSession = async () => {
  setToken(null);
  try {
    await SecureStore.deleteItemAsync(KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch {}
};

const saveUser = async (u) => {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(u));
  } catch {}
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      let saved = null;
      try {
        saved = await SecureStore.getItemAsync(KEY);
        const cached = await SecureStore.getItemAsync(USER_KEY);
        if (saved && cached) {
          // Open instantly with the cached profile; refresh it below without blocking launch.
          setToken(saved);
          setUser(JSON.parse(cached));
          setBooting(false);
        }
      } catch {}

      if (!saved) return setBooting(false);
      setToken(saved);
      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
        saveUser(data);
      } catch (e) {
        // Only a rejected token ends the session; network errors / a sleeping server keep it.
        const status = e?.response?.status;
        if (status === 401 || status === 403 || status === 404) {
          await clearSession();
          setUser(null);
        }
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
    saveUser(u);
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

  const updateUser = (updated) => {
    saveUser(updated);
    setUser(updated);
  };

  const logout = async () => {
    await clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, booting, login, register, updateUser, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
