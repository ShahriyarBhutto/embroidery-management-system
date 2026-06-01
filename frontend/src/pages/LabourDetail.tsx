import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { labourApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function LabourDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const labourId = Number(id);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const today = new Date();
  const [month] = useState(today.getMonth() + 1);
  const [year] = useState(today.getFullYear());

  const { data: labour } = useQuery({ queryKey: ["labour", labourId], queryFn: () => labourApi.get(labourId) });
  const { data: summary, isLoading } = useQuery({
    queryKey: ["salary-summary", labourId, month, year],
    queryFn: () => labourApi.salarySummary(labourId, month, year),
    enabled: !!labour,
  });

  const { register, handleSubmit, reset } = useForm<{ amount: number; date: string; notes: string }>();
  const advanceMutation = useMutation({
    mutationFn: (data: { amount: number; date: string; notes?: string }) => labourApi.recordAdvance(labourId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary-summary"] });
      setAdvanceOpen(false);
      reset();
    },
  });

  if (!labour || isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/labour")}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{labour.name}</h1>
          <p className="text-sm text-muted-foreground">{labour.phone} · CNIC: {labour.cnic || "—"}</p>
        </div>
      </div>

      {/* Salary Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Monthly Salary</p><p className="text-2xl font-bold">{formatCurrency(summary?.monthly_salary)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Total Advances ({month}/{year})</p><p className="text-2xl font-bold text-rose-600">{formatCurrency(summary?.total_advances)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Net Payable</p><p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary?.net_payable)}</p></CardContent></Card>
      </div>

      {/* Advances */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Advance History ({month}/{year})</CardTitle>
          <Button size="sm" onClick={() => setAdvanceOpen(true)}><Plus className="mr-2 h-4 w-4" />Record Advance</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Notes</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {summary?.advance_history.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{formatDate(a.date)}</TableCell>
                  <TableCell className="font-semibold text-rose-600">{formatCurrency(a.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{a.notes || "—"}</TableCell>
                </TableRow>
              ))}
              {(summary?.advance_history.length ?? 0) === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No advances this month</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={advanceOpen} onOpenChange={setAdvanceOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Advance — {labour.name}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => advanceMutation.mutate(d))} className="space-y-4">
            <div className="space-y-2"><Label>Amount (PKR) *</Label><Input type="number" step="0.01" {...register("amount")} required /></div>
            <div className="space-y-2"><Label>Date *</Label><Input type="date" defaultValue={today.toISOString().slice(0, 10)} {...register("date")} required /></div>
            <div className="space-y-2"><Label>Notes</Label><Input {...register("notes")} /></div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setAdvanceOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={advanceMutation.isPending}>Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
