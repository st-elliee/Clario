import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface Employee {
  employee_id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  last_login: string;
  access: string[];
}

interface Action {
  timestamp: string;
  action_type: string;
  client_id: number;
  client_name: string;
  details: any;
}

const ACTION_LABELS: Record<string, { label: string; emoji: string; category: string }> = {
  add_service:      { label: "Νέα Υπηρεσία",           emoji: "🆕", category: "services" },
  edit_service:     { label: "Επεξεργασία Υπηρεσίας", emoji: "✏️", category: "services" },
  update_service:   { label: "Ενημέρωση Υπηρεσίας",   emoji: "✏️", category: "services" },
  delete_service:   { label: "Διαγραφή Υπηρεσίας",    emoji: "🗑️", category: "services" },
  add_client:       { label: "Νέος Πελάτης",           emoji: "👤", category: "clients" },
  edit_client:      { label: "Επεξεργασία Πελάτη",    emoji: "✏️", category: "clients" },
  delete_client:    { label: "Διαγραφή Πελάτη",       emoji: "🗑️", category: "clients" },
  login:            { label: "Σύνδεση",                emoji: "🔐", category: "other" },
  export_data:      { label: "Export Δεδομένων",       emoji: "📤", category: "other" },
};

function getFilterOptions(_emp: Employee) {
  const options = [
    { value: "all", label: "Όλες" },
    { value: "services", label: "Υπηρεσίες" },
    { value: "clients", label: "Πελάτες" },
  ];
  return options;
}

const CATEGORY_MAP: Record<string, string[]> = {
  services: ["add_service", "edit_service", "update_service", "delete_service"],
  clients:  ["add_client", "edit_client", "delete_client"],
};

function formatDetails(action_type: string, details: any): string {
  if (!details) return "";
  switch (action_type) {
    case "update_service":
      return details.new_status ? `Κατάσταση → ${details.new_status}` : "";
    default:
      return "";
  }
}

