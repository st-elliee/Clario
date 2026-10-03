import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";

interface Client {
  client_id: number;
  last_name: string;
  first_name: string;
  company_name: string;
  client_type: string;
  phone: string;
  email: string;
  declaration_status: string | null;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  

  const fetchClients = async (searchTerm = "", type = "") => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (type) params.client_type = type;
      const response = await api.get("/api/clients", { params });
      setClients(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const state = location.state as {
    notification_service?: string;
    notification_due_date?: string;
    restoreSearch?: string;
  } | null;

  if (state?.notification_service) {
    setNotificationBanner(
      `Εμφάνιση πελατών με εκκρεμή: "${state.notification_service}" — Προθεσμία: ${state.notification_due_date}`
    );
    fetchClientsForNotification(state.notification_service, state.notification_due_date!);
    window.history.replaceState({}, "");
  } else if (state?.restoreSearch) {
    setSearch(state.restoreSearch);
    fetchClients(state.restoreSearch);
    window.history.replaceState({}, "");
  } else {
    fetchClients();
  }
}, []);

  const fetchClientsForNotification = async (service: string, due_date: string) => {
    setLoading(true);
    try {
      const response = await api.get("/api/notifications/clients", {
        params: { service, due_date },
      });
      setClients(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setNotificationBanner(null);
    fetchClients(search);
  };

  const handleClear = () => {
    setSearch("");
    setFilterType("");
    setNotificationBanner(null);
    fetchClients();
  };

  const clientTypeLabel = (type: string) => {
    switch (type) {
      case "individual": return "Ιδιώτης";
      case "freelancer": return "Ελεύθερος Επαγγελματίας";
      case "company": return "Εταιρεία";
      default: return type;
    }
  };

  const clientTypeColor = (type: string) => {
    switch (type) {
      case "individual": return "bg-blue-100 text-blue-700";
      case "freelancer": return "bg-purple-100 text-purple-700";
      case "company": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Πελάτες</h1>
        <button
          onClick={() => navigate("/clients/new")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
        >
          + Νέος Πελάτης
        </button>
      </div>

      {/* Banner ειδοποίησης */}
      {notificationBanner && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 text-sm flex items-center justify-between">
          <span>🔔 {notificationBanner}</span>
          <button onClick={handleClear} className="text-yellow-600 hover:underline text-xs">
            Εμφάνιση όλων
          </button>
        </div>
      )}

      {/* Αναζήτηση + Φίλτρο */}
      <div className="flex gap-2 mb-6 flex-wrap">
      <form onSubmit={handleSearch} className="flex gap-2 flex-1">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setNotificationBanner(null);
            fetchClients(e.target.value, filterType);
          }}
          placeholder="Αναζήτηση με επώνυμο, επωνυμία ή ΑΦΜ..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
        >
          Αναζήτηση
        </button>
      </form>
      <select
        value={filterType}
        onChange={(e) => {
          setFilterType(e.target.value);
          fetchClients(search, e.target.value);
        }}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        <option value="">Όλοι</option>
        <option value="individual">Ιδιώτες</option>
        <option value="company">Επιχειρήσεις</option>
      </select>
      {(search || notificationBanner || filterType) && (
        <button
          type="button"
          onClick={handleClear}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
        >
          Καθαρισμός
        </button>
      )}
    </div>

      {/* Λίστα Πελατών */}
      {loading ? (
        <p className="text-gray-500 text-center">Φόρτωση...</p>
      ) : clients.length === 0 ? (
        <p className="text-gray-500 text-center">Δεν βρέθηκαν πελάτες.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500 border-b">
                <th className="px-4 py-3">Ονοματεπώνυμο / Επωνυμία</th>
                <th className="px-4 py-3">Τύπος</th>
                <th className="px-4 py-3">Τηλέφωνο</th>
                <th className="px-4 py-3">Φορολογική {new Date().getFullYear()}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr 
                  key={client.client_id} 
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/clients/${client.client_id}`, { state: { fromClients: true, clientSearch: search } })}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {client.company_name || `${client.last_name} ${client.first_name || ""}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${clientTypeColor(client.client_type)}`}>
                      {clientTypeLabel(client.client_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{client.phone || "-"}</td>
                  <td className="px-4 py-3">
                    {client.declaration_status === "completed" ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Υποβλήθηκε</span>
                    ) : client.declaration_status === "pending" ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Δεν Υποβλήθηκε</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">-</span>
                    )}
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