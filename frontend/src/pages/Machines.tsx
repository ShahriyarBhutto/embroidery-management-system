import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, PowerOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { machinesApi } from "@/api";
import type { Machine } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatDate } from "@/lib/utils";

const statusVariant: Record<string, "success" | "secondary" | "warning"> = {
  active: "success", idle: "secondary", maintenance: "warning",
};

export default function Machines() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Machine | null>(null);
  const { register, handleSubmit, reset, setValue, watch } = useForm<Partial<Machine>>();

  const { data: machines = [], isLoading } = useQuery({ queryKey: ["machines"], queryFn: machinesApi.list });

  const createMutation = useMutation({
    mutationFn: machinesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["machines"] }); setOpen(false); reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Machine> }) => machinesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["machines"] }); setOpen(false); setEditing(null); reset(); },
  });

  const openEdit = (m: Machine) => {
    setEditing(m);
    reset({ name: m.name, model_number: m.model_number || "", status: m.status, purchase_date: m.purchase_date || "", notes: m.notes || "" });
    setOpen(true);
  };

  const openCreate = () => { setEditing(null); reset({}); setOpen(true); };

  const onSubmit = (data: Partial<Machine>) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const deactivate = (m: Machine) => updateMutation.mutate({ id: m.id, data: { status: "maintenance" } });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Machines</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Machine</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {machines.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.model_number || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[m.status]}>{m.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(m.purchase_date)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/machines/${m.id}`)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                      {m.status !== "maintenance" && (
                        <Button variant="ghost" size="icon" onClick={() => deactivate(m)} className="text-orange-500 hover:text-orange-600"><PowerOff className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {machines.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No machines added yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Machine" : "Add Machine"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input {...register("name")} required /></div>
            <div className="space-y-2"><Label>Model Number</Label><Input {...register("model_number")} /></div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select defaultValue={editing?.status || "active"} onValueChange={(v) => setValue("status", v as Machine["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Purchase Date</Label><Input type="date" {...register("purchase_date")} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea {...register("notes")} /></div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
