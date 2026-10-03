import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

interface PendingItem {
  client_id: number;
  pelatis: string;
  ypiresia: string;
  categoria: string;
  year: number;
  period: string;
  status: string;
  payment_status: string;
  due_date: string;
  days_left: number;
}

interface Service {
  service_id: number;
  name: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "Όλες" },
  { value: "pending", label: "Εκκρεμεί" },
  { value: "in_progress", label: "Σε εξέλιξη" },
  { value: "overdue", label: "Ληξιπρόθεσμο" },
];

export default function Pending() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterService, setFilterService] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterWeek, setFilterWeek] = useState(false);
  const [filterDueDate, setFilterDueDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const availableServiceOptions = () => {
    if (!user) return [];
    const options: { value: string; label: string }[] = [];
    services.forEach((s) => options.push({ value: s.name, label: s.name }));
    return options;
};

  const fetchPending = async (service = "", status = "") => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (service) params.service = service;
      if (status) params.status = status;
      const response = await api.get("/api/pending", { params });
      setItems(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get("/api/services");
      setServices(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchServices();
    const state = location.state as {
      notification_service?: string;
      notification_due_date?: string;
      filter_week?: boolean;
      filter_status?: string;
      filter_service?: string;
      filter_due_date?: string;
    } | null;

    if (state?.notification_service) {
      setFilterService(state.notification_service);
      setFilterDueDate(state.notification_due_date || "");
      setFilterStatus("");
      setSearchTerm("");
      setFilterWeek(false);
      fetchPending(state.notification_service, "");
      window.history.replaceState({}, "");
    } else if (state?.filter_week) {
      setFilterWeek(true);
      setFilterStatus("");
      setFilterService("");
      setSearchTerm("");
      setFilterDueDate("");
      fetchPending("", "");
      window.history.replaceState({}, "");
    } else if (state?.filter_status) {
      setFilterStatus(state.filter_status);
      setFilterWeek(false);
      setFilterService("");
      setSearchTerm("");
      setFilterDueDate("");
      fetchPending("", state.filter_status);
      window.history.replaceState({}, "");
    } else if (state?.filter_service !== undefined) {
      setFilterService(state.filter_service || "");
      setFilterStatus(state.filter_status || "");
      setFilterWeek(state.filter_week || false);
      setFilterDueDate(state.filter_due_date || "");
      fetchPending(state.filter_service || "", state.filter_status || "");
      window.history.replaceState({}, "");
    } else {
      fetchPending(filterService, filterStatus);
    }
  }, [location.state]);
  
  const handleServiceChange = (service: string) => {
    setFilterService(service);
    setFilterWeek(false);
    fetchPending(service, filterStatus);
  };

  const handleStatusChange = (status: string) => {
    setFilterStatus(status);
    setFilterWeek(false);
    fetchPending(filterService, status);
  };

  const handleClear = () => {
    setFilterService("");
    setFilterStatus("");
    setSearchTerm("");
    setFilterWeek(false);
    setFilterDueDate("");
    fetchPending();
  };

  const parseDate = (d: string) => {
    const parts = d.split("/");
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  const filteredItems = items.filter((item) => {
    if (searchTerm && !item.pelatis.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterDueDate && item.due_date !== filterDueDate) return false;
    if (filterWeek) {
      if (!item.due_date) return false;
      const dueDate = parseDate(item.due_date);
      if (!dueDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const in7days = new Date();
      in7days.setDate(today.getDate() + 7);
      in7days.setHours(23, 59, 59, 999);
      if (dueDate < today || dueDate > in7days) return false;
    }
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    const da = parseDate(a.due_date);
    const db = parseDate(b.due_date);
    if (!da || !db) return 0;
    return da.getTime() - db.getTime();
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "overdue": return "bg-red-100 text-red-700";
      case "in_progress": return "bg-blue-100 text-blue-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const statusLabel = (status: string, ypiresia?: string) => {
  if (ypiresia === "Φορολογική Δήλωση Ε1") {
    return status === "completed" ? "Ολοκληρώθηκε" : "Δεν Ολοκληρώθηκε";
  }
  switch (status) {
    case "overdue": return "Ληξιπρόθεσμο";
    case "in_progress": return "Σε εξέλιξη";
    case "pending": return "Εκκρεμεί";
    case "completed": return "Ολοκληρώθηκε";
    default: return status;
  }
};

  const dueDateColor = (days_left: number) => {
    if (days_left === null || days_left === undefined) return "text-gray-400";
    if (days_left < 0) return "text-red-600 font-medium";
    if (days_left <= 3) return "text-orange-500 font-medium";
    if (days_left <= 7) return "text-yellow-600 font-medium";
    return "text-gray-600";
  };

  const dueDateLabel = (days_left: number, due_date: string) => {
    if (!due_date) return "-";
    if (days_left < 0) return `${due_date} (${Math.abs(days_left)} μέρες πριν)`;
    if (days_left === 0) return `${due_date} (Σήμερα!)`;
    if (days_left === 1) return `${due_date} (Αύριο!)`;
    return due_date;
  };

  const serviceOptions = availableServiceOptions();

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Εκκρεμότητες</h1>
          {filterWeek && (
            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">
              Εβδομάδα
            </span>
          )}
          {filterStatus === "overdue" && !filterWeek && (
            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
              Ληξιπρόθεσμες
            </span>
          )}
          {filterDueDate && (
            <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
              {filterDueDate}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">{sortedItems.length} εγγραφές</span>
      </div>

      {/* Φίλτρα */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Υπηρεσία</label>
          <select
            value={filterService}
            onChange={(e) => handleServiceChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-56"
          >
            <option value="">Όλες οι υπηρεσίες</option>
            {serviceOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Κατάσταση</label>
          <select
            value={filterStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Αναζήτηση Πελάτη</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Όνομα..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-48"
          />
        </div>
        {(filterService || filterStatus || searchTerm || filterWeek || filterDueDate) && (
          <button
            onClick={handleClear}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
          >
            Καθαρισμός
          </button>
        )}
      </div>

      {/* Πίνακας */}
      {loading ? (
        <p className="text-gray-500 text-center">Φόρτωση...</p>
      ) : sortedItems.length === 0 ? (
        <p className="text-gray-500 text-center">Δεν βρέθηκαν εκκρεμότητες.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500 border-b">
                <th className="px-4 py-3">Πελάτης</th>
                <th className="px-4 py-3">Υπηρεσία</th>
                <th className="px-4 py-3">Κατηγορία</th>
                <th className="px-4 py-3">Περίοδος</th>
                <th className="px-4 py-3">Κατάσταση</th>
                <th className="px-4 py-3">Πληρωμή</th>
                <th className="px-4 py-3">Προθεσμία</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td 
                    className="px-4 py-3 font-medium text-gray-800 hover:text-indigo-600 cursor-pointer"
                    onClick={() => navigate(`/clients/${item.client_id}`, { state: { fromPending: true, pendingState: { filter_service: filterService, filter_status: filterStatus, filter_week: filterWeek, filter_due_date: filterDueDate }}})}
                  >
                    {item.pelatis}
                  </td>
                  <td className="px-4 py-3">{item.ypiresia}</td>
                  <td className="px-4 py-3 text-gray-500">{item.categoria}</td>
                  <td className="px-4 py-3">{item.year} {item.period}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(item.status)}`}>
                      {statusLabel(item.status, item.ypiresia)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {item.payment_status === "paid" ? "Εξοφλήθηκε" : "Απλήρωτο"}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs ${dueDateColor(item.days_left)}`}>
                    {dueDateLabel(item.days_left, item.due_date)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/clients/${item.client_id}`, { state: { 
                        fromPending: true, 
                        pendingState: { 
                          filter_service: filterService, 
                          filter_status: filterStatus,
                          filter_week: filterWeek,
                          filter_due_date: filterDueDate
                          }
                      }})}
                      className="text-indigo-600 hover:underline text-xs font-medium"
                    >
                      Καρτέλα →
                    </button>
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