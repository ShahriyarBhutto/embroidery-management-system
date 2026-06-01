import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { shiftsApi, machinesApi, labourApi } from "@/api";
import type { Shift } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatNumber } from "@/lib/utils";

export default function Shifts() {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm<Partial<Shift>>();

  const { data: shifts = [], isLoading } = useQuery({ queryKey: ["shifts", date], queryFn: () => shiftsApi.list({ date }) });
  const { data: summary } = useQuery({ queryKey: ["daily-summary", date], queryFn: () => shiftsApi.dailySummary(date) });
  const { data: machines = [] } = useQuery({ queryKey: ["machines"], queryFn: machinesApi.list });
  const { data: labours = [] } = useQuery({ queryKey: ["labour"], queryFn: labourApi.list });

  const createMutation = useMutation({
    mutationFn: shiftsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shifts"] }); qc.invalidateQueries({ queryKey: ["daily-summary"] }); setOpen(false); reset(); },
  });

  const deleteMutation = useMutation({
    mutationFn: shiftsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shifts"] }); qc.invalidateQueries({ queryKey: ["daily-summary"] }); },
  });

  const onSubmit = (data: Partial<Shift>) => createMutation.mutate({ ...data, date } as Partial<Shift>);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Shifts</h1>
        <div className="flex items-center gap-3">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          <Button onClick={() => { reset({ date, stitch_count: 0 }); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add Shift
          </Button>
        </div>
      </div>

      {/* Daily summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total Stitches</p><p className="text-xl font-bold">{formatNumber(summary.total_stitches)}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Shifts</p><p className="text-xl font-bold">{summary.total_shifts}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Machines Active</p><p className="text-xl font-bold">{summary.machines_active}</p></CardContent></Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine</TableHead><TableHead>Operator</TableHead><TableHead>Shift</TableHead>
                <TableHead>Stitches</TableHead><TableHead>Notes</TableHead><TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.machine_name}</TableCell>
                  <TableCell>{s.labour_name}</TableCell>
                  <TableCell><Badge variant={s.shift_type === "day" ? "info" : "secondary"}>{s.shift_type}</Badge></TableCell>
                  <TableCell>{formatNumber(s.stitch_count)}</TableCell>
                  <TableCell className="text-muted-foreground">{s.notes || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {shifts.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No shifts for {date}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Shift — {date}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Machine *</Label>
              <Select onValueChange={(v) => setValue("machine_id", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select machine" /></SelectTrigger>
                <SelectContent>
                  {machines.filter((m) => m.status === "active").map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Operator *</Label>
              <Select onValueChange={(v) => setValue("labour_id", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select labour" /></SelectTrigger>
                <SelectContent>
                  {labours.filter((l) => l.status === "active").map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Shift Type</Label>
              <Select defaultValue="day" onValueChange={(v) => setValue("shift_type", v as "day" | "night")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Stitch Count *</Label><Input type="number" {...register("stitch_count")} required /></div>
            <div className="space-y-2"><Label>Notes</Label><Input {...register("notes")} /></div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>Record Shift</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
