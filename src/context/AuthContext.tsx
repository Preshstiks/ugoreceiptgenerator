// AuthContext.tsx
import { createContext, useContext, useState } from "react";
import type { User } from "firebase/auth"; // from Firebase Auth SDK
import type { ReactNode } from "react";

type AuthResponse = {
  user: User;
  token: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (userData: AuthResponse) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used inside AuthContextProvider");
  return context;
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  const login = (userData: AuthResponse) => {
    setUser(userData.user);
    setToken(userData.token);
    localStorage.setItem("user", JSON.stringify(userData.user));
    localStorage.setItem("token", userData.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
