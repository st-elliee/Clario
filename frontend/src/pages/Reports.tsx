import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate, useLocation } from "react-router-dom";
interface EmployeeRevenue {
  employee_id: number;
  full_name: string;
  year: number;
  month: number;
  total_services: number;
  total_billed: number;
  total_paid: number;
  total_pending: number;
}

interface Service {
  service_id: number;
  name: string;
}

interface ClientEntry {
  client_id: number;
  pelatis: string;
  phone: string;
  afm: string;
}

interface ServiceExport {
  base_year: number;
  current_year: number;
  total_base: number;
  total_done: number;
  total_pending: number;
  done: ClientEntry[];
  pending: ClientEntry[];
}

interface MiscIncome {
  income_id: number;
  amount: number;
  employee_name: string;
  description: string;
  income_date: string;
}

interface PaymentByYear {
  year: number;
  client_id: number;
  pelatis: string;
  amount_billed: number;
  amount_paid: number;
  amount_remaining: number;
  payment_status: string;
}

interface DeclarationUnpaid {
  client_id: number;
  pelatis: string;
  amount_billed: number;
  amount_paid: number;
  amount_remaining: number;
  payment_status: string;
  month: number;
}

const MONTH_NAMES: Record<number, string> = {
  1: "Ιανουάριος", 2: "Φεβρουάριος", 3: "Μάρτιος", 4: "Απρίλιος",
  5: "Μάιος", 6: "Ιούνιος", 7: "Ιούλιος", 8: "Αύγουστος",
  9: "Σεπτέμβριος", 10: "Οκτώβριος", 11: "Νοέμβριος", 12: "Δεκέμβριος",
};

const EMPLOYEES = ["Νίκος", "Μαρία", "Ελένη", "Κώστας", "Σοφία", "Πέτρος"];

export default function Reports() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"declarations" | "misc" | "export">("declarations");

  // Φορολογικές
  const [revenueData, setRevenueData] = useState<EmployeeRevenue[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedServiceId, setSelectedServiceId] = useState<number>(1);

  // Απλήρωτα φορολογικών
  const [declarationsUnpaid, setDeclarationsUnpaid] = useState<DeclarationUnpaid[]>([]);
  const [declarationsUnpaidLoading, setDeclarationsUnpaidLoading] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  // Πληρωμές Επιχειρήσεων
  const [paymentsByYear, setPaymentsByYear] = useState<PaymentByYear[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  // Διάφορα
  const [miscData, setMiscData] = useState<MiscIncome[]>([]);
  const [miscLoading, setMiscLoading] = useState(false);
  const [miscYear, setMiscYear] = useState<number>(new Date().getFullYear());
  const [showAddMisc, setShowAddMisc] = useState(false);
  const [newMisc, setNewMisc] = useState({ amount: "", employee_name: EMPLOYEES[0], description: "", income_date: new Date().toISOString().split("T")[0] });
  const [miscError, setMiscError] = useState("");

  // Εξαγωγή
  const [services, setServices] = useState<Service[]>([]);
  const [exportServiceId, setExportServiceId] = useState<number>(1);
  const [exportBaseYear, setExportBaseYear] = useState<number>(new Date().getFullYear() - 1);
  const [exportCurrentYear, setExportCurrentYear] = useState<number>(new Date().getFullYear());
  const [exportData, setExportData] = useState<ServiceExport | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportTab, setExportTab] = useState<"pending" | "done">("pending");

  useEffect(() => {
    api.get("/api/services").then(res => setServices(res.data));
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setRevenueLoading(true);
      try {
        const res = await api.get("/api/reports/employee-revenue", {
          params: { service_id: selectedServiceId }
        });
        setRevenueData(res.data);
        if (res.data.length > 0) {
          const maxYear = Math.max(...res.data.map((d: EmployeeRevenue) => d.year));
          setSelectedYear(maxYear);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setRevenueLoading(false);
      }
    };
    fetch();
  }, [selectedServiceId]);

  useEffect(() => {
    if (selectedServiceId === 1) {
      fetchDeclarationsUnpaid(selectedYear);
    }
  }, [selectedYear, selectedServiceId]);

  useEffect(() => {
    if (selectedServiceId === 2) {
      const fetch = async () => {
        setPaymentsLoading(true);
        try {
          const res = await api.get("/api/reports/payments-by-year");
          setPaymentsByYear(res.data);
        } catch (error) { console.error(error); }
        finally { setPaymentsLoading(false); }
      };
      fetch();
    }
  }, [selectedServiceId]);

  useEffect(() => {
    if (activeTab === "misc") fetchMisc();
  }, [activeTab, miscYear]);

  const location = useLocation();

