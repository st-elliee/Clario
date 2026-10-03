import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

export default function EditClient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    last_name: "",
    first_name: "",
    company_name: "",
    client_type: "individual",
    afm: "",
    amka: "",
    taxis_username: "",
    taxis_password: "",
    phone: "",
    email: "",
    address: "",
    doy: "",
    profession: "",
    kad: "",
    notes: "",
  });

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await api.get(`/api/clients/${id}`);
        const c = response.data;
        setForm({
          last_name: c.last_name || "",
          first_name: c.first_name || "",
          company_name: c.company_name || "",
          client_type: c.client_type || "individual",
          afm: c.afm || "",
          amka: c.amka || "",
          taxis_username: c.taxis_username || "",
          taxis_password: c.taxis_password || "",
          phone: c.phone || "",
          email: c.email || "",
          address: c.address || "",
          doy: c.doy || "",
          profession: c.profession || "",
          kad: c.kad || "",
          notes: c.notes || "",
        });
      } catch {
        setError("Σφάλμα φόρτωσης στοιχείων πελάτη.");
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`/api/clients/${id}`, form);
      navigate(`/clients/${id}`);
    } catch {
      setError("Σφάλμα κατά την αποθήκευση.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Φόρτωση...</p>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">

      <button
        onClick={() => navigate(`/clients/${id}`)}
        className="text-indigo-600 hover:underline text-sm mb-4"
      >
        ← Πίσω στην καρτέλα
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Επεξεργασία Πελάτη</h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Βασικά Στοιχεία */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Βασικά Στοιχεία</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Τύπος Πελάτη</label>
              <select
                name="client_type"
                value={form.client_type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="individual">Ιδιώτης</option>
                <option value="freelancer">Ελεύθερος Επαγγελματίας</option>
                <option value="company">Εταιρεία</option>
              </select>
            </div>

            {form.client_type === "company" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Επωνυμία</label>
                <input
                  name="company_name"
                  value={form.company_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Επώνυμο</label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Όνομα</label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Επικοινωνία */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Επικοινωνία</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Τηλέφωνο</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Διεύθυνση</label>
              <input name="address" value={form.address} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
        </div>

        {/* Λογιστικά Στοιχεία */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Λογιστικά Στοιχεία</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ΑΦΜ</label>
              <input name="afm" value={form.afm} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ΑΜΚΑ</label>
              <input name="amka" value={form.amka} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taxis Username</label>
              <input name="taxis_username" value={form.taxis_username} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taxis Password</label>
              <input name="taxis_password" type="password" value={form.taxis_password} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ΔΟΥ</label>
              <input name="doy" value={form.doy} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Επάγγελμα</label>
              <input name="profession" value={form.profession} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ΚΑΔ</label>
              <input name="kad" value={form.kad} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
        </div>

        {/* Σημειώσεις */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Σημειώσεις</h2>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate(`/clients/${id}`)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
          >
            Ακύρωση
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm disabled:opacity-50"
          >
            {saving ? "Αποθήκευση..." : "Αποθήκευση"}
          </button>
        </div>
      </form>
    </div>
  );
}