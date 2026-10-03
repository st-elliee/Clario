import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

interface Client {
  client_id: number;
  afm: string;
  last_name: string;
  first_name: string;
  company_name: string;
  client_type: string;
  phone: string;
  email: string;
  address: string;
  doy: string;
  profession: string;
  kad: string;
  notes: string;
  created_at: string;
  amka: string;
  taxis_username: string;
  taxis_password: string;
}

interface ClientService {
  service_id: number;
  service_name: string;
  category: string;
  year: number;
  period: string;
  status: string;
  payment_status: string;
  amount_billed: number;
  amount_paid: number;
  amount_remaining: number;
  due_date: string;
  completed_date: string;
  notes: string;
  created_by: number;
}

interface Service {
  service_id: number;
  name: string;
  category: string;
}

interface EditServiceForm {
  amount_billed: string;
  amount_paid: string;
  due_date: string;
  notes: string;
}

interface Payment {
  payment_id: number;
  amount: number;
  payment_date: string;
  notes: string;
  created_by_name: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Εκκρεμεί" },
  { value: "in_progress", label: "Σε εξέλιξη" },
  { value: "completed", label: "Ολοκληρώθηκε" },
  { value: "overdue", label: "Ληξιπρόθεσμο" },
];

const STATUS_OPTIONS_DECLARATION = [
  { value: "completed", label: "Ολοκληρώθηκε" },
  { value: "pending", label: "Δεν Ολοκληρώθηκε" },
];

const PAYMENT_OPTIONS = [
  { value: "unpaid", label: "Απλήρωτο" },
  { value: "paid", label: "Εξοφλήθηκε" },
];

const PERIOD_OPTIONS = [
  "Ετήσιο",
  "Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος",
  "Μάιος", "Ιούνιος", "Ιούλιος", "Αύγουστος",
  "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος",
  "Q1", "Q2", "Q3", "Q4",
  "Α' Εξάμηνο", "Β' Εξάμηνο",
];