export default function Employees() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [toggleEmployee, setToggleEmployee] = useState<Employee | null>(null);

  // Ιστορικό
  const [historyEmployee, setHistoryEmployee] = useState<Employee | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");

  const [form, setForm] = useState({
    username: "", password: "", full_name: "", email: "", phone: "", role: "employee",
  });

  useEffect(() => {
    if (!isAdmin) { navigate("/dashboard"); return; }
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/api/employees");
      setEmployees(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActions = async (employee_id: number, category: string = "all") => {
    setActionsLoading(true);
    try {
      const response = await api.get(`/api/employees/${employee_id}/actions`);
      const allActions: Action[] = response.data;
      if (category === "all") {
        setActions(allActions);
      } else {
        setActions(allActions.filter((a) => CATEGORY_MAP[category]?.includes(a.action_type)));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionsLoading(false);
    }
  };

  const handleShowHistory = (emp: Employee) => {
    setHistoryEmployee(emp);
    setFilterCategory("all");
    setEditingEmployee(null);
    setShowForm(false);
    fetchActions(emp.employee_id, "all");
  };

  const handleFilterChange = (category: string) => {
    setFilterCategory(category);
    if (historyEmployee) fetchActions(historyEmployee.employee_id, category);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await api.post("/api/employees", form);
      setSuccess("Ο υπάλληλος δημιουργήθηκε επιτυχώς!");
      setShowForm(false);
      setForm({ username: "", password: "", full_name: "", email: "", phone: "", role: "employee" });
      fetchEmployees();
    } catch (err: any) {
      if (err?.response?.status === 409) setError("Το username υπάρχει ήδη. Επιλέξτε διαφορετικό.");
      else setError("Σφάλμα κατά τη δημιουργία υπαλλήλου.");
    }
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setHistoryEmployee(null);
    setForm({ username: emp.username, password: "", full_name: emp.full_name, email: emp.email || "", phone: emp.phone || "", role: emp.role });
    setShowForm(false); setError(""); setSuccess("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setError(""); setSuccess("");
    try {
      await api.put(`/api/employees/${editingEmployee.employee_id}`, form);
      setSuccess("Ο υπάλληλος ενημερώθηκε επιτυχώς!");
      setEditingEmployee(null);
      setForm({ username: "", password: "", full_name: "", email: "", phone: "", role: "employee" });
      fetchEmployees();
    } catch { setError("Σφάλμα κατά την ενημέρωση υπαλλήλου."); }
  };

  const handleToggleStatus = async () => {
    if (!toggleEmployee) return;
    try {
      await api.delete(`/api/employees/${toggleEmployee.employee_id}`);
      const msg = toggleEmployee.is_active
        ? "Ο υπάλληλος απενεργοποιήθηκε επιτυχώς!"
        : "Ο υπάλληλος ενεργοποιήθηκε επιτυχώς!";
      setSuccess(msg); setToggleEmployee(null); fetchEmployees();
    } catch { setError("Σφάλμα κατά την ενημέρωση κατάστασης."); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Modal Απενεργοποίησης/Ενεργοποίησης */}
      {toggleEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {toggleEmployee.is_active ? "Απενεργοποίηση" : "Ενεργοποίηση"} Υπαλλήλου
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Είσαι σίγουρος ότι θέλεις να{" "}
              {toggleEmployee.is_active ? "απενεργοποιήσεις" : "ενεργοποιήσεις"} τον υπάλληλο{" "}
              <span className="font-semibold">{toggleEmployee.full_name}</span>;
              {toggleEmployee.is_active && (
                <span className="block mt-1 text-xs text-gray-400">Δεν θα μπορεί να συνδεθεί στην εφαρμογή.</span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setToggleEmployee(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Ακύρωση</button>
              <button onClick={handleToggleStatus} className={`px-4 py-2 text-white rounded-lg text-sm ${toggleEmployee.is_active ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}>
                {toggleEmployee.is_active ? "Απενεργοποίηση" : "Ενεργοποίηση"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Υπάλληλοι</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingEmployee(null); setHistoryEmployee(null); setError(""); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
        >
          {showForm ? "Ακύρωση" : "+ Νέος Υπάλληλος"}
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>
      )}

      {/* Φόρμα νέου υπαλλήλου */}
      {showForm && !editingEmployee && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Νέος Υπάλληλος</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Ονοματεπώνυμο *</label><input name="full_name" value={form.full_name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Username *</label><input name="username" value={form.username} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Password *</label><input name="password" type="password" value={form.password} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Τηλέφωνο</label><input name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Ρόλος</label><select name="role" value={form.role} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"><option value="employee">Υπάλληλος</option><option value="admin">Admin</option></select></div>
            {error && <p className="md:col-span-2 text-red-500 text-sm">{error}</p>}
            <div className="md:col-span-2 flex justify-end"><button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition text-sm">Αποθήκευση</button></div>
          </form>
        </div>
      )}

      {/* Φόρμα επεξεργασίας */}
      {editingEmployee && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Επεξεργασία: {editingEmployee.full_name}</h2>
          <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Ονοματεπώνυμο *</label><input name="full_name" value={form.full_name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Username *</label><input name="username" value={form.username} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Νέο Password (αφήστε κενό για να μην αλλάξει)</label><input name="password" type="password" value={form.password} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Τηλέφωνο</label><input name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Ρόλος</label><select name="role" value={form.role} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"><option value="employee">Υπάλληλος</option><option value="admin">Admin</option></select></div>
            {error && <p className="md:col-span-2 text-red-500 text-sm">{error}</p>}
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => { setEditingEmployee(null); setError(""); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Ακύρωση</button>
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition text-sm">Αποθήκευση</button>
            </div>
          </form>
        </div>
      )}

      {/* Ιστορικό Κινήσεων */}
      {historyEmployee && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              📋 Ιστορικό Κινήσεων — {historyEmployee.full_name}
            </h2>
            <button onClick={() => setHistoryEmployee(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕ Κλείσιμο</button>
          </div>

          {/* Φίλτρα βάσει permissions υπαλλήλου */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {getFilterOptions(historyEmployee).map((f) => (
              <button
                key={f.value}
                onClick={() => handleFilterChange(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterCategory === f.value
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {actionsLoading ? (
            <p className="text-gray-500 text-sm">Φόρτωση...</p>
          ) : actions.length === 0 ? (
            <p className="text-gray-500 text-sm">Δεν βρέθηκαν κινήσεις.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 pr-4">Ημερομηνία</th>
                    <th className="pb-2 pr-4">Ενέργεια</th>
                    <th className="pb-2 pr-4">Πελάτης</th>
                    <th className="pb-2">Λεπτομέρειες</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((action, index) => {
                    const info = ACTION_LABELS[action.action_type] || { label: action.action_type, emoji: "•", category: "other" };
                    const details = formatDetails(action.action_type, action.details);
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 pr-4 text-gray-500 text-xs whitespace-nowrap">{action.timestamp}</td>
                        <td className="py-2 pr-4">
                          <span className="flex items-center gap-1">
                            <span>{info.emoji}</span>
                            <span className="font-medium text-gray-700">{info.label}</span>
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-gray-600">{action.client_name || "-"}</td>
                        <td className="py-2 text-gray-500 text-xs">{details}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Λίστα Υπαλλήλων */}
      {loading ? (
        <p className="text-gray-500 text-center">Φόρτωση...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500 border-b">
                <th className="px-4 py-3">Ονοματεπώνυμο</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Τηλέφωνο</th>
                <th className="px-4 py-3">Ρόλος</th>
                <th className="px-4 py-3">Τελευταία Σύνδεση</th>
                <th className="px-4 py-3">Κατάσταση</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.employee_id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{emp.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.username}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.email || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.phone || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.role === "admin" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
                      {emp.role === "admin" ? "Admin" : "Υπάλληλος"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {emp.last_login ? new Date(emp.last_login).toLocaleDateString("el-GR") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {emp.is_active ? "Ενεργός" : "Ανενεργός"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(emp)} className="text-indigo-600 hover:text-indigo-800 text-xs" title="Επεξεργασία">✏️</button>
                      <button onClick={() => handleShowHistory(emp)} className="text-gray-500 hover:text-gray-700 text-xs" title="Ιστορικό">📋</button>
                      <button
                        onClick={() => setToggleEmployee(emp)}
                        className={`text-xs ${emp.is_active ? "text-red-500 hover:text-red-700" : "text-green-500 hover:text-green-700"}`}
                        title={emp.is_active ? "Απενεργοποίηση" : "Ενεργοποίηση"}
                      >
                        {emp.is_active ? "🔴" : "🟢"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}