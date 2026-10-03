import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const COUNTRY_CODES = [
  { code: "+30", label: "🇬🇷 +30" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+49", label: "🇩🇪 +49" },
  { code: "+31", label: "🇳🇱 +31" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+39", label: "🇮🇹 +39" },
  { code: "+34", label: "🇪🇸 +34" },
  { code: "+355", label: "🇦🇱 +355" },
  { code: "+357", label: "🇨🇾 +357" },
  { code: "+40", label: "🇷🇴 +40" },
  { code: "+359", label: "🇧🇬 +359" },
];

export default function NewClient() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countryCode, setCountryCode] = useState("+30");
  const [form, setForm] = useState({
    afm: "",
    last_name: "",
    first_name: "",
    company_name: "",
    client_type: "individual",
    phone: "",
    email: "",
    address: "",
    postal_code: "",
    city: "",
    amka: "",
    id_number: "",
    taxis_username: "",
    taxis_password: "",
    doy: "",
    profession: "",
    kad: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Καθάρισε το error του πεδίου
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const greekLatinRegex = /^[a-zA-ZΑ-Ωα-ωάέήίόύώΆΈΉΊΌΎΏ\s-]+$/;
    const afmRegex = /^\d{9,12}$/;
    const phoneRegex = /^\d{10,12}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (form.client_type !== "company") {
      if (!form.last_name.trim()) {
        newErrors.last_name = "Το επώνυμο είναι υποχρεωτικό";
      } else if (!greekLatinRegex.test(form.last_name)) {
        newErrors.last_name = "Μόνο ελληνικοί και λατινικοί χαρακτήρες";
      }
      if (form.first_name && !greekLatinRegex.test(form.first_name)) {
        newErrors.first_name = "Μόνο ελληνικοί και λατινικοί χαρακτήρες";
      }
    } else {
      if (!form.company_name.trim()) {
        newErrors.company_name = "Η επωνυμία είναι υποχρεωτική";
      }
    }

    if (!form.afm.trim()) {
      newErrors.afm = "Το ΑΦΜ είναι υποχρεωτικό";
    } else if (!afmRegex.test(form.afm)) {
      newErrors.afm = "Το ΑΦΜ πρέπει να έχει 9-12 ψηφία";
    }

    if (form.phone && !phoneRegex.test(form.phone)) {
      newErrors.phone = "Το τηλέφωνο πρέπει να έχει 10-12 ψηφία";
    }

    if (form.email && !emailRegex.test(form.email)) {
      newErrors.email = "Μη έγκυρη διεύθυνση email";
    }

    if (form.city && !greekLatinRegex.test(form.city)) {
      newErrors.city = "Μόνο ελληνικοί και λατινικοί χαρακτήρες";
    }

    if (form.postal_code && !/^\d+$/.test(form.postal_code)) {
      newErrors.postal_code = "Μόνο αριθμοί";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const fullPhone = form.phone ? `${countryCode}${form.phone}` : "";
      const fullAddress = [form.address, form.postal_code, form.city]
        .filter(Boolean).join(", ");
      await api.post("/api/clients", {
        ...form,
        phone: fullPhone,
        address: fullAddress,
      });
      navigate("/clients");
    } catch {
      setErrors({ general: "Σφάλμα κατά την αποθήκευση. Ελέγξτε τα στοιχεία." });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
      errors[field] ? "border-red-400" : "border-gray-300"
    }`;

  return (
    <div className="p-6 max-w-4xl mx-auto">

      <button
        onClick={() => navigate("/clients")}
        className="text-indigo-600 hover:underline text-sm mb-4"
      >
        ← Πίσω στους πελάτες
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Νέος Πελάτης</h1>

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
                className={inputClass("client_type")}
              >
                <option value="individual">Ιδιώτης</option>
                <option value="freelancer">Ελεύθερος Επαγγελματίας</option>
                <option value="company">Εταιρεία</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ΑΦΜ *</label>
              <input
                name="afm"
                value={form.afm}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 12);
                  setForm({ ...form, afm: val });
                  if (errors.afm) setErrors({ ...errors, afm: "" });
                }}
                placeholder="123456789"
                className={inputClass("afm")}
              />
              {errors.afm && <p className="text-red-500 text-xs mt-1">{errors.afm}</p>}
            </div>

            {form.client_type === "company" ? (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Επωνυμία *</label>
                <input
                  name="company_name"
                  value={form.company_name}
                  onChange={handleChange}
                  className={inputClass("company_name")}
                />
                {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Επώνυμο *</label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    className={inputClass("last_name")}
                  />
                  {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Όνομα</label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    className={inputClass("first_name")}
                  />
                  {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Επικοινωνία */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Επικοινωνία</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Τηλέφωνο με κωδικό χώρας */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Τηλέφωνο</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 12);
                    setForm({ ...form, phone: val });
                    if (errors.phone) setErrors({ ...errors, phone: "" });
                  }}
                  placeholder="6971234567"
                  className={`flex-1 ${inputClass("phone")}`}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
                className={inputClass("email")}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Διεύθυνση */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Διεύθυνση</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Εγνατία 10"
                className={inputClass("address")}
              />
            </div>

            {/* ΤΚ + Πόλη */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ταχυδρομικός Κώδικας</label>
              <input
                name="postal_code"
                value={form.postal_code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setForm({ ...form, postal_code: val });
                  if (errors.postal_code) setErrors({ ...errors, postal_code: "" });
                }}
                placeholder="54622"
                className={inputClass("postal_code")}
              />
              {errors.postal_code && <p className="text-red-500 text-xs mt-1">{errors.postal_code}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Πόλη / Τόπος Κατοικίας</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Θεσσαλονίκη"
                className={inputClass("city")}
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>
          </div>
        </div>

        {/* Λογιστικά Στοιχεία */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Λογιστικά Στοιχεία</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ΔΟΥ</label>
              <input name="doy" value={form.doy} onChange={handleChange} className={inputClass("doy")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Επάγγελμα</label>
              <input name="profession" value={form.profession} onChange={handleChange} className={inputClass("profession")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ΚΑΔ</label>
              <input name="kad" value={form.kad} onChange={handleChange} className={inputClass("kad")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ΑΜΚΑ</label>
              <input name="amka" value={form.amka} onChange={handleChange} className={inputClass("amka")} />
            </div>
          </div>
        </div>

        {/* Taxis */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Στοιχεία Taxis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username Taxis</label>
              <input name="taxis_username" value={form.taxis_username} onChange={handleChange} className={inputClass("taxis_username")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Taxis</label>
              <input name="taxis_password" type="password" value={form.taxis_password} onChange={handleChange} className={inputClass("taxis_password")} />
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
            className={inputClass("notes")}
            placeholder="Προαιρετικές σημειώσεις..."
          />
        </div>

        {errors.general && (
          <p className="text-red-500 text-sm text-center">{errors.general}</p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate("/clients")}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
          >
            Ακύρωση
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm disabled:opacity-50"
          >
            {loading ? "Αποθήκευση..." : "Αποθήκευση"}
          </button>
        </div>
      </form>
    </div>
  );
}