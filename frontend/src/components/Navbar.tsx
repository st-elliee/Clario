import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import api from "../api/axios";

interface Notification {
  ypiresia: string;
  due_date: string;
  days_left: number;
  client_count: number;
}

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/api/notifications");
        setNotifications(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { path: "/", label: "Dashboard" },
    { path: "/clients", label: "Πελάτες" },
    ...(isAdmin ? [{ path: "/reports", label: "Αναφορές" }] : []),
    { path: "/employees", label: "Υπάλληλοι" },
  ];

  const dueDateLabel = (days_left: number, due_date: string) => {
    if (days_left < 0) return `${due_date} (εκπρόθεσμο)`;
    if (days_left === 0) return `${due_date} (Σήμερα!)`;
    if (days_left === 1) return `${due_date} (Αύριο!)`;
    return due_date;
  };

  return (
    <nav className="bg-indigo-700 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-8">
        <span className="font-bold text-xl tracking-tight cursor-pointer" onClick={() => navigate("/")}>Clario</span>
        <div className="flex gap-4">
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                location.pathname === link.path
                  ? "bg-indigo-900 text-white"
                  : "text-indigo-100 hover:bg-indigo-600"
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Καμπανάκι */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-indigo-600 transition"
          >
            🔔
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="bg-indigo-600 px-4 py-3">
                <p className="text-white font-semibold text-sm">Ειδοποιήσεις</p>
              </div>
              {notifications.length === 0 ? (
                <p className="text-gray-500 text-sm p-4 text-center">Δεν υπάρχουν εκκρεμότητες.</p>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((n, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setShowNotifications(false);
                        navigate("/clients", {
                          state: {
                            notification_service: n.ypiresia,
                            notification_due_date: n.due_date
                          }
                        });
                      }}
                    >
                      <p className="text-sm font-medium text-gray-800">{n.ypiresia}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {n.client_count} {n.client_count === 1 ? "πελάτης" : "πελάτες"} — {dueDateLabel(n.days_left, n.due_date)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition"
          >
            <span className="text-sm font-medium">{user?.full_name}</span>
            {isAdmin && (
              <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded font-bold">Admin</span>
            )}
            <span className="text-indigo-300">▾</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
              >
                🚪 Αποσύνδεση
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}