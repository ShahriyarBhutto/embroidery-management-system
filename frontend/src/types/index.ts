export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "manager" | "viewer";
  is_active: boolean;
  created_at: string;
}

export interface Machine {
  id: number;
  name: string;
  model_number: string | null;
  status: "active" | "idle" | "maintenance";
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface Labour {
  id: number;
  name: string;
  phone: string | null;
  cnic: string | null;
  monthly_salary: number;
  joining_date: string | null;
  status: "active" | "inactive";
  created_at: string;
}

export interface Advance {
  id: number;
  labour_id: number;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface SalarySummary {
  labour_id: number;
  labour_name: string;
  monthly_salary: number;
  total_advances: number;
  net_payable: number;
  advance_history: Advance[];
}

export interface Shift {
  id: number;
  machine_id: number;
  labour_id: number;
  date: string;
  shift_type: "day" | "night";
  stitch_count: number;
  notes: string | null;
  created_at: string;
  machine_name: string | null;
  labour_name: string | null;
}

export interface Client {
  id: number;
  name: string;
  phone: string | null;
  company_name: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  client_id: number;
  machine_id: number | null;
  design_name: string;
  order_type: "estimated" | "fixed_stitches";
  estimated_stitches: number | null;
  actual_stitches: number | null;
  rate_per_stitch: number | null;
  total_amount: number | null;
  advance_payment: number | null;
  status: "pending" | "in_progress" | "completed" | "delivered";
  order_date: string;
  deadline: string | null;
  notes: string | null;
  client_name: string | null;
  machine_name: string | null;
  created_at: string;
}

export interface RawMaterial {
  id: number;
  name: string;
  unit: string;
  current_stock: number;
  cost_per_unit: number;
  minimum_stock_alert: number;
  is_low_stock: boolean;
  created_at: string;
}

export interface MaterialUsage {
  id: number;
  order_id: number;
  material_id: number;
  quantity_used: number;
  date: string;
  material_name: string | null;
  unit: string | null;
}

export interface DailyExpense {
  id: number;
  category: string;
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
}

export interface MaintenanceLog {
  id: number;
  machine_id: number;
  date: string;
  cost: number;
  description: string | null;
  type: string;
  machine_name: string | null;
  created_at: string;
}

export interface ReportConfig {
  id: number;
  recipient_emails: string[];
  send_day: number;
  send_time: string;
  is_active: boolean;
  last_sent_at: string | null;
}

export interface DashboardData {
  cards: {
    today_stitches: number;
    active_orders: number;
    monthly_revenue: number;
    monthly_expenses: number;
  };
  machine_performance: { machine_name: string; total_stitches: number }[];
  monthly_trend: { month: string; revenue: number; expenses: number }[];
  order_status: { status: string; count: number }[];
  recent_orders: {
    id: number;
    client_name: string;
    design_name: string;
    status: string;
    total_amount: number;
    order_date: string;
  }[];
}
