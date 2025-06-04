"use client";
import { useRouter, useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

const statusVariant = (status: string) => {
  switch (status) {
    case "PENDING":
      return "outline" as const;
    case "PROCESSING":
      return "default" as const;
    case "SHIPPED":
      return "secondary" as const;
    case "DELIVERED":
      return "default" as const;
    case "CANCELLED":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { data: order, isLoading } = api.order.getById.useQuery(
    { id: orderId },
    { enabled: !!orderId },
  );

  if (isLoading || !order)
    return <div className="py-12 text-center">Loading...</div>;

  return (
    <section className="mx-auto max-w-3xl px-2 py-8 md:px-0">
      <Card>
        <CardContent className="p-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-bold">
                Order #{order.id.slice(0, 8)}
              </div>
              <div className="text-muted-foreground text-xs">
                {new Date(order.createdAt).toLocaleString()}
              </div>
              <div className="mt-1 text-xs">
                User:{" "}
                {order.user?.name ??
                  order.user?.email ??
                  order.user?.id.slice(0, 8)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant(order.status)} className="text-xs">
                {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
              </Badge>
              <span className="text-lg font-semibold">
                ${Number(order.total).toFixed(2)}
              </span>
            </div>
          </div>
          <h2 className="mt-6 mb-2 text-lg font-semibold">Items</h2>
          <Card className="mb-6">
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-muted-foreground text-center"
                      >
                        No items
                      </TableCell>
                    </TableRow>
                  ) : (
                    order.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="align-middle">
                          {item.product?.name ?? "Deleted product"}
                        </TableCell>
                        <TableCell className="align-middle">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="align-middle">
                          ${Number(item.price).toFixed(2)}
                        </TableCell>
                        <TableCell className="align-middle">
                          ${(Number(item.price) * item.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <h2 className="mb-2 text-lg font-semibold">Shipping Address</h2>
          <Card>
            <CardContent className="p-4">
              {order.address ? (
                <div className="text-sm">
                  {order.address.line1}
                  {order.address.line2 && <>, {order.address.line2}</>}
                  <br />
                  {order.address.city}, {order.address.state}{" "}
                  {order.address.postalCode}
                  <br />
                  {order.address.country}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">No address</div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  );
}
