import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientCard from "./pages/ClientCard";
import NewClient from "./pages/NewClient";
import Employees from "./pages/Employees";
import EditClient from "./pages/EditClient";
import Pending from "./pages/Pending";
import Reports from "./pages/Reports";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={
        <PrivateRoute>
          <AppLayout><Dashboard /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/clients" element={
        <PrivateRoute>
          <AppLayout><Clients /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/clients/new" element={
        <PrivateRoute>
          <AppLayout><NewClient /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/clients/:id" element={
        <PrivateRoute>
          <AppLayout><ClientCard /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/clients/:id/edit" element={
        <PrivateRoute>
          <AppLayout><EditClient /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/employees" element={
        <PrivateRoute>
          <AppLayout><Employees /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/pending" element={
        <PrivateRoute>
          <AppLayout><Pending /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/dashboard" />} />

      <Route path="/reports" element={
        <PrivateRoute>
          <AppLayout><Reports /></AppLayout>
        </PrivateRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}