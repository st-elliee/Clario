import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

interface DashboardData {
  total_clients: number;
  recent_clients: {
    client_id: number;
    name: string;
    client_type: string;
    created_at: string;
  }[];
  urgent: {
    client_id: number;
    pelatis: string;
    ypiresia: string;
    due_date: string;
    days_left: number;
    status: string;
  }[];
  unpaid_total?: number;
  income_this_month?: number;
  income_last_month?: number;
}

interface AnnualSummary {
  year: number;
  declarations: number;
  payments: number;
  misc: number;
  total: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unpaidData, setUnpaidData] = useState<any[]>([]);
  const [showUnpaid, setShowUnpaid] = useState(false);
  const [loadingUnpaid, setLoadingUnpaid] = useState(false);
  const [annualSummary, setAnnualSummary] = useState<AnnualSummary | null>(null);
  const [showAnnual, setShowAnnual] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get("/api/dashboard");
        setData(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();

    if (isAdmin) {
      const fetchAnnual = async () => {
        try {
          const res = await api.get("/api/reports/annual-summary", {
            params: { year: new Date().getFullYear() }
          });
          setAnnualSummary(res.data);
        } catch (error) {
          console.error(error);
        }
      };
      fetchAnnual();
    }
  }, []);

  const clientTypeLabel = (type: string) => {
    switch (type) {
      case "individual": return "Ιδιώτης";
      case "freelancer": return "Ελ. Επαγγελματίας";
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

  const dueDateColor = (days_left: number) => {
    if (days_left < 0) return "text-red-600 font-semibold";
    if (days_left <= 3) return "text-orange-500 font-semibold";
    if (days_left <= 7) return "text-yellow-600 font-semibold";
    return "text-gray-600";
  };

  const dueDateLabel = (days_left: number, due_date: string) => {
    if (!due_date) return "-";
    if (days_left < 0) return `${due_date} (${Math.abs(days_left)}μ. πριν)`;
    if (days_left === 0) return `${due_date} (Σήμερα!)`;
    if (days_left === 1) return `${due_date} (Αύριο!)`;
    return due_date;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "overdue": return "bg-red-100 text-red-700";
      case "in_progress": return "bg-blue-100 text-blue-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "overdue": return "Ληξιπρόθεσμο";
      case "in_progress": return "Σε εξέλιξη";
      case "pending": return "Εκκρεμεί";
      default: return status;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Φόρτωση...</p>
    </div>
  );

  if (!data) return null;

  const monthDiff = data.income_this_month !== undefined && data.income_last_month !== undefined
    ? data.income_this_month - data.income_last_month
    : null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Σειρά 1: Ενεργοί Πελάτες + Έσοδα μηνών */}
      {isAdmin && data.income_this_month !== undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-xs text-gray-500 mb-1">Ενεργοί Πελάτες</p>
            <p className="text-2xl font-bold text-indigo-600">{data.total_clients}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-xs text-gray-500 mb-1">Έσοδα Τρέχοντος Μήνα</p>
            <p className="text-2xl font-bold text-green-600">
              €{data.income_this_month!.toLocaleString("el-GR", { minimumFractionDigits: 2 })}
            </p>
            {monthDiff !== null && (
              <p className={`text-xs mt-1 ${monthDiff >= 0 ? "text-green-500" : "text-red-500"}`}>
                {monthDiff >= 0 ? "▲" : "▼"} €{Math.abs(monthDiff).toLocaleString("el-GR", { minimumFractionDigits: 2 })} vs προηγ. μήνα
              </p>
            )}
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-xs text-gray-500 mb-1">Έσοδα Προηγ. Μήνα</p>
            <p className="text-2xl font-bold text-gray-700">
              €{data.income_last_month!.toLocaleString("el-GR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
            <div className="bg-indigo-100 text-indigo-600 rounded-lg p-3 text-2xl">👥</div>
            <div>
              <p className="text-sm text-gray-500">Ενεργοί Πελάτες</p>
              <p className="text-3xl font-bold text-gray-800">{data.total_clients}</p>
            </div>
          </div>
        </div>
      )}

      {/* Σειρά 2: Συνολικά Έσοδα Έτους + Απλήρωτα */}
      {isAdmin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Συνολικά Έσοδα Έτους */}
            <div
              className="bg-white rounded-xl shadow p-5 cursor-pointer hover:bg-indigo-50 transition"
              onClick={() => setShowAnnual(!showAnnual)}
            >
              <p className="text-xs text-gray-500 mb-1">Συνολικά Έσοδα {new Date().getFullYear()}</p>
              <p className="text-2xl font-bold text-indigo-600">
                €{annualSummary ? annualSummary.total.toLocaleString("el-GR", { minimumFractionDigits: 2 }) : "..."}
              </p>
              <p className="text-xs text-gray-400 mt-1">{showAnnual ? "▲ Απόκρυψη" : "▼ Ανάλυση"}</p>
            </div>

            {/* Απλήρωτα Υπόλοιπα */}
            {data.unpaid_total !== undefined && (
              <div
                className="bg-white rounded-xl shadow p-5 cursor-pointer hover:bg-red-50 transition"
                onClick={async () => {
                  setShowUnpaid(!showUnpaid);
                  if (!showUnpaid && unpaidData.length === 0) {
                    setLoadingUnpaid(true);
                    try {
                      const res = await api.get("/api/unpaid");
                      setUnpaidData(res.data);
                    } catch (e) { console.error(e); }
                    finally { setLoadingUnpaid(false); }
                  }
                }}
              >
                <p className="text-xs text-gray-500 mb-1">Απλήρωτα Υπόλοιπα</p>
                <p className="text-2xl font-bold text-red-600">
                  €{data.unpaid_total.toLocaleString("el-GR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-400 mt-1">{showUnpaid ? "▲ Απόκρυψη" : "▼ Προβολή λεπτομερειών"}</p>
              </div>
            )}
          </div>

          {/* Ανάλυση Ετήσιων Εσόδων */}
          {showAnnual && annualSummary && (
            <div className="bg-indigo-50 rounded-xl shadow p-5 mb-6 border border-indigo-200">
              <h3 className="text-sm font-semibold text-indigo-800 mb-3">Ανάλυση Εσόδων {annualSummary.year}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Φορολογικές</p>
                  <p className="text-xl font-bold text-indigo-600">€{annualSummary.declarations.toLocaleString("el-GR", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Πληρωμές Επιχειρήσεων</p>
                  <p className="text-xl font-bold text-indigo-600">€{annualSummary.payments.toLocaleString("el-GR", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Διάφορα Έσοδα</p>
                  <p className="text-xl font-bold text-indigo-600">€{annualSummary.misc.toLocaleString("el-GR", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          )}

          {/* Απλήρωτα λεπτομέρειες */}
          {showUnpaid && (
            <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
              {loadingUnpaid ? (
                <p className="text-gray-500 text-sm p-4">Φόρτωση...</p>
              ) : unpaidData.length === 0 ? (
                <p className="text-gray-500 text-sm p-4">Δεν υπάρχουν απλήρωτα ποσά.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-500 border-b">
                      <th className="px-4 py-3">Πελάτης</th>
                      <th className="px-4 py-3">Υπηρεσία</th>
                      <th className="px-4 py-3">Περίοδος</th>
                      <th className="px-4 py-3">Χρεώθηκε</th>
                      <th className="px-4 py-3">Πληρώθηκε</th>
                      <th className="px-4 py-3">Υπόλοιπο</th>
                      <th className="px-4 py-3">Προθεσμία</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidData.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td
                          className="px-4 py-3 font-medium text-gray-800 hover:text-indigo-600 cursor-pointer"
                          onClick={() => navigate(`/clients/${item.client_id}`, { state: { fromDashboard: true } })}
                        >
                          {item.pelatis}
                        </td>
                        <td className="px-4 py-3">{item.ypiresia}</td>
                        <td className="px-4 py-3">{item.year} {item.period}</td>
                        <td className="px-4 py-3">€{Number(item.amount_billed).toFixed(2)}</td>
                        <td className="px-4 py-3">€{Number(item.amount_paid).toFixed(2)}</td>
                        <td className="px-4 py-3 text-red-600 font-medium">€{Number(item.amount_remaining).toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-500">{item.due_date || "-"}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/clients/${item.client_id}`, { state: { fromDashboard: true } })}
                            className="text-indigo-600 hover:underline text-xs"
                          >
                            Καρτέλα →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* Κάτω μέρος — 2 στήλες */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Πρόσφατοι Πελάτες */}
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Πρόσφατοι Πελάτες</h2>
            <button onClick={() => navigate("/clients")} className="text-indigo-600 hover:underline text-xs">
              Δες όλους →
            </button>
          </div>
          {data.recent_clients.length === 0 ? (
            <p className="text-gray-500 text-sm">Δεν υπάρχουν πελάτες.</p>
          ) : (
            <div className="space-y-2">
              {data.recent_clients.map((client) => (
                <div
                  key={client.client_id}
                  onClick={() => navigate(`/clients/${client.client_id}`)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{client.name}</p>
                    <p className="text-xs text-gray-400">{client.created_at}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${clientTypeColor(client.client_type)}`}>
                    {clientTypeLabel(client.client_type)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Επείγουσες Εκκρεμότητες */}
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Επείγουσες Εκκρεμότητες</h2>
          </div>
          {data.urgent.length === 0 ? (
            <p className="text-gray-500 text-sm">Δεν υπάρχουν επείγουσες εκκρεμότητες.</p>
          ) : (
            <div className="space-y-2">
              {data.urgent.map((item, index) => (
                <div
                  key={index}
                  onClick={() => navigate(`/clients/${item.client_id}`)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.pelatis}</p>
                    <p className="text-xs text-gray-500">{item.ypiresia}</p>
                    <p className={`text-xs ${dueDateColor(item.days_left)}`}>
                      {dueDateLabel(item.days_left, item.due_date)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}