useEffect(() => {
  const state = location.state as { tab?: string } | null;
  if (state?.tab) {
    setActiveTab(state.tab as any);
    window.history.replaceState({}, "");
  }
}, []);

  const fetchDeclarationsUnpaid = async (year: number) => {
    setDeclarationsUnpaidLoading(true);
    try {
      const res = await api.get("/api/reports/declarations-unpaid", { params: { year } });
      setDeclarationsUnpaid(res.data);
    } catch (error) { console.error(error); }
    finally { setDeclarationsUnpaidLoading(false); }
  };

  const fetchMisc = async () => {
    setMiscLoading(true);
    try {
      const res = await api.get("/api/misc-income", { params: { year: miscYear } });
      setMiscData(res.data);
    } catch (error) { console.error(error); }
    finally { setMiscLoading(false); }
  };

  const handleAddMisc = async (e: React.FormEvent) => {
    e.preventDefault();
    setMiscError("");
    try {
      await api.post("/api/misc-income", {
        amount: parseFloat(newMisc.amount),
        employee_name: newMisc.employee_name,
        description: newMisc.description || null,
        income_date: newMisc.income_date,
      });
      setNewMisc({ amount: "", employee_name: EMPLOYEES[0], description: "", income_date: new Date().toISOString().split("T")[0] });
      setShowAddMisc(false);
      await fetchMisc();
    } catch { setMiscError("Σφάλμα κατά την καταχώρηση."); }
  };

  const handleDeleteMisc = async (income_id: number) => {
    try {
      await api.delete(`/api/misc-income/${income_id}`);
      await fetchMisc();
    } catch { console.error("Σφάλμα διαγραφής"); }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await api.get("/api/reports/service-export", {
        params: { service_id: exportServiceId, base_year: exportBaseYear, current_year: exportCurrentYear }
      });
      setExportData(res.data);
      setExportTab("pending");
    } catch (error) { console.error(error); }
    finally { setExportLoading(false); }
  };

  const filteredRevenue = revenueData.filter(d => d.year === selectedYear);
  const months = [...new Set(filteredRevenue.map(d => d.month))].sort((a, b) => b - a);
  const employees = [...new Map(revenueData.map(d => [d.employee_id, d.full_name])).entries()];
  const years = [...new Set(revenueData.map(d => d.year))].sort((a, b) => b - a);
  const availableYears = years.length > 0 ? years : [2025, 2026];

  const miscByEmployee = EMPLOYEES.map(emp => ({
    name: emp,
    total: miscData.filter(m => m.employee_name === emp).reduce((s, m) => s + Number(m.amount), 0),
    count: miscData.filter(m => m.employee_name === emp).length,
  })).filter(e => e.total > 0);

  const miscTotal = miscData.reduce((s, m) => s + Number(m.amount), 0);

  if (revenueLoading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Φόρτωση...</p>
    </div>
  );

  const renderRevenueTab = () => (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button onClick={() => setSelectedServiceId(1)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedServiceId === 1 ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            Φορολογικές Δηλώσεις
          </button>
          <button onClick={() => setSelectedServiceId(2)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedServiceId === 2 ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            Πληρωμές Επιχειρήσεων
          </button>
        </div>
        {selectedServiceId === 1 && (
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>

      {/* Φορολογικές */}
      {selectedServiceId === 1 && (
        <>
          {months.length === 0 ? (
            <p className="text-gray-500 text-center">Δεν υπάρχουν δεδομένα για το {selectedYear}.</p>
          ) : (
            <div className="space-y-6">
              {months.map(month => {
                const monthData = filteredRevenue.filter(d => d.month === month);
                const monthTotalBilled   = monthData.reduce((s, d) => s + Number(d.total_billed), 0);
                const monthTotalPaid     = monthData.reduce((s, d) => s + Number(d.total_paid), 0);
                const monthTotalPending  = monthData.reduce((s, d) => s + Number(d.total_pending), 0);
                const monthTotalServices = monthData.reduce((s, d) => s + Number(d.total_services), 0);
                const monthUnpaid = declarationsUnpaid.filter(d => d.month === month);

                return (
                  <div key={month} className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="bg-indigo-600 px-6 py-3 flex items-center justify-between">
                      <h2 className="text-white font-semibold text-lg">{MONTH_NAMES[month]} {selectedYear}</h2>
                      <span className="text-indigo-200 text-sm">{monthTotalServices} υπηρεσίες</span>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-500 border-b">
                          <th className="px-6 py-3">Υπάλληλος</th>
                          <th className="px-6 py-3 text-right">Υπηρεσίες</th>
                          <th className="px-6 py-3 text-right">Χρεώθηκε</th>
                          <th className="px-6 py-3 text-right">Εισπράχθηκε</th>
                          <th className="px-6 py-3 text-right">Εκκρεμεί</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthData.map((row) => (
                          <tr key={row.employee_id} className="border-b hover:bg-gray-50">
                            <td className="px-6 py-3 font-medium text-gray-800">{row.full_name}</td>
                            <td className="px-6 py-3 text-right text-gray-600">{row.total_services}</td>
                            <td className="px-6 py-3 text-right text-indigo-600 font-medium">€{Number(row.total_billed).toFixed(2)}</td>
                            <td className="px-6 py-3 text-right text-green-600 font-medium">€{Number(row.total_paid).toFixed(2)}</td>
                            <td className="px-6 py-3 text-right text-red-500 font-medium">€{Number(row.total_pending).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                        <tr>
                          <td className="px-6 py-3 font-bold text-gray-800">Σύνολο Μήνα</td>
                          <td className="px-6 py-3 text-right font-bold text-gray-700">{monthTotalServices}</td>
                          <td className="px-6 py-3 text-right font-bold text-indigo-700">€{monthTotalBilled.toFixed(2)}</td>
                          <td className="px-6 py-3 text-right font-bold text-green-700">€{monthTotalPaid.toFixed(2)}</td>
                          <td className="px-6 py-3 text-right font-bold text-red-600 cursor-pointer" onClick={() => setExpandedMonth(expandedMonth === month ? null : month)}>
                            €{monthTotalPending.toFixed(2)} {monthUnpaid.length > 0 ? (expandedMonth === month ? "▲" : "▼") : ""}
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Αναπτυσσόμενη λίστα απλήρωτων */}
                    {expandedMonth === month && monthUnpaid.length > 0 && (
                      <div className="bg-red-50 px-6 py-4">
                        <h4 className="text-sm font-semibold text-red-700 mb-3">Απλήρωτα {MONTH_NAMES[month]} {selectedYear}</h4>
                        {declarationsUnpaidLoading ? (
                          <p className="text-gray-500 text-sm">Φόρτωση...</p>
                        ) : (
                          <table className="w-full text-xs bg-white rounded-lg overflow-hidden">
                            <thead className="bg-red-100">
                              <tr className="text-left text-red-800">
                                <th className="px-3 py-2">Πελάτης</th>
                                <th className="px-3 py-2 text-right">Χρεώθηκε</th>
                                <th className="px-3 py-2 text-right">Πληρώθηκε</th>
                                <th className="px-3 py-2 text-right">Υπόλοιπο</th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthUnpaid.map(p => (
                                <tr key={p.client_id} className="border-b hover:bg-red-50 cursor-pointer" onClick={() => navigate(`/clients/${p.client_id}`, { state: { fromReports: true } })}>
                                  <td className="px-3 py-2 font-medium text-indigo-600 hover:underline">{p.pelatis}</td>
                                  <td className="px-3 py-2 text-right">€{Number(p.amount_billed).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right text-green-600">€{Number(p.amount_paid).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right text-red-600 font-medium">€{Number(p.amount_remaining).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Ετήσιο Σύνολο */}
              <div className="bg-indigo-50 rounded-xl shadow p-6 border border-indigo-200">
                <h2 className="text-lg font-bold text-indigo-800 mb-4">Ετήσιο Σύνολο {selectedYear}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Σύνολο Υπηρεσιών</p>
                    <p className="text-2xl font-bold text-gray-800">{filteredRevenue.reduce((s, d) => s + Number(d.total_services), 0)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Συνολικές Χρεώσεις</p>
                    <p className="text-2xl font-bold text-indigo-600">€{filteredRevenue.reduce((s, d) => s + Number(d.total_billed), 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Συνολικές Εισπράξεις</p>
                    <p className="text-2xl font-bold text-green-600">€{filteredRevenue.reduce((s, d) => s + Number(d.total_paid), 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Συνολικά Εκκρεμή</p>
                    <p className="text-2xl font-bold text-red-500">€{filteredRevenue.reduce((s, d) => s + Number(d.total_pending), 0).toFixed(2)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {employees.map(([emp_id, emp_name]) => {
                    const empData = filteredRevenue.filter(d => d.employee_id === emp_id);
                    if (empData.length === 0) return null;
                    const billed  = empData.reduce((s, d) => s + Number(d.total_billed), 0);
                    const paid    = empData.reduce((s, d) => s + Number(d.total_paid), 0);
                    const pending = empData.reduce((s, d) => s + Number(d.total_pending), 0);
                    return (
                      <div key={emp_id} className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="font-semibold text-gray-800 mb-2">{emp_name}</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div><p className="text-gray-500">Χρεώθηκε</p><p className="font-bold text-indigo-600">€{billed.toFixed(2)}</p></div>
                          <div><p className="text-gray-500">Εισπράχθηκε</p><p className="font-bold text-green-600">€{paid.toFixed(2)}</p></div>
                          <div><p className="text-gray-500">Εκκρεμεί</p><p className="font-bold text-red-500">€{pending.toFixed(2)}</p></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Πληρωμές Επιχειρήσεων */}
      {selectedServiceId === 2 && (
        <div className="space-y-4">
          {paymentsLoading ? (
            <p className="text-gray-500 text-center">Φόρτωση...</p>
          ) : (
            <>
              {[...new Set(paymentsByYear.map(p => p.year))].sort((a,b) => b-a).map(year => {
                const yearData = paymentsByYear.filter(p => p.year === year);
                const totalBilled = yearData.reduce((s, p) => s + Number(p.amount_billed), 0);
                const totalPaid = yearData.reduce((s, p) => s + Number(p.amount_paid), 0);
                const totalRemaining = yearData.reduce((s, p) => s + Number(p.amount_remaining), 0);
                return (
                  <div key={year} className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="bg-indigo-600 px-6 py-3 flex items-center justify-between cursor-pointer" onClick={() => setExpandedYear(expandedYear === year ? null : year)}>
                      <h2 className="text-white font-semibold text-lg">Πληρωμές {year}</h2>
                      <span className="text-indigo-200 text-sm">{yearData.length} εταιρίες {expandedYear === year ? "▲" : "▼"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 p-4 bg-indigo-50">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Χρεώθηκε</p>
                        <p className="font-bold text-indigo-600">€{totalBilled.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Εισπράχθηκε</p>
                        <p className="font-bold text-green-600">€{totalPaid.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Υπόλοιπο</p>
                        <p className="font-bold text-red-500">€{totalRemaining.toFixed(2)}</p>
                      </div>
                    </div>
                    {expandedYear === year && (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr className="text-left text-gray-500 border-b">
                            <th className="px-4 py-3">Εταιρία</th>
                            <th className="px-4 py-3 text-right">Χρεώθηκε</th>
                            <th className="px-4 py-3 text-right">Πληρώθηκε</th>
                            <th className="px-4 py-3 text-right">Υπόλοιπο</th>
                            <th className="px-4 py-3">Κατάσταση</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yearData.map(p => (
                            <tr key={p.client_id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/clients/${p.client_id}`, { state: { fromReports: true } })}>
                              <td className="px-4 py-3 font-medium text-indigo-600 hover:underline">{p.pelatis}</td>
                              <td className="px-4 py-3 text-right">€{Number(p.amount_billed).toFixed(2)}</td>
                              <td className="px-4 py-3 text-right text-green-600">€{Number(p.amount_paid).toFixed(2)}</td>
                              <td className="px-4 py-3 text-right text-red-500">€{Number(p.amount_remaining).toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {p.payment_status === 'paid' ? 'Εξοφλήθηκε' : 'Εκκρεμεί'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Αναφορές</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setActiveTab("declarations")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "declarations" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          📋 Φορολογικές / Πληρωμές
        </button>
        <button onClick={() => setActiveTab("misc")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "misc" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          💵 Διάφορα Έσοδα
        </button>
        <button onClick={() => setActiveTab("export")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "export" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          📊 Εξαγωγή Δεδομένων
        </button>
      </div>

      {activeTab === "declarations" && renderRevenueTab()}

      {/* Διάφορα Έσοδα */}
      {activeTab === "misc" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <select value={miscYear} onChange={(e) => setMiscYear(parseInt(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={() => setShowAddMisc(!showAddMisc)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm">
              {showAddMisc ? "Ακύρωση" : "+ Νέα Εγγραφή"}
            </button>
          </div>
          {showAddMisc && (
            <form onSubmit={handleAddMisc} className="bg-white rounded-xl shadow p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Νέα Εγγραφή Διαφόρων</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ποσό (€) *</label>
                  <input type="number" step="0.01" value={newMisc.amount} onChange={(e) => setNewMisc({ ...newMisc, amount: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Υπάλληλος *</label>
                  <select value={newMisc.employee_name} onChange={(e) => setNewMisc({ ...newMisc, employee_name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ημερομηνία *</label>
                  <input type="date" value={newMisc.income_date} onChange={(e) => setNewMisc({ ...newMisc, income_date: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Περιγραφή</label>
                  <input type="text" value={newMisc.description} onChange={(e) => setNewMisc({ ...newMisc, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              {miscError && <p className="text-red-500 text-xs mt-2">{miscError}</p>}
              <div className="flex justify-end mt-3">
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm">Καταχώρηση</button>
              </div>
            </form>
          )}
          {miscByEmployee.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {miscByEmployee.map(emp => (
                <div key={emp.name} className="bg-white rounded-xl shadow p-4">
                  <p className="font-semibold text-gray-800">{emp.name}</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">€{emp.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{emp.count} εγγραφές</p>
                </div>
              ))}
              <div className="bg-indigo-50 rounded-xl shadow p-4 border border-indigo-200">
                <p className="font-semibold text-indigo-800">Σύνολο {miscYear}</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">€{miscTotal.toFixed(2)}</p>
                <p className="text-xs text-gray-400">{miscData.length} εγγραφές</p>
              </div>
            </div>
          )}
          {miscLoading ? (
            <p className="text-gray-500 text-center">Φόρτωση...</p>
          ) : miscData.length === 0 ? (
            <p className="text-gray-500 text-center">Δεν υπάρχουν εγγραφές για το {miscYear}.</p>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500 border-b">
                    <th className="px-4 py-3">Ημερομηνία</th>
                    <th className="px-4 py-3">Υπάλληλος</th>
                    <th className="px-4 py-3">Ποσό</th>
                    <th className="px-4 py-3">Περιγραφή</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {miscData.map((item) => (
                    <tr key={item.income_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{item.income_date}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{item.employee_name}</td>
                      <td className="px-4 py-3 font-medium text-green-600">€{Number(item.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-500">{item.description || "-"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteMisc(item.income_id)} className="text-red-500 hover:text-red-700 text-xs">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 font-bold text-gray-800">Σύνολο</td>
                    <td className="px-4 py-3 font-bold text-green-700">€{miscTotal.toFixed(2)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Εξαγωγή Δεδομένων */}
      {activeTab === "export" && (
        <div>
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Παράμετροι Εξαγωγής</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Υπηρεσία</label>
                <select value={exportServiceId} onChange={(e) => setExportServiceId(parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {services.map(s => <option key={s.service_id} value={s.service_id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Έτος Βάσης (πέρσι)</label>
                <input type="number" value={exportBaseYear} onChange={(e) => setExportBaseYear(parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Τρέχον Έτος (φέτος)</label>
                <input type="number" value={exportCurrentYear} onChange={(e) => setExportCurrentYear(parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={handleExport} disabled={exportLoading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition text-sm disabled:opacity-50">
                {exportLoading ? "Φόρτωση..." : "🔍 Εξαγωγή"}
              </button>
            </div>
          </div>
          {exportData && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow p-5 text-center">
                  <p className="text-xs text-gray-500 mb-1">Βάση ({exportData.base_year})</p>
                  <p className="text-3xl font-bold text-gray-800">{exportData.total_base}</p>
                  <p className="text-xs text-gray-400">πελάτες</p>
                </div>
                <div className="bg-green-50 rounded-xl shadow p-5 text-center border border-green-200">
                  <p className="text-xs text-gray-500 mb-1">Ολοκλήρωσαν ({exportData.current_year})</p>
                  <p className="text-3xl font-bold text-green-600">{exportData.total_done}</p>
                  <p className="text-xs text-gray-400">πελάτες</p>
                </div>
                <div className="bg-red-50 rounded-xl shadow p-5 text-center border border-red-200">
                  <p className="text-xs text-gray-500 mb-1">Εκκρεμούν ({exportData.current_year})</p>
                  <p className="text-3xl font-bold text-red-600">{exportData.total_pending}</p>
                  <p className="text-xs text-gray-400">πελάτες</p>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <button onClick={() => setExportTab("pending")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${exportTab === "pending" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  ⏳ Εκκρεμούν ({exportData.total_pending})
                </button>
                <button onClick={() => setExportTab("done")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${exportTab === "done" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  ✅ Ολοκλήρωσαν ({exportData.total_done})
                </button>
              </div>
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-500 border-b">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Πελάτης</th>
                      <th className="px-4 py-3">ΑΦΜ</th>
                      <th className="px-4 py-3">Τηλέφωνο</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(exportTab === "pending" ? exportData.pending : exportData.done).map((client, index) => (
                      <tr key={client.client_id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                        <td 
                          className="px-4 py-3 font-medium text-indigo-600 hover:underline cursor-pointer"
                          onClick={() => navigate(`/clients/${client.client_id}`, { state: { fromReports: true, reportsTab: "export" } })}
                        >
                          {client.pelatis}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{client.afm || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{client.phone || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}