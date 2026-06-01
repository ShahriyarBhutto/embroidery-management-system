import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { ordersApi, clientsApi, machinesApi } from "@/api";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusVariant: Record<string, "warning" | "info" | "success" | "secondary"> = {
  pending: "warning", in_progress: "info", completed: "success", delivered: "secondary",
};

export default function Orders() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const { register, handleSubmit, reset, setValue, watch } = useForm<Partial<Order>>();
  const orderType = watch("order_type");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", statusFilter],
    queryFn: () => ordersApi.list(statusFilter ? { status: statusFilter } : undefined),
  });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: clientsApi.list });
  const { data: machines = [] } = useQuery({ queryKey: ["machines"], queryFn: machinesApi.list });

  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orders"] }); setOpen(false); reset(); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => ordersApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });

  const onSubmit = (data: Partial<Order>) => createMutation.mutate(data);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { reset({ order_date: new Date().toISOString().slice(0, 10) }); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />New Order
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead><TableHead>Design</TableHead><TableHead>Client</TableHead>
                <TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="text-muted-foreground">{o.id}</TableCell>
                  <TableCell className="font-medium">{o.design_name}</TableCell>
                  <TableCell>{o.client_name}</TableCell>
                  <TableCell>{formatCurrency(o.total_amount)}</TableCell>
                  <TableCell><Badge variant={statusVariant[o.status]}>{o.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell>{formatDate(o.order_date)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/orders/${o.id}`)}><Eye className="h-4 w-4" /></Button>
                      <Select onValueChange={(v) => statusMutation.mutate({ id: o.id, status: v })}>
                        <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Update status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No orders found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Order</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Design Name *</Label><Input {...register("design_name")} required />
            </div>
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select onValueChange={(v) => setValue("client_id", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Machine</Label>
              <Select onValueChange={(v) => setValue("machine_id", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select machine" /></SelectTrigger>
                <SelectContent>{machines.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Order Type *</Label>
              <Select onValueChange={(v) => setValue("order_type", v as Order["order_type"])}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="estimated">Estimated</SelectItem>
                  <SelectItem value="fixed_stitches">Fixed Stitches</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {orderType === "fixed_stitches" ? (
              <>
                <div className="space-y-2"><Label>Fixed Stitches</Label><Input type="number" {...register("actual_stitches")} /></div>
                <div className="space-y-2"><Label>Rate / Stitch</Label><Input type="number" step="0.0001" {...register("rate_per_stitch")} /></div>
              </>
            ) : (
              <>
                <div className="space-y-2"><Label>Estimated Stitches</Label><Input type="number" {...register("estimated_stitches")} /></div>
                <div className="space-y-2"><Label>Total Amount (PKR)</Label><Input type="number" step="0.01" {...register("total_amount")} /></div>
              </>
            )}
            <div className="space-y-2"><Label>Advance Payment</Label><Input type="number" step="0.01" {...register("advance_payment")} /></div>
            <div className="space-y-2"><Label>Order Date *</Label><Input type="date" {...register("order_date")} required /></div>
            <div className="space-y-2"><Label>Deadline</Label><Input type="date" {...register("deadline")} /></div>
            <div className="space-y-2 col-span-2"><Label>Notes</Label><Textarea {...register("notes")} /></div>
            <DialogFooter className="col-span-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>Create Order</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
