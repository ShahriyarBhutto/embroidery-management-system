import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { labourApi } from "@/api";
import type { Labour as LabourType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function Labour() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LabourType | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm<Partial<LabourType>>();

  const { data: labours = [], isLoading } = useQuery({ queryKey: ["labour"], queryFn: labourApi.list });

  const createMutation = useMutation({
    mutationFn: labourApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["labour"] }); setOpen(false); reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LabourType> }) => labourApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["labour"] }); setOpen(false); setEditing(null); reset(); },
  });

  const openEdit = (l: LabourType) => {
    setEditing(l);
    reset({ name: l.name, phone: l.phone || "", cnic: l.cnic || "", monthly_salary: l.monthly_salary, joining_date: l.joining_date || "", status: l.status });
    setOpen(true);
  };

  const openCreate = () => { setEditing(null); reset({}); setOpen(true); };

  const onSubmit = (data: Partial<LabourType>) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Labour</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Labour</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>CNIC</TableHead>
                <TableHead>Monthly Salary</TableHead><TableHead>Joining Date</TableHead><TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labours.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>{l.phone || "—"}</TableCell>
                  <TableCell>{l.cnic || "—"}</TableCell>
                  <TableCell>{formatCurrency(l.monthly_salary)}</TableCell>
                  <TableCell>{formatDate(l.joining_date)}</TableCell>
                  <TableCell><Badge variant={l.status === "active" ? "success" : "secondary"}>{l.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/labour/${l.id}`)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {labours.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No labour records</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Labour" : "Add Labour"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input {...register("name")} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input {...register("phone")} /></div>
              <div className="space-y-2"><Label>CNIC</Label><Input {...register("cnic")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Monthly Salary (PKR) *</Label><Input type="number" step="0.01" {...register("monthly_salary")} required /></div>
              <div className="space-y-2"><Label>Joining Date</Label><Input type="date" {...register("joining_date")} /></div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select defaultValue={editing?.status || "active"} onValueChange={(v) => setValue("status", v as LabourType["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
