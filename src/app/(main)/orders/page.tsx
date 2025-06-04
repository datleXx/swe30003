"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Card, CardContent } from "~/components/ui/card";
import { TypographyH1 } from "~/components/ui/typography";
import { Badge } from "~/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";

const PAGE_SIZE = 6;

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const router = useRouter();
  const { data, isLoading } = api.order.paginated.useQuery({
    page,
    pageSize: PAGE_SIZE,
  });

  if (isLoading) return <div className="py-12 text-center">Loading...</div>;
  if (!data || data.orders.length === 0)
    return <div className="py-12 text-center">No orders found.</div>;

  return (
    <section className="mx-auto max-w-7xl px-2 py-8 md:px-0">
      <TypographyH1 className="mb-8 text-center text-2xl md:text-3xl">
        My Orders
      </TypographyH1>
      <div className="grid gap-6">
        {data.orders.map((order) => (
          <Card
            key={order.id}
            className="cursor-pointer transition hover:shadow-lg"
            onClick={() => router.push(`/order/${order.id}`)}
          >
            <CardContent className="flex flex-col items-center gap-4 p-2 md:flex-row md:p-4">
              <div className="w-full flex-1 md:w-auto">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground font-mono text-xs">
                    #{order.id.slice(0, 8)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {order.status.charAt(0) +
                      order.status.slice(1).toLowerCase()}
                  </Badge>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {order.items.slice(0, 4).map((item) => (
                    <img
                      key={item.id}
                      src={item.product.image ?? ""}
                      alt={item.product.name}
                      className="h-8 w-8 rounded border bg-gray-100 object-contain"
                      title={item.product.name}
                    />
                  ))}
                  {order.items.length > 4 && (
                    <span className="text-muted-foreground text-xs">
                      +{order.items.length - 4} more
                    </span>
                  )}
                </div>
              </div>
              <div className="flex min-w-[120px] flex-col items-end">
                <span className="text-lg font-bold">
                  ${Number(order.total).toFixed(2)}
                </span>
                <span className="text-muted-foreground mt-1 text-xs">
                  {order.items.length} item{order.items.length > 1 ? "s" : ""}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-disabled={page === 1}
              />
            </PaginationItem>
            {Array.from({ length: data.totalPages }, (_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink
                  isActive={page === i + 1}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                aria-disabled={page === data.totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </section>
  );
}
