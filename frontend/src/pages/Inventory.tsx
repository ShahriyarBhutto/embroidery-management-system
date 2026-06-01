import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, AlertTriangle, Minus } from "lucide-react";
import { useForm } from "react-hook-form";
import { inventoryApi, ordersApi } from "@/api";
import type { RawMaterial } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatCurrency, cn } from "@/lib/utils";

export default function Inventory() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const { register, handleSubmit, reset } = useForm<Partial<RawMaterial>>();
  const { register: ur, handleSubmit: uhs, reset: ureset, setValue: usv } = useForm<{ order_id: number; quantity_used: number; date: string }>();

  const { data: materials = [], isLoading } = useQuery({ queryKey: ["inventory"], queryFn: inventoryApi.list });
  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: () => ordersApi.list() });

  const createMutation = useMutation({ mutationFn: inventoryApi.create, onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); setOpen(false); reset(); } });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RawMaterial> }) => inventoryApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); setOpen(false); setEditing(null); reset(); },
  });
  const usageMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { order_id: number; quantity_used: number; date: string } }) =>
      inventoryApi.recordUsage(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); setUsageOpen(false); ureset(); },
  });

  const openEdit = (m: RawMaterial) => {
    setEditing(m);
    reset({ name: m.name, unit: m.unit, current_stock: m.current_stock, cost_per_unit: m.cost_per_unit, minimum_stock_alert: m.minimum_stock_alert });
    setOpen(true);
  };

  const openCreate = () => { setEditing(null); reset({}); setOpen(true); };

  const onSubmit = (data: Partial<RawMaterial>) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  if (isLoading) return <LoadingSpinner />;

  const lowStockCount = (materials as RawMaterial[]).filter((m) => m.is_low_stock).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          {lowStockCount > 0 && (
            <p className="text-sm text-orange-600 flex items-center gap-1 mt-1">
              <AlertTriangle className="h-4 w-4" />{lowStockCount} item{lowStockCount > 1 ? "s" : ""} below minimum stock
            </p>
          )}
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Material</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead><TableHead>Unit</TableHead><TableHead>Stock</TableHead>
                <TableHead>Min Alert</TableHead><TableHead>Cost/Unit</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(materials as RawMaterial[]).map((m) => (
                <TableRow key={m.id} className={cn(m.is_low_stock && "bg-red-50 dark:bg-red-950/20")}>
                  <TableCell className="font-medium">
                    {m.is_low_stock && <AlertTriangle className="inline h-4 w-4 text-orange-500 mr-1" />}
                    {m.name}
                  </TableCell>
                  <TableCell>{m.unit}</TableCell>
                  <TableCell className={cn("font-semibold", m.is_low_stock ? "text-red-600" : "text-emerald-600")}>
                    {Number(m.current_stock).toFixed(2)}
                  </TableCell>
                  <TableCell>{Number(m.minimum_stock_alert).toFixed(2)}</TableCell>
                  <TableCell>{formatCurrency(m.cost_per_unit)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedMaterial(m.id); ureset({ date: new Date().toISOString().slice(0, 10) }); setUsageOpen(true); }}><Minus className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {materials.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No materials</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Material" : "Add Material"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input {...register("name")} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Unit *</Label><Input placeholder="kg / meters / pcs" {...register("unit")} required /></div>
              <div className="space-y-2"><Label>Current Stock</Label><Input type="number" step="0.001" {...register("current_stock")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Cost/Unit (PKR) *</Label><Input type="number" step="0.01" {...register("cost_per_unit")} required /></div>
              <div className="space-y-2"><Label>Min Stock Alert</Label><Input type="number" step="0.001" {...register("minimum_stock_alert")} /></div>
            </div>
            <DialogFooter><Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">{editing ? "Update" : "Create"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={usageOpen} onOpenChange={setUsageOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Usage</DialogTitle></DialogHeader>
          <form onSubmit={uhs((d) => selectedMaterial && usageMutation.mutate({ id: selectedMaterial, data: d }))} className="space-y-4">
            <div className="space-y-2"><Label>Order *</Label>
              <Select onValueChange={(v) => usv("order_id", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select order" /></SelectTrigger>
                <SelectContent>{(orders as { id: number; design_name: string }[]).map((o) => <SelectItem key={o.id} value={String(o.id)}>#{o.id} — {o.design_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Quantity Used *</Label><Input type="number" step="0.001" {...ur("quantity_used")} required /></div>
            <div className="space-y-2"><Label>Date *</Label><Input type="date" {...ur("date")} required /></div>
            <DialogFooter><Button variant="outline" type="button" onClick={() => setUsageOpen(false)}>Cancel</Button><Button type="submit">Record</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
