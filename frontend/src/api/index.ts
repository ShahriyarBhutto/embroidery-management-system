import api from "./axios";
import type {
  User, Machine, Labour, Advance, Shift, Client, Order,
  RawMaterial, MaterialUsage, DailyExpense, MaintenanceLog,
  ReportConfig, DashboardData, SalarySummary,
} from "@/types";

const unwrap = <T>(res: { data: { data: T } }): T => res.data.data;

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }).then(unwrap<{ access_token: string; refresh_token: string; user: User }>),
  me: () => api.get("/auth/me").then(unwrap<User>),
};

// ── Machines ─────────────────────────────────────────────────────────────────
export const machinesApi = {
  list: () => api.get("/machines").then(unwrap<Machine[]>),
  get: (id: number) => api.get(`/machines/${id}`).then(unwrap<Machine>),
  create: (data: Partial<Machine>) => api.post("/machines", data).then(unwrap<Machine>),
  update: (id: number, data: Partial<Machine>) => api.put(`/machines/${id}`, data).then(unwrap<Machine>),
  delete: (id: number) => api.delete(`/machines/${id}`),
  performance: (id: number, period = "monthly") =>
    api.get(`/machines/${id}/performance`, { params: { period } }).then(unwrap<{ performance: object; stitch_history: object[] }>),
  maintenance: (id: number) => api.get(`/machines/${id}/maintenance`).then(unwrap<MaintenanceLog[]>),
  addMaintenance: (id: number, data: object) => api.post(`/machines/${id}/maintenance`, data).then(unwrap<MaintenanceLog>),
};

// ── Labour ───────────────────────────────────────────────────────────────────
export const labourApi = {
  list: () => api.get("/labour").then(unwrap<Labour[]>),
  get: (id: number) => api.get(`/labour/${id}`).then(unwrap<Labour>),
  create: (data: Partial<Labour>) => api.post("/labour", data).then(unwrap<Labour>),
  update: (id: number, data: Partial<Labour>) => api.put(`/labour/${id}`, data).then(unwrap<Labour>),
  delete: (id: number) => api.delete(`/labour/${id}`),
  recordAdvance: (id: number, data: { amount: number; date: string; notes?: string }) =>
    api.post(`/labour/${id}/advance`, data).then(unwrap<Advance>),
  salarySummary: (id: number, month: number, year: number) =>
    api.get(`/labour/${id}/salary-summary`, { params: { month, year } }).then(unwrap<SalarySummary>),
};

// ── Shifts ───────────────────────────────────────────────────────────────────
export const shiftsApi = {
  list: (params?: { date?: string; machine_id?: number; labour_id?: number }) =>
    api.get("/shifts", { params }).then(unwrap<Shift[]>),
  create: (data: Partial<Shift>) => api.post("/shifts", data).then(unwrap<Shift>),
  update: (id: number, data: Partial<Shift>) => api.put(`/shifts/${id}`, data),
  delete: (id: number) => api.delete(`/shifts/${id}`),
  dailySummary: (date: string) =>
    api.get("/shifts/daily-summary", { params: { date } }).then(unwrap<{ date: string; total_stitches: number; total_shifts: number; machines_active: number }>),
};

// ── Orders ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  list: (params?: { client_id?: number; status?: string; date_from?: string; date_to?: string }) =>
    api.get("/orders", { params }).then(unwrap<Order[]>),
  get: (id: number) => api.get(`/orders/${id}`).then(unwrap<Order>),
  create: (data: Partial<Order>) => api.post("/orders", data).then(unwrap<{ id: number }>),
  update: (id: number, data: Partial<Order>) => api.put(`/orders/${id}`, data),
  updateStatus: (id: number, status: string) => api.patch(`/orders/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/orders/${id}`),
};

// ── Clients ──────────────────────────────────────────────────────────────────
export const clientsApi = {
  list: () => api.get("/clients").then(unwrap<Client[]>),
  get: (id: number) => api.get(`/clients/${id}`).then(unwrap<Client>),
  create: (data: Partial<Client>) => api.post("/clients", data).then(unwrap<Client>),
  update: (id: number, data: Partial<Client>) => api.put(`/clients/${id}`, data).then(unwrap<Client>),
  delete: (id: number) => api.delete(`/clients/${id}`),
  orders: (id: number) =>
    api.get(`/clients/${id}/orders`).then(unwrap<{ orders: Order[]; total_business: number }>),
};

// ── Expenses ─────────────────────────────────────────────────────────────────
export const expensesApi = {
  listDaily: (params?: { date_from?: string; date_to?: string }) =>
    api.get("/expenses/daily", { params }).then(unwrap<DailyExpense[]>),
  createDaily: (data: Partial<DailyExpense>) => api.post("/expenses/daily", data).then(unwrap<DailyExpense>),
  updateDaily: (id: number, data: Partial<DailyExpense>) => api.put(`/expenses/daily/${id}`, data),
  deleteDaily: (id: number) => api.delete(`/expenses/daily/${id}`),
  listMaintenance: () => api.get("/expenses/maintenance").then(unwrap<MaintenanceLog[]>),
  createMaintenance: (data: Partial<MaintenanceLog>) => api.post("/expenses/maintenance", data).then(unwrap<MaintenanceLog>),
  updateMaintenance: (id: number, data: Partial<MaintenanceLog>) => api.put(`/expenses/maintenance/${id}`, data),
  deleteMaintenance: (id: number) => api.delete(`/expenses/maintenance/${id}`),
};

// ── Inventory ────────────────────────────────────────────────────────────────
export const inventoryApi = {
  list: () => api.get("/raw-materials").then(unwrap<RawMaterial[]>),
  get: (id: number) => api.get(`/raw-materials/${id}`).then(unwrap<RawMaterial>),
  create: (data: Partial<RawMaterial>) => api.post("/raw-materials", data).then(unwrap<RawMaterial>),
  update: (id: number, data: Partial<RawMaterial>) => api.put(`/raw-materials/${id}`, data),
  delete: (id: number) => api.delete(`/raw-materials/${id}`),
  recordUsage: (id: number, data: { order_id: number; quantity_used: number; date: string }) =>
    api.post(`/raw-materials/${id}/usage`, data).then(unwrap<MaterialUsage>),
};

// ── Reports ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  dashboard: () => api.get("/reports/dashboard").then(unwrap<DashboardData>),
  machines: (period = "monthly") => api.get("/reports/machines", { params: { period } }).then(unwrap),
  labour: (month: number, year: number) => api.get("/reports/labour", { params: { month, year } }).then(unwrap),
  profitLoss: (period = "monthly") => api.get("/reports/profit-loss", { params: { period } }).then(unwrap),
  revenue: () => api.get("/reports/revenue").then(unwrap),
};

// ── Settings ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  getConfig: () => api.get("/settings/report-config").then(unwrap<ReportConfig>),
  updateConfig: (data: Partial<ReportConfig>) => api.put("/settings/report-config", data).then(unwrap<ReportConfig>),
  testReport: () => api.post("/settings/report-config/test"),
};
