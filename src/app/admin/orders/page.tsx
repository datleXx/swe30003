"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { Eye } from "lucide-react";

const PAGE_SIZE = 10;

const statusVariant = (status: string) => {
  switch (status) {
    case "PENDING":
      return "outline";
    case "PROCESSING":
      return "default";
    case "SHIPPED":
      return "secondary";
    case "DELIVERED":
      return "default";
    case "CANCELLED":
      return "destructive";
    default:
      return null;
  }
};

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const router = useRouter();
  const { data, isLoading } = api.order.paginated.useQuery({
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <section className="mx-auto max-w-6xl px-2 py-8 md:px-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
      </div>
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || !data
              ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground py-6 text-center align-middle"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ))
              : data.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="align-middle font-mono text-xs">
                      {order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="align-middle">
                      {order.user?.name ??
                        order.user?.email ??
                        order.user?.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="align-middle text-xs">
                      {new Date(order.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="align-middle">
                      <Badge
                        variant={statusVariant(order.status)}
                        className="text-xs"
                      >
                        {order.status.charAt(0) +
                          order.status.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-middle font-semibold">
                      ${Number(order.total).toFixed(2)}
                    </TableCell>
                    <TableCell className="align-middle">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </Card>
      <div className="mt-8 flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-disabled={page === 1}
              />
            </PaginationItem>
            {data &&
              Array.from({ length: data.totalPages }, (_, i) => (
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
                onClick={() =>
                  setPage((p) =>
                    data ? Math.min(data.totalPages, p + 1) : p + 1,
                  )
                }
                aria-disabled={data ? page === data.totalPages : false}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </section>
  );
}
