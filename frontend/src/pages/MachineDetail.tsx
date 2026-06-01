import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { machinesApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export default function MachineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const machineId = Number(id);

  const { data: machine } = useQuery({ queryKey: ["machine", machineId], queryFn: () => machinesApi.get(machineId) });
  const { data: perf, isLoading } = useQuery({
    queryKey: ["machine-perf", machineId],
    queryFn: () => machinesApi.performance(machineId, "monthly"),
    enabled: !!machine,
  });
  const { data: maintenance = [] } = useQuery({
    queryKey: ["machine-maintenance", machineId],
    queryFn: () => machinesApi.maintenance(machineId),
  });

  if (!machine || isLoading) return <LoadingSpinner />;

  const stitchHistory = (perf as { stitch_history?: { date: string; stitches: number }[] })?.stitch_history || [];
  const performance = (perf as { performance?: { total_stitches: number; total_shifts: number } })?.performance;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/machines")}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{machine.name}</h1>
          <p className="text-muted-foreground text-sm">{machine.model_number || "No model number"}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Total Stitches (30d)</p><p className="text-2xl font-bold">{formatNumber(performance?.total_stitches)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Total Shifts (30d)</p><p className="text-2xl font-bold">{performance?.total_shifts}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Status</p><p className="text-xl font-bold capitalize">{machine.status}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Stitch History (30 days)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stitchHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [formatNumber(v), "Stitches"]} />
              <Line type="monotone" dataKey="stitches" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Maintenance Logs</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Cost</TableHead><TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(maintenance as { id: number; date: string; type: string; cost: number; description: string | null }[]).map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDate(log.date)}</TableCell>
                  <TableCell><Badge variant="outline">{log.type}</Badge></TableCell>
                  <TableCell>{formatCurrency(log.cost)}</TableCell>
                  <TableCell className="text-muted-foreground">{log.description || "—"}</TableCell>
                </TableRow>
              ))}
              {maintenance.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No maintenance records</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
