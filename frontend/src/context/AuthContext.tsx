import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface User {
  employee_id: number;
  full_name: string;
  role: string;
  token: string;
  access: string[];
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAdmin: boolean;
  hasAccess: (type: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const hasAccess = (type: string): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.access?.includes(type) ?? false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === "admin", hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}