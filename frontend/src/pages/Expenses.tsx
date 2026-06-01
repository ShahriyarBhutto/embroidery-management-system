import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { expensesApi, machinesApi } from "@/api";
import type { DailyExpense, MaintenanceLog } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/utils";

const CATEGORIES = ["electricity", "rent", "transport", "misc"] as const;
const MAINT_TYPES = ["routine", "breakdown", "upgrade"] as const;

export default function Expenses() {
  const qc = useQueryClient();
  const [dailyOpen, setDailyOpen] = useState(false);
  const [maintOpen, setMaintOpen] = useState(false);
  const { register: dr, handleSubmit: dhs, reset: dreset, setValue: dsv } = useForm<Partial<DailyExpense>>();
  const { register: mr, handleSubmit: mhs, reset: mreset, setValue: msv } = useForm<Partial<MaintenanceLog>>();

  const { data: daily = [], isLoading: dl } = useQuery({ queryKey: ["daily-expenses"], queryFn: expensesApi.listDaily });
  const { data: maintenance = [], isLoading: ml } = useQuery({ queryKey: ["maintenance-logs"], queryFn: expensesApi.listMaintenance });
  const { data: machines = [] } = useQuery({ queryKey: ["machines"], queryFn: machinesApi.list });

  const createDaily = useMutation({ mutationFn: expensesApi.createDaily, onSuccess: () => { qc.invalidateQueries({ queryKey: ["daily-expenses"] }); setDailyOpen(false); dreset(); } });
  const deleteDaily = useMutation({ mutationFn: expensesApi.deleteDaily, onSuccess: () => qc.invalidateQueries({ queryKey: ["daily-expenses"] }) });
  const createMaint = useMutation({ mutationFn: expensesApi.createMaintenance, onSuccess: () => { qc.invalidateQueries({ queryKey: ["maintenance-logs"] }); setMaintOpen(false); mreset(); } });
  const deleteMaint = useMutation({ mutationFn: expensesApi.deleteMaintenance, onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance-logs"] }) });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Expenses</h1>
      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily Expenses</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => { dreset({ date: new Date().toISOString().slice(0, 10) }); setDailyOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Add Expense
            </Button>
          </div>
          {dl ? <LoadingSpinner /> : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Description</TableHead><TableHead /></TableRow></TableHeader>
                  <TableBody>
                    {(daily as DailyExpense[]).map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{formatDate(e.date)}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{e.category}</Badge></TableCell>
                        <TableCell className="font-semibold">{formatCurrency(e.amount)}</TableCell>
                        <TableCell className="text-muted-foreground">{e.description || "—"}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deleteDaily.mutate(e.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                    {daily.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No expenses</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => { mreset({ date: new Date().toISOString().slice(0, 10), cost: 0 }); setMaintOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Add Log
            </Button>
          </div>
          {ml ? <LoadingSpinner /> : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Machine</TableHead><TableHead>Type</TableHead><TableHead>Cost</TableHead><TableHead>Description</TableHead><TableHead /></TableRow></TableHeader>
                  <TableBody>
                    {(maintenance as MaintenanceLog[]).map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>{formatDate(l.date)}</TableCell>
                        <TableCell className="font-medium">{l.machine_name}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{l.type}</Badge></TableCell>
                        <TableCell>{formatCurrency(l.cost)}</TableCell>
                        <TableCell className="text-muted-foreground">{l.description || "—"}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deleteMaint.mutate(l.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                    {maintenance.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No logs</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Daily Expense Modal */}
      <Dialog open={dailyOpen} onOpenChange={setDailyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Daily Expense</DialogTitle></DialogHeader>
          <form onSubmit={dhs((d) => createDaily.mutate(d))} className="space-y-4">
            <div className="space-y-2"><Label>Category *</Label>
              <Select onValueChange={(v) => dsv("category", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Amount (PKR) *</Label><Input type="number" step="0.01" {...dr("amount")} required /></div>
            <div className="space-y-2"><Label>Date *</Label><Input type="date" {...dr("date")} required /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea {...dr("description")} /></div>
            <DialogFooter><Button variant="outline" type="button" onClick={() => setDailyOpen(false)}>Cancel</Button><Button type="submit">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Maintenance Modal */}
      <Dialog open={maintOpen} onOpenChange={setMaintOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Maintenance Log</DialogTitle></DialogHeader>
          <form onSubmit={mhs((d) => createMaint.mutate(d))} className="space-y-4">
            <div className="space-y-2"><Label>Machine *</Label>
              <Select onValueChange={(v) => msv("machine_id", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select machine" /></SelectTrigger>
                <SelectContent>{machines.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Type *</Label>
              <Select onValueChange={(v) => msv("type", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{MAINT_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Cost (PKR)</Label><Input type="number" step="0.01" {...mr("cost")} /></div>
              <div className="space-y-2"><Label>Date *</Label><Input type="date" {...mr("date")} required /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea {...mr("description")} /></div>
            <DialogFooter><Button variant="outline" type="button" onClick={() => setMaintOpen(false)}>Cancel</Button><Button type="submit">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
