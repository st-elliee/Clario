import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
const DEMO_ACCOUNTS = [
  { username: "admin", password: "demo1234", label: "Admin", hint: "Πλήρης πρόσβαση, αναφορές & έσοδα" },
  { username: "employee", password: "demo1234", label: "Υπάλληλος", hint: "Πελάτες & υπηρεσίες" },
];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const doLogin = async (user: string, pass: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/api/login", { username: user, password: pass });
      login({
        employee_id: response.data.employee_id,
        full_name: response.data.full_name,
        role: response.data.role,
        token: response.data.access_token,
        access: response.data.access || [],
      });
      navigate("/dashboard");
    } catch {
      setError("Λάθος username ή password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600">Clario</h1>
          <p className="text-gray-500 mt-1 text-sm">Clarity in every client</p>
        </div>

        {DEMO_MODE && (
          <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-sm font-semibold text-indigo-800">Live demo</p>
            <p className="text-xs text-indigo-700 mt-1 mb-3">
              Όλα τα δεδομένα είναι φανταστικά και επαναφέρονται κάθε μέρα.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  disabled={loading}
                  onClick={() => doLogin(acc.username, acc.password)}
                  className="text-left bg-white border border-indigo-200 rounded-lg px-3 py-2 hover:border-indigo-400 hover:bg-indigo-100 transition disabled:opacity-50"
                >
                  <span className="block text-sm font-medium text-indigo-700">{acc.label}</span>
                  <span className="block text-[11px] text-gray-500">{acc.username} / {acc.password}</span>
                  <span className="block text-[11px] text-gray-400 mt-0.5">{acc.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Εισάγετε username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Εισάγετε password"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Σύνδεση..." : "Σύνδεση"}
          </button>
        </form>
      </div>
    </div>
  );
}