export default function ClientCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, hasAccess } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [services, setServices] = useState<ClientService[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddService, setShowAddService] = useState(false);
  const [addError, setAddError] = useState("");
  const [editingService, setEditingService] = useState<ClientService | null>(null);
  const [editForm, setEditForm] = useState<EditServiceForm>({
    amount_billed: "",
    amount_paid: "",
    due_date: "",
    notes: "",
  });
  const [deleteService, setDeleteService] = useState<ClientService | null>(null);
  const [newService, setNewService] = useState({
    service_id: "",
    year: new Date().getFullYear(),
    period: "",
    status: "pending",
    amount_billed: "",
    amount_paid: "0",
    due_date: "",
    notes: "",
  });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPayments, setShowPayments] = useState<{service_id: number, year: number} | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({ amount: "", payment_date: "", notes: "" });
  const [paymentError, setPaymentError] = useState("");
  const [showTaxisPassword, setShowTaxisPassword] = useState(false);
  const [showTaxisUsername, setShowTaxisUsername] = useState(false);
  const [showAmka, setShowAmka] = useState(false);

  const fetchServices = async () => {
    const res = await api.get(`/api/clients/${id}/services`);
    setServices(res.data);
  };

  const fetchPayments = async (service_id: number, year: number) => {
    try {
      const res = await api.get(`/api/clients/${id}/payments`, { params: { year, service_id } });
      setPayments(res.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientRes, servicesRes, allServicesRes] = await Promise.all([
          api.get(`/api/clients/${id}`),
          api.get(`/api/clients/${id}/services`),
          api.get("/api/services"),
        ]);
        setClient(clientRes.data);
        setServices(servicesRes.data);
        setAllServices(allServicesRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleStatusChange = async (service_id: number, year: number, period: string, newStatus: string) => {
    try {
      await api.put(`/api/clients/${id}/services/${service_id}/status`, null, { params: { year, period, status: newStatus } });
      await fetchServices();
    } catch (error) { console.error(error); }
  };

  const handlePaymentStatusChange = async (service_id: number, year: number, period: string, newPaymentStatus: string) => {
    try {
      await api.put(`/api/clients/${id}/services/${service_id}/payment`, null, { params: { year, period, payment_status: newPaymentStatus } });
      await fetchServices();
    } catch (error) { console.error(error); }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    try {
      await api.post(`/api/clients/${id}/services`, {
        service_id: parseInt(newService.service_id),
        year: newService.year,
        period: newService.period,
        status: newService.status,
        amount_billed: newService.amount_billed ? parseFloat(newService.amount_billed) : null,
        amount_paid: parseFloat(newService.amount_paid),
        due_date: newService.due_date || null,
        notes: newService.notes || null,
      });
      setShowAddService(false);
      setNewService({ service_id: "", year: new Date().getFullYear(), period: "", status: "pending", amount_billed: "", amount_paid: "0", due_date: "", notes: "" });
      await fetchServices();
    } catch { setAddError("Σφάλμα κατά την προσθήκη υπηρεσίας."); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/clients/${id}`);
      navigate("/clients");
    } catch { console.error("Σφάλμα διαγραφής"); }
  };

  const handleEditService = (service: ClientService) => {
    setEditingService(service);
    setEditForm({
      amount_billed: service.amount_billed?.toString() || "",
      amount_paid: service.amount_paid?.toString() || "",
      due_date: service.due_date ? new Date(service.due_date).toISOString().split("T")[0] : "",
      notes: service.notes || "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      await api.put(`/api/clients/${id}/services/${editingService.service_id}`, {
        amount_billed: editForm.amount_billed ? parseFloat(editForm.amount_billed) : null,
        amount_paid: editForm.amount_paid ? parseFloat(editForm.amount_paid) : null,
        due_date: editForm.due_date || null,
        notes: editForm.notes || null,
      }, { params: { year: editingService.year, period: editingService.period } });
      setEditingService(null);
      await fetchServices();
    } catch { console.error("Σφάλμα επεξεργασίας"); }
  };

  const handleDeleteService = async () => {
    if (!deleteService) return;
    try {
      await api.delete(`/api/clients/${id}/services/${deleteService.service_id}`, { params: { year: deleteService.year, period: deleteService.period } });
      setDeleteService(null);
      await fetchServices();
    } catch { console.error("Σφάλμα διαγραφής"); }
  };

  const handleAddPayment = async (e: React.FormEvent, service_id: number, year: number) => {
    e.preventDefault();
    setPaymentError("");
    try {
      await api.post(`/api/clients/${id}/payments`, {
        amount: parseFloat(newPayment.amount),
        payment_date: newPayment.payment_date,
        notes: newPayment.notes || null,
      }, { params: { year, service_id } });
      setNewPayment({ amount: "", payment_date: "", notes: "" });
      setShowAddPayment(false);
      await fetchPayments(service_id, year);
      await fetchServices();
    } catch { setPaymentError("Σφάλμα κατά την καταχώρηση."); }
  };

  const handleDeletePayment = async (payment_id: number, service_id: number, year: number) => {
    try {
      await api.delete(`/api/clients/${id}/payments/${payment_id}`, { params: { year, service_id } });
      await fetchPayments(service_id, year);
      await fetchServices();
    } catch { console.error("Σφάλμα διαγραφής δόσης"); }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700";
      case "overdue": return "bg-red-100 text-red-700";
      case "in_progress": return "bg-blue-100 text-blue-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const paymentColor = (payment_status: string) => {
    switch (payment_status) {
      case "paid": return "bg-green-100 text-green-700";
      case "unpaid": return "bg-gray-100 text-gray-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const clientTypeLabel = (type: string) => {
    switch (type) {
      case "individual": return "Ιδιώτης";
      case "freelancer": return "Ελεύθερος Επαγγελματίας";
      case "company": return "Εταιρεία";
      default: return type;
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Φόρτωση...</p></div>;
  if (!client) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Ο πελάτης δεν βρέθηκε.</p></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Modal Διαγραφής Πελάτη */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Διαγραφή Πελάτη</h3>
            <p className="text-gray-600 text-sm mb-4">Είσαι σίγουρη ότι θέλεις να διαγράψεις τον πελάτη <span className="font-semibold">{client.company_name || `${client.last_name} ${client.first_name || ""}`}</span>; Η ενέργεια δεν αναιρείται.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Ακύρωση</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">Διαγραφή</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Επεξεργασίας Υπηρεσίας */}
      {editingService && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Επεξεργασία: {editingService.service_name}</h3>
            <p className="text-xs text-gray-500 mb-4">{editingService.year} — {editingService.period}</p>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ποσό Χρέωσης (€)</label>
                <input type="number" step="0.01" value={editForm.amount_billed} onChange={(e) => setEditForm({ ...editForm, amount_billed: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ποσό Πληρωμής (€)</label>
                <input type="number" step="0.01" value={editForm.amount_paid} onChange={(e) => setEditForm({ ...editForm, amount_paid: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Προθεσμία</label>
                <input type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Σημειώσεις</label>
                <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setEditingService(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Ακύρωση</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">Αποθήκευση</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Διαγραφής Υπηρεσίας */}
      {deleteService && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Διαγραφή Υπηρεσίας</h3>
            <p className="text-gray-600 text-sm mb-4">Είσαι σίγουρη ότι θέλεις να διαγράψεις την υπηρεσία <span className="font-semibold">{deleteService.service_name}</span> ({deleteService.year} — {deleteService.period});</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteService(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Ακύρωση</button>
              <button onClick={handleDeleteService} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">Διαγραφή</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => {
        const state = location.state as { fromPending?: boolean; pendingState?: any; fromClients?: boolean; clientSearch?: string; fromDashboard?: boolean; fromReports?: boolean; reportsTab?: string } | null;
        if (state?.fromPending) {
          navigate("/pending", { state: state.pendingState });
        } else if (state?.fromDashboard) {
          navigate("/");
        } else if (state?.fromReports) {
          navigate("/reports", { state: { tab: state.reportsTab || "declarations" } });
        } else {
          navigate("/clients", { state: { restoreSearch: state?.clientSearch } });
        }
      }} className="text-indigo-600 hover:underline text-sm mb-4 flex items-center gap-1">
        ← Πίσω
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{client.company_name || `${client.last_name} ${client.first_name || ""}`}</h1>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full mt-1 inline-block">{clientTypeLabel(client.client_type)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(`/clients/${id}/edit`)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm">✏️ Επεξεργασία</button>
            {isAdmin && <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm">🗑️ Διαγραφή</button>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
          {client.afm && <div><p className="text-gray-500">ΑΦΜ</p><p className="font-medium">{client.afm}</p></div>}
          {client.phone && <div><p className="text-gray-500">Τηλέφωνο</p><p className="font-medium">{client.phone}</p></div>}
          {client.email && <div><p className="text-gray-500">Email</p><p className="font-medium">{client.email}</p></div>}
          {client.address && <div><p className="text-gray-500">Διεύθυνση</p><p className="font-medium">{client.address}</p></div>}
          {client.doy && <div><p className="text-gray-500">ΔΟΥ</p><p className="font-medium">{client.doy}</p></div>}
          {client.profession && <div><p className="text-gray-500">Επάγγελμα</p><p className="font-medium">{client.profession}</p></div>}
          {client.kad && <div><p className="text-gray-500">ΚΑΔ</p><p className="font-medium">{client.kad}</p></div>}
          {client.amka && (
            <div>
              <p className="text-gray-500">ΑΜΚΑ</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">{showAmka ? client.amka : "••••••••"}</p>
                <button onClick={() => setShowAmka(!showAmka)} className="text-gray-400 hover:text-gray-600">
                  {showAmka ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          )}
          {client.taxis_username && (
            <div>
              <p className="text-gray-500">Taxis Username</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">{showTaxisUsername ? client.taxis_username : "••••••••"}</p>
                <button onClick={() => setShowTaxisUsername(!showTaxisUsername)} className="text-gray-400 hover:text-gray-600">
                  {showTaxisUsername ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          )}
          {client.taxis_password && (
            <div>
              <p className="text-gray-500">Taxis Password</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">{showTaxisPassword ? client.taxis_password : "••••••••"}</p>
                <button onClick={() => setShowTaxisPassword(!showTaxisPassword)} className="text-gray-400 hover:text-gray-600">
                  {showTaxisPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          )}
        </div>
        {client.notes && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-gray-700">
            <p className="font-medium text-yellow-700 mb-1">Σημειώσεις</p>
            <p>{client.notes}</p>
          </div>
        )}
      </div>

      {/* Υπηρεσίες */}
      {hasAccess("services") && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Υπηρεσίες</h2>
            <button onClick={() => setShowAddService(!showAddService)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition text-sm">
              {showAddService ? "Ακύρωση" : "+ Υπηρεσία"}
            </button>
          </div>
          {showAddService && (
            <form onSubmit={handleAddService} className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Νέα Υπηρεσία</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Υπηρεσία *</label>
                  <select value={newService.service_id} onChange={(e) => setNewService({ ...newService, service_id: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">Επιλέξτε...</option>
                    {allServices.map((s) => <option key={s.service_id} value={s.service_id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Έτος *</label>
                  <input type="number" value={newService.year} onChange={(e) => setNewService({ ...newService, year: parseInt(e.target.value) })} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Περίοδος *</label>
                  <select value={newService.period} onChange={(e) => setNewService({ ...newService, period: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">Επιλέξτε...</option>
                    {PERIOD_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Κατάσταση</label>
                  <select value={newService.status} onChange={(e) => setNewService({ ...newService, status: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ετήσιο Ποσό (€)</label>
                  <input type="number" step="0.01" value={newService.amount_billed} onChange={(e) => setNewService({ ...newService, amount_billed: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Προθεσμία</label>
                  <input type="date" value={newService.due_date} onChange={(e) => setNewService({ ...newService, due_date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              {addError && <p className="text-red-500 text-xs mt-2">{addError}</p>}
              <div className="flex justify-end mt-3">
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm">Προσθήκη</button>
              </div>
            </form>
          )}
          {services.length === 0 ? (
            <p className="text-gray-500 text-sm">Δεν υπάρχουν υπηρεσίες για αυτόν τον πελάτη.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Υπηρεσία</th>
                    <th className="pb-2">Κατηγορία</th>
                    <th className="pb-2">Περίοδος</th>
                    <th className="pb-2">Κατάσταση</th>
                    <th className="pb-2">Πληρωμή</th>
                    <th className="pb-2">Χρεώθηκε</th>
                    <th className="pb-2">Πληρώθηκε</th>
                    <th className="pb-2">Υπόλοιπο</th>
                    <th className="pb-2">Προθεσμία</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service, index) => (
                    <>
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium">{service.service_name}</td>
                        <td className="py-2 text-gray-500">{service.category}</td>
                        <td className="py-2">{service.year} {service.period}</td>
                        <td className="py-2">
                          <select value={service.status} onChange={(e) => handleStatusChange(service.service_id, service.year, service.period, e.target.value)} className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 ${statusColor(service.status)}`}>
                            {(service.service_id === 1 ? STATUS_OPTIONS_DECLARATION : STATUS_OPTIONS).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </td>
                        <td className="py-2">
                          {service.service_id === 2 ? (
                            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${service.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                              {service.payment_status === "paid" ? "Εξοφλήθηκε" : "Εκκρεμεί"}
                            </span>
                          ) : (
                            <select value={service.payment_status} onChange={(e) => handlePaymentStatusChange(service.service_id, service.year, service.period, e.target.value)} className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 ${paymentColor(service.payment_status)}`}>
                              {PAYMENT_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                          )}
                        </td>
                        <td className="py-2">
                          {isAdmin || service.created_by === user?.employee_id ? `€${service.amount_billed?.toFixed(2) || "-"}` : "***"}
                        </td>
                        <td className="py-2">
                          {isAdmin || service.created_by === user?.employee_id ? `€${service.amount_paid?.toFixed(2) || "-"}` : "***"}
                        </td>
                        <td className="py-2">
                          {isAdmin || service.created_by === user?.employee_id ? `€${service.amount_remaining?.toFixed(2) || "-"}` : "***"}
                        </td>
                        <td className="py-2">{service.due_date ? new Date(service.due_date).toLocaleDateString("el-GR") : "-"}</td>
                        <td className="py-2">
                          <div className="flex gap-2">
                            {service.service_id === 2 && isAdmin && (
                              <button
                                onClick={async () => {
                                  if (showPayments?.service_id === service.service_id && showPayments?.year === service.year) {
                                    setShowPayments(null);
                                  } else {
                                    setShowPayments({ service_id: service.service_id, year: service.year });
                                    await fetchPayments(service.service_id, service.year);
                                  }
                                }}
                                className="text-green-600 hover:text-green-800 text-xs" title="Δόσεις"
                              >
                                💰
                              </button>
                            )}
                            {(isAdmin || service.created_by === user?.employee_id) && (
                              <button onClick={() => handleEditService(service)} className="text-indigo-600 hover:text-indigo-800 text-xs" title="Επεξεργασία">✏️</button>
                            )}
                            {isAdmin && (
                              <button onClick={() => setDeleteService(service)} className="text-red-500 hover:text-red-700 text-xs" title="Διαγραφή">🗑️</button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Panel Δόσεων */}
                      {showPayments?.service_id === service.service_id && showPayments?.year === service.year && (
                        <tr key={`payments-${index}`}>
                          <td colSpan={10} className="bg-green-50 px-4 py-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-green-800">Ιστορικό Δόσεων {service.year}</h4>
                              <button
                                onClick={() => setShowAddPayment(!showAddPayment)}
                                className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700"
                              >
                                {showAddPayment ? "Ακύρωση" : "+ Νέα Δόση"}
                              </button>
                            </div>
                            {showAddPayment && (
                              <form onSubmit={(e) => handleAddPayment(e, service.service_id, service.year)} className="bg-white rounded-lg p-3 mb-3">
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Ποσό (€) *</label>
                                    <input type="number" step="0.01" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Ημερομηνία *</label>
                                    <input type="date" value={newPayment.payment_date} onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Σημειώσεις</label>
                                    <input type="text" value={newPayment.notes} onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
                                  </div>
                                </div>
                                {paymentError && <p className="text-red-500 text-xs mt-2">{paymentError}</p>}
                                <div className="flex justify-end mt-2">
                                  <button type="submit" className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs hover:bg-green-700">Καταχώρηση</button>
                                </div>
                              </form>
                            )}
                            {payments.length === 0 ? (
                              <p className="text-sm text-gray-500">Δεν υπάρχουν δόσεις ακόμα.</p>
                            ) : (
                              <table className="w-full text-xs bg-white rounded-lg overflow-hidden">
                                <thead className="bg-green-100">
                                  <tr className="text-left text-green-800">
                                    <th className="px-3 py-2">Ημερομηνία</th>
                                    <th className="px-3 py-2">Ποσό</th>
                                    <th className="px-3 py-2">Σημειώσεις</th>
                                    <th className="px-3 py-2">Καταχωρήθηκε από</th>
                                    <th className="px-3 py-2"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {payments.map((p) => (
                                    <tr key={p.payment_id} className="border-b hover:bg-green-50">
                                      <td className="px-3 py-2">{p.payment_date}</td>
                                      <td className="px-3 py-2 font-medium text-green-700">€{Number(p.amount).toFixed(2)}</td>
                                      <td className="px-3 py-2 text-gray-500">{p.notes || "-"}</td>
                                      <td className="px-3 py-2 text-gray-400">{p.created_by_name}</td>
                                      <td className="px-3 py-2">
                                        {isAdmin && (
                                          <button onClick={() => handleDeletePayment(p.payment_id, service.service_id, service.year)} className="text-red-500 hover:text-red-700">🗑️</button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-green-100">
                                  <tr>
                                    <td className="px-3 py-2 font-bold text-green-800">Σύνολο</td>
                                    <td className="px-3 py-2 font-bold text-green-700">€{payments.reduce((s, p) => s + Number(p.amount), 0).toFixed(2)}</td>
                                    <td colSpan={3}></td>
                                  </tr>
                                </tfoot>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}