import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import { Activity, ShoppingCart, TrendingUp, TrendingDown } from "lucide-react";
import { reportsApi } from "@/api";
import StatCard from "@/components/StatCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";

const PIE_COLORS = { pending: "#f59e0b", in_progress: "#3b82f6", completed: "#10b981", delivered: "#6366f1" };

const statusVariant: Record<string, "warning" | "info" | "success" | "secondary"> = {
  pending: "warning", in_progress: "info", completed: "success", delivered: "secondary",
};

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: reportsApi.dashboard,
    refetchInterval: 60_000,
  });

  if (isLoading) return <LoadingSpinner text="Loading dashboard..." />;
  if (error || !data) return <div className="text-destructive py-8">Failed to load dashboard.</div>;

  const { cards, machine_performance, monthly_trend, order_status, recent_orders } = data;
  const netProfit = cards.monthly_revenue - cards.monthly_expenses;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Stitches" value={formatNumber(cards.today_stitches)} icon={Activity} colorClass="text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-300" />
        <StatCard title="Active Orders" value={cards.active_orders} icon={ShoppingCart} colorClass="text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-300" />
        <StatCard title="Monthly Revenue" value={formatCurrency(cards.monthly_revenue)} icon={TrendingUp} colorClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300" />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(cards.monthly_expenses)}
          icon={TrendingDown}
          colorClass="text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-300"
          description={`Net: ${netProfit >= 0 ? "+" : ""}${formatCurrency(netProfit)}`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Machine Performance */}
        <Card>
          <CardHeader><CardTitle className="text-base">Machine Performance (30 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={machine_performance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="machine_name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [formatNumber(v), "Stitches"]} />
                <Bar dataKey="total_stitches" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue vs Expenses */}
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue vs Expenses (6 months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} dot={false} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Pie + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Order Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={order_status} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {order_status.map((entry) => (
                    <Cell key={entry.status} fill={PIE_COLORS[entry.status as keyof typeof PIE_COLORS] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recent_orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{o.design_name}</p>
                    <p className="text-xs text-muted-foreground">{o.client_name} · {formatDate(o.order_date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{formatCurrency(o.total_amount)}</span>
                    <Badge variant={statusVariant[o.status] || "secondary"}>{o.status.replace("_", " ")}</Badge>
                  </div>
                </div>
              ))}
              {recent_orders.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
