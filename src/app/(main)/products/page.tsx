"use client";
import { useState } from "react";
import { api, type RouterOutputs } from "~/trpc/react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { TypographyH1, TypographyP } from "~/components/ui/typography";
import { ShoppingCart, Trash2, Minus, Plus } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Badge } from "~/components/ui/badge";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 6;

type Product = RouterOutputs["product"]["getPaginated"]["products"][number];
type Cart = RouterOutputs["cart"]["getCart"];
type CartItem = Cart["items"][number];

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(
    undefined,
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const { data: session } = useSession();
  const { data, isLoading } = api.product.getPaginated.useQuery({
    page,
    pageSize: PAGE_SIZE,
  });
  const router = useRouter();

  // Get cart item count
  const { data: cartItemCount = 0 } = api.cart.getItemCount.useQuery(
    undefined,
    {
      enabled: !!session?.user,
    },
  );
  const utils = api.useUtils();
  // Get cart details
  const {
    data: cart,
    refetch: refetchCart,
    isLoading: cartLoading,
  } = api.cart.getCart.useQuery(undefined, {
    enabled: !!session?.user && cartSheetOpen,
  });
  // Add to cart mutation
  const addToCartMutation = api.cart.addToCart.useMutation({
    onSuccess: () => {
      toast.success("Added to cart");
      void utils.cart.getCart.invalidate();
      void utils.cart.getItemCount.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add to cart");
    },
  });
  // Update quantity mutation
  const updateQuantityMutation = api.cart.updateQuantity.useMutation({
    onSuccess: () => {
      void utils.cart.getCart.invalidate();
      void utils.cart.getItemCount.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update quantity");
    },
  });
  // Remove from cart mutation
  const removeFromCartMutation = api.cart.removeFromCart.useMutation({
    onSuccess: () => {
      toast.success("Removed from cart");
      void utils.cart.getCart.invalidate();
      void utils.cart.getItemCount.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove item");
    },
  });

  const handleAddToCart = (productId: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent opening the product detail sheet
    if (!session?.user) {
      toast.error("Please sign in to add items to cart");
      return;
    }
    void addToCartMutation.mutate({ productId });
  };

  const handleUpdateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity < 1) return;
    void updateQuantityMutation.mutate({ cartItemId, quantity });
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    void removeFromCartMutation.mutate({ cartItemId });
  };

  const subtotal =
    cart?.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    ) ?? 0;

  if (isLoading) return <div className="py-12 text-center">Loading...</div>;
  if (!data) return <div className="py-12 text-center">No products found.</div>;

  return (
    <section className="mx-auto max-w-7xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <TypographyH1>Products</TypographyH1>
        <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={() => setCartSheetOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center p-0 text-xs"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="max-w-2xl overflow-y-auto px-2 py-4"
          >
            <SheetTitle className="text-2xl font-bold">Your Cart</SheetTitle>
            {cartLoading ? (
              <div className="text-muted-foreground py-8 text-center">
                Loading cart...
              </div>
            ) : !cart || cart.items.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                Your cart is empty.
              </div>
            ) : (
              <div className="flex h-full max-w-full flex-col gap-6">
                <div className="mx-auto flex-1 space-y-2 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 rounded-lg border p-4 shadow-sm"
                    >
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                        <img
                          src={item.product.image ?? ""}
                          alt={item.product.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold">
                          {item.product.name}
                        </div>
                        <div className="text-muted-foreground truncate text-sm">
                          {item.product.brand}
                        </div>
                        <div className="mt-1 text-sm font-light">
                          ${Number(item.product.price).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="mx-2 w-6 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-7 w-7"
                          onClick={() => handleRemoveFromCart(item.id)}
                          aria-label="Remove from cart"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-base">
                    <span className="text-lg font-semibold">Subtotal</span>
                    <span className="font-light">${subtotal.toFixed(2)}</span>
                  </div>
                  <Button
                    className="mt-6 w-full py-6 text-lg font-bold"
                    size="lg"
                    onClick={() => router.push("/checkout")}
                  >
                    Checkout
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {data.products.map((product) => (
          <div key={product.id}>
            <Card
              className="hov flex cursor-pointer flex-col"
              onClick={() => {
                setSelectedProduct(product);
                setSheetOpen(true);
              }}
            >
              <img
                src={product.image ?? ""}
                alt={product.name}
                className="h-20 w-full rounded-t object-cover"
              />
              <CardContent className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <TypographyP className="mb-2 text-lg font-semibold">
                    {product.name}
                  </TypographyP>
                  <TypographyP className="mb-4 text-gray-500">
                    ${Number(product.price).toFixed(2)}
                  </TypographyP>
                </div>
                <Button
                  className="mt-auto w-full gap-2"
                  variant="default"
                  onClick={(e) => handleAddToCart(product.id, e)}
                >
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </Button>
              </CardContent>
            </Card>
          </div>
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
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTitle className="sr-only">Product Details</SheetTitle>
        <SheetContent side="right" className="overflow-y-auto">
          {selectedProduct && (
            <div className="flex flex-col gap-6 px-2 py-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={selectedProduct.image ?? ""}
                  alt={selectedProduct.name}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {selectedProduct.brand}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">
                    ${Number(selectedProduct.price).toFixed(2)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {selectedProduct.quantity > 0 ? (
                      <span className="text-green-600">
                        In Stock ({selectedProduct.quantity})
                      </span>
                    ) : (
                      <span className="text-red-600">Out of Stock</span>
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Description</h3>
                  <p className="text-muted-foreground text-sm">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => handleAddToCart(selectedProduct.id)}
                    disabled={selectedProduct.quantity <= 0}
                  >
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
