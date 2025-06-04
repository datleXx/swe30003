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
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const router = useRouter();
  const { data, isLoading } = api.product.getPaginated.useQuery({
    page,
    pageSize: PAGE_SIZE,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteProduct = api.product.delete.useMutation();
  const utils = api.useUtils();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct.mutateAsync({ id: deleteId });
      toast.success("Product deleted");
      setDeleteId(null);
      void utils.product.getPaginated.invalidate();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete product");
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-2 py-8 md:px-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <Button onClick={() => router.push("/admin/products/new")}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || !data
              ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell
                      colSpan={7}
                      className="text-muted-foreground py-6 text-center"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ))
              : data.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <img
                        src={product.image ?? ""}
                        alt={product.name}
                        className="h-10 w-10 rounded border bg-gray-100 object-contain"
                      />
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      {product.category?.name ? (
                        <Badge variant="outline" className="text-xs">
                          {product.category?.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Uncategorized
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {product.brand}
                    </TableCell>
                    <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          product.quantity > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {product.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            router.push(`/admin/products/${product.id}/edit`)
                          }
                          aria-label="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          aria-label="Delete"
                          onClick={() => setDeleteId(product.id)}
                          disabled={deleteProduct.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete this product? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleteProduct.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
