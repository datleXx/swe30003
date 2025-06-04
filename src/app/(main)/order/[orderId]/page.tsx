"use client";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Card, CardContent } from "~/components/ui/card";
import { TypographyH1, TypographyP } from "~/components/ui/typography";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

function getOrderStatus(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  const hours = (now.getTime() - created.getTime()) / 1000 / 60 / 60;
  if (hours < 1) return "PENDING";
  if (hours < 6) return "PROCESSING";
  if (hours < 24) return "SHIPPED";
  return "DELIVERED";
}

const statusSteps = [
  { key: "PENDING", label: "Pending" },
  { key: "PROCESSING", label: "Processing" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
];

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const { data: order, isLoading } = api.order.getById.useQuery({
    id: orderId as string,
  });

  if (isLoading) return <div className="py-12 text-center">Loading...</div>;
  if (!order) return <div className="py-12 text-center">Order not found.</div>;

  const status = getOrderStatus(order.createdAt.toISOString());
  const statusIdx = statusSteps.findIndex((s) => s.key === status);

  return (
    <section className="mx-auto max-w-4xl px-2 py-8 md:px-0">
      <TypographyH1 className="mb-8 text-center text-2xl md:text-3xl">
        Order Details
      </TypographyH1>
      <div className="grid grid-cols-3 gap-8 md:grid-cols-8">
        {/* Tracking (left) */}
        <div className="col-span-2 md:col-span-5">
          <Card className="h-full">
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    Order ID:{" "}
                    <span className="font-mono">{order.id.slice(0, 8)}</span>
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </Badge>
                </div>
                <h2 className="mb-6 text-lg font-semibold">Tracking</h2>
                <ol className="border-muted-foreground/20 relative ml-2 border-l">
                  {statusSteps.map((step, i) => (
                    <li key={step.key} className="mb-8 last:mb-0">
                      <span
                        className={cn(
                          "absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold",
                          i <= statusIdx
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted bg-background text-muted-foreground",
                        )}
                      >
                        {i + 1}
                      </span>
                      <div
                        className={cn(
                          "ml-6",
                          i === statusIdx && "text-primary font-bold",
                        )}
                      >
                        {step.label}
                      </div>
                      {i === statusIdx && (
                        <div className="text-muted-foreground mt-1 ml-6 text-xs">
                          Current status
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
                <div className="text-muted-foreground mt-8 text-xs">
                  Placed: {new Date(order.createdAt).toLocaleString()}
                  {status === "DELIVERED" && order.updatedAt && (
                    <>
                      <br />
                      Delivered: {new Date(order.updatedAt).toLocaleString()}
                    </>
                  )}
                </div>
                <div className="mt-4 text-base font-medium">
                  {status === "PENDING" &&
                    "Your order has been placed and is awaiting processing."}
                  {status === "PROCESSING" &&
                    "Your order is being prepared for shipment."}
                  {status === "SHIPPED" && "Your order is on the way!"}
                  {status === "DELIVERED" && "Your order has been delivered."}
                </div>
                <div className="text-muted-foreground mt-4 text-xs">
                  Estimated delivery:{" "}
                  {status === "DELIVERED"
                    ? "Delivered"
                    : (() => {
                        const created = new Date(order.createdAt);
                        const eta = new Date(created);
                        if (status === "PENDING")
                          eta.setHours(created.getHours() + 24);
                        if (status === "PROCESSING")
                          eta.setHours(created.getHours() + 18);
                        if (status === "SHIPPED")
                          eta.setHours(created.getHours() + 2);
                        return eta.toLocaleString();
                      })()}
                </div>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                {order.items.map((item: any) => (
                  <img
                    key={item.id}
                    src={item.product.image ?? ""}
                    alt={item.product.name}
                    className="h-10 w-10 rounded border bg-gray-100 object-contain"
                    title={item.product.name}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Order Details (right) */}
        <div className="col-span-1 md:col-span-3">
          <Card>
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div>
                <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
                <div className="space-y-3">
                  {order.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 border-b pb-2 last:border-b-0 last:pb-0"
                    >
                      <img
                        src={item.product.image ?? ""}
                        alt={item.product.name}
                        className="h-12 w-12 rounded bg-gray-100 object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {item.product.name}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          x{item.quantity}
                        </div>
                      </div>
                      <div className="font-semibold">
                        ${Number(item.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>${Number(order.total).toFixed(2)}</span>
                </div>
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-semibold">
                    Shipping Address
                  </h3>
                  <div className="text-muted-foreground text-sm">
                    {order.address?.line1}
                    {order.address?.line2 && <>, {order.address.line2}</>}
                    <br />
                    {order.address?.city}, {order.address?.state}{" "}
                    {order.address?.postalCode}
                    <br />
                    {order.address?.country}
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-semibold">Payment</h3>
                  <div className="text-muted-foreground text-sm">
                    {order.payment?.method}
                  </div>
                </div>
              </div>
              <div className="mt-8 flex w-full justify-end">
                <Button
                  onClick={() => router.push("/products")}
                  className="w-full md:w-auto"
                >
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
