import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Machines from "./pages/Machines";
import MachineDetail from "./pages/MachineDetail";
import Labour from "./pages/Labour";
import LabourDetail from "./pages/LabourDetail";
import Shifts from "./pages/Shifts";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Expenses from "./pages/Expenses";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return user?.role === "admin" ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="machines" element={<Machines />} />
            <Route path="machines/:id" element={<MachineDetail />} />
            <Route path="labour" element={<Labour />} />
            <Route path="labour/:id" element={<LabourDetail />} />
            <Route path="shifts" element={<Shifts />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="reports" element={<Reports />} />
            <Route
              path="settings"
              element={
                <RequireAdmin>
                  <Settings />
                </RequireAdmin>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
