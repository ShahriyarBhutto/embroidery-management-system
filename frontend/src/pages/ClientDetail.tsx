import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { clientsApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/types";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clientId = Number(id);

  const { data: client } = useQuery({ queryKey: ["client", clientId], queryFn: () => clientsApi.get(clientId) });
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["client-orders", clientId],
    queryFn: () => clientsApi.orders(clientId),
    enabled: !!client,
  });

  if (!client || isLoading) return <LoadingSpinner />;

  const orders = (ordersData?.orders ?? []) as Order[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-sm text-muted-foreground">{client.company_name || ""} · {client.phone || ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Orders</p><p className="text-2xl font-bold">{orders.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Business</p><p className="text-2xl font-bold">{formatCurrency(ordersData?.total_business)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Order History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Design</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                  <TableCell className="font-medium">{o.design_name}</TableCell>
                  <TableCell>{formatCurrency(o.total_amount)}</TableCell>
                  <TableCell><Badge variant={{ pending: "warning", in_progress: "info", completed: "success", delivered: "secondary" }[o.status] as "warning"}>{o.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell>{formatDate(o.order_date)}</TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No orders</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
