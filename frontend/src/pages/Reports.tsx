import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { reportsApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";

const today = new Date();

function exportCSV(data: object[], filename: string) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(","), ...data.map((r) => keys.map((k) => (r as Record<string,unknown>)[k]).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export default function Reports() {
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year] = useState(today.getFullYear());
  const [machinePeriod, setMachinePeriod] = useState("monthly");

  const { data: pl, isLoading: plLoading } = useQuery({ queryKey: ["profit-loss"], queryFn: () => reportsApi.profitLoss() });
  const { data: machines, isLoading: ml } = useQuery({ queryKey: ["report-machines", machinePeriod], queryFn: () => reportsApi.machines(machinePeriod) });
  const { data: labourData, isLoading: ll } = useQuery({ queryKey: ["report-labour", month, year], queryFn: () => reportsApi.labour(month, year) });
  const { data: trend } = useQuery({ queryKey: ["report-revenue"], queryFn: reportsApi.revenue });

  const profitLoss = pl as { revenue: number; expenses: number; profit_loss: number; is_profit: boolean } | undefined;
  const machineList = (machines as { machine_name: string; total_stitches: number }[]) || [];
  const labourList = (labourData as { labour_id: number; name: string; monthly_salary: number; total_advances: number; net_payable: number }[]) || [];
  const trendList = (trend as { month: string; revenue: number; expenses: number }[]) || [];

  if (plLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      {/* P&L Card */}
      {profitLoss && (
        <Card className={cn("border-l-4", profitLoss.is_profit ? "border-l-emerald-500" : "border-l-red-500")}>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-6">
              <div><p className="text-sm text-muted-foreground">Revenue (this month)</p><p className="text-2xl font-bold text-emerald-600">{formatCurrency(profitLoss.revenue)}</p></div>
              <div><p className="text-sm text-muted-foreground">Expenses</p><p className="text-2xl font-bold text-red-600">{formatCurrency(profitLoss.expenses)}</p></div>
              <div>
                <p className="text-sm text-muted-foreground">Net {profitLoss.is_profit ? "Profit" : "Loss"}</p>
                <p className={cn("text-2xl font-bold flex items-center gap-2", profitLoss.is_profit ? "text-emerald-600" : "text-red-600")}>
                  {profitLoss.is_profit ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  {formatCurrency(Math.abs(profitLoss.profit_loss))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue vs Expenses Trend */}
      <Card>
        <CardHeader><CardTitle className="text-base">Revenue vs Expenses (6 months)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendList}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Machine Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Machine Comparison</CardTitle>
          <Select value={machinePeriod} onValueChange={setMachinePeriod}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {ml ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={machineList}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="machine_name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [formatNumber(v), "Stitches"]} />
                <Bar dataKey="total_stitches" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Stitches" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Labour Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-base">Labour Salary Summary</CardTitle>
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {new Date(2024, m - 1).toLocaleString("default", { month: "long" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportCSV(labourList, `labour-${month}-${year}.csv`)}>
            <Download className="mr-2 h-4 w-4" />Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {ll ? <LoadingSpinner /> : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Salary</TableHead><TableHead>Advances</TableHead><TableHead>Net Payable</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {labourList.map((l) => (
                  <TableRow key={l.labour_id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>{formatCurrency(l.monthly_salary)}</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(l.total_advances)}</TableCell>
                    <TableCell className="font-bold text-emerald-600">{formatCurrency(l.net_payable)}</TableCell>
                  </TableRow>
                ))}
                {labourList.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
