"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, type RouterOutputs } from "~/trpc/react";
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
import { CampaignType } from "@prisma/client";

const PAGE_SIZE = 10;

type Product = RouterOutputs["product"]["getPaginated"]["products"][number];
type Campaign = RouterOutputs["campaign"]["getActiveCampaigns"][number];

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const router = useRouter();
  const { data, isLoading } = api.product.getPaginated.useQuery({
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: activeCampaigns } = api.campaign.getActiveCampaigns.useQuery();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteProduct = api.product.delete.useMutation();
  const utils = api.useUtils();

  // Function to calculate discounted price based on campaign type
  const calculateDiscountedPrice = (
    product: Product,
    campaigns: Campaign[],
  ) => {
    const applicableCampaigns =
      campaigns?.filter((campaign) => {
        if (campaign.applyToAllProducts) return true;
        if (campaign.products.some((p: { id: string }) => p.id === product.id))
          return true;
        if (
          campaign.categories.some(
            (c: { id: string }) => c.id === product.categoryId,
          )
        )
          return true;
        return false;
      }) || [];

    if (applicableCampaigns.length === 0) return null;

    // For simplicity, we'll apply the first applicable campaign
    const campaign = applicableCampaigns[0];
    const originalPrice = Number(product.price);

    switch (campaign.type) {
      case CampaignType.PERCENTAGE_DISCOUNT:
        const discountAmount = originalPrice * (campaign.discountValue! / 100);
        const maxDiscount = campaign.maximumDiscountAmount || Infinity;
        return originalPrice - Math.min(discountAmount, maxDiscount);
      case CampaignType.FIXED_AMOUNT_DISCOUNT:
        return originalPrice - campaign.discountValue!;
      case CampaignType.FLAT_PRICE:
        return campaign.flatPrice!;
      case CampaignType.BUY_ONE_GET_ONE:
        // For BOGO, we'll show the original price but indicate the promotion
        return originalPrice;
      case CampaignType.FREE_SHIPPING:
        // Free shipping doesn't affect product price
        return originalPrice;
      default:
        return originalPrice;
    }
  };

  // Function to get campaign badge text
  const getCampaignBadgeText = (campaign: Campaign) => {
    switch (campaign.type) {
      case CampaignType.PERCENTAGE_DISCOUNT:
        return `${campaign.discountValue}% OFF`;
      case CampaignType.FIXED_AMOUNT_DISCOUNT:
        return `$${campaign.discountValue} OFF`;
      case CampaignType.BUY_ONE_GET_ONE:
        return `BOGO: Buy ${campaign.buyQuantity} Get ${campaign.getQuantity}`;
      case CampaignType.FREE_SHIPPING:
        return "FREE SHIPPING";
      case CampaignType.FLAT_PRICE:
        return `FLAT PRICE: $${campaign.flatPrice}`;
      default:
        return "SPECIAL OFFER";
    }
  };

  // Function to get campaign badge variant
  const getCampaignBadgeVariant = (campaign: Campaign) => {
    switch (campaign.type) {
      case CampaignType.PERCENTAGE_DISCOUNT:
        return "destructive"; // Red badge for percentage discounts
      case CampaignType.FIXED_AMOUNT_DISCOUNT:
        return "secondary";
      case CampaignType.BUY_ONE_GET_ONE:
        return "secondary";
      case CampaignType.FREE_SHIPPING:
        return "secondary";
      case CampaignType.FLAT_PRICE:
        return "secondary";
      default:
        return "secondary";
    }
  };

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
              : data.products.map((product) => {
                  const discountedPrice = activeCampaigns
                    ? calculateDiscountedPrice(product, activeCampaigns)
                    : null;

                  const applicableCampaigns =
                    activeCampaigns?.filter((campaign) => {
                      if (campaign.applyToAllProducts) return true;
                      if (
                        campaign.products.some(
                          (p: { id: string }) => p.id === product.id,
                        )
                      )
                        return true;
                      if (
                        campaign.categories.some(
                          (c: { id: string }) => c.id === product.categoryId,
                        )
                      )
                        return true;
                      return false;
                    }) || [];

                  return (
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
                      <TableCell>
                        <div className="flex flex-col">
                          {discountedPrice ? (
                            <>
                              <span className="font-medium text-red-600">
                                ${discountedPrice.toFixed(2)}
                              </span>
                              <span className="text-xs text-gray-500 line-through">
                                ${Number(product.price).toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span>${Number(product.price).toFixed(2)}</span>
                          )}
                          {applicableCampaigns.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {applicableCampaigns.map((campaign) => (
                                <Badge
                                  key={campaign.id}
                                  variant={getCampaignBadgeVariant(campaign)}
                                  className="text-xs"
                                >
                                  {getCampaignBadgeText(campaign)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
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
                  );
                })}
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
