import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ordersApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

const statusVariant: Record<string, "warning" | "info" | "success" | "secondary"> = {
  pending: "warning", in_progress: "info", completed: "success", delivered: "secondary",
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersApi.get(Number(id)),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!order) return <div className="text-muted-foreground py-8">Order not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{order.design_name}</h1>
          <p className="text-sm text-muted-foreground">Order #{order.id} · {order.client_name}</p>
        </div>
        <Badge variant={statusVariant[order.status]}>{order.status.replace("_", " ")}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Amount</p><p className="text-xl font-bold">{formatCurrency(order.total_amount)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Advance Paid</p><p className="text-xl font-bold">{formatCurrency(order.advance_payment)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Balance</p><p className="text-xl font-bold">{formatCurrency((order.total_amount || 0) - (order.advance_payment || 0))}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Stitches</p><p className="text-xl font-bold">{formatNumber(order.actual_stitches || order.estimated_stitches)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Order Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div><dt className="text-muted-foreground">Client</dt><dd className="font-medium">{order.client_name}</dd></div>
            <div><dt className="text-muted-foreground">Machine</dt><dd className="font-medium">{order.machine_name || "—"}</dd></div>
            <div><dt className="text-muted-foreground">Order Type</dt><dd className="font-medium capitalize">{order.order_type.replace("_", " ")}</dd></div>
            <div><dt className="text-muted-foreground">Rate / Stitch</dt><dd className="font-medium">{order.rate_per_stitch ? `PKR ${order.rate_per_stitch}` : "—"}</dd></div>
            <div><dt className="text-muted-foreground">Order Date</dt><dd className="font-medium">{formatDate(order.order_date)}</dd></div>
            <div><dt className="text-muted-foreground">Deadline</dt><dd className="font-medium">{formatDate(order.deadline)}</dd></div>
            <div className="col-span-2"><dt className="text-muted-foreground">Notes</dt><dd className="font-medium mt-1">{order.notes || "—"}</dd></div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
