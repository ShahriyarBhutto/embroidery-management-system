import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { clientsApi } from "@/api";
import type { Client } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Clients() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const { register, handleSubmit, reset } = useForm<Partial<Client>>();

  const { data: clients = [], isLoading } = useQuery({ queryKey: ["clients"], queryFn: clientsApi.list });

  const createMutation = useMutation({ mutationFn: clientsApi.create, onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setOpen(false); reset(); } });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Client> }) => clientsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setOpen(false); setEditing(null); reset(); },
  });

  const openEdit = (c: Client) => { setEditing(c); reset({ name: c.name, phone: c.phone || "", company_name: c.company_name || "", address: c.address || "", notes: c.notes || "" }); setOpen(true); };
  const openCreate = () => { setEditing(null); reset({}); setOpen(true); };
  const onSubmit = (data: Partial<Client>) => { if (editing) updateMutation.mutate({ id: editing.id, data }); else createMutation.mutate(data); };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Client</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Company</TableHead><TableHead>Phone</TableHead><TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.company_name || "—"}</TableCell>
                  <TableCell>{c.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{c.address || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/clients/${c.id}`)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {clients.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No clients</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Client" : "Add Client"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input {...register("name")} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Company</Label><Input {...register("company_name")} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input {...register("phone")} /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Textarea {...register("address")} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea {...register("notes")} /></div>
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
