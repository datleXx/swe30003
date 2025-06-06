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
import { CampaignType } from "@prisma/client";

const PAGE_SIZE = 6;

type Product = RouterOutputs["product"]["getPaginated"]["products"][number];
type Cart = RouterOutputs["cart"]["getCart"];
type CartItem = Cart["items"][number];
type Campaign = RouterOutputs["campaign"]["getActiveCampaigns"][number];

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
  const { data: activeCampaigns } = api.campaign.getActiveCampaigns.useQuery();
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
      (sum: number, item: CartItem) =>
        sum + Number(item.product.price) * item.quantity,
      0,
    ) ?? 0;

  // Function to calculate discounted price based on campaign type
  const calculateDiscountedPrice = (
    product: Product,
    campaigns: Campaign[],
  ) => {
    const applicableCampaigns = campaigns.filter((campaign) => {
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
    });

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
            className="min-w-1/3 overflow-y-auto px-2 py-4"
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
              <div className="flex h-full flex-col gap-6">
                <div className="mx-auto flex-1 space-y-2 overflow-y-auto">
                  {cart.items.map((item: CartItem) => (
                    <div
                      key={item.id}
                      className="flex max-w-full items-center gap-4 rounded-lg border p-4 shadow-sm"
                    >
                      <div className="h-20 w-20">
                        <img
                          src={item.product.image ?? ""}
                          alt={item.product.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="max-w-xs truncate overflow-hidden text-base font-semibold whitespace-nowrap">
                          {item.product.name}
                        </div>
                        <div className="text-muted-foreground max-w-xs truncate overflow-hidden text-sm whitespace-nowrap">
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
        {data.products.map((product: Product) => {
          const discountedPrice = activeCampaigns
            ? calculateDiscountedPrice(product, activeCampaigns)
            : null;

          const applicableCampaigns =
            activeCampaigns?.filter((campaign: Campaign) => {
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
                    <div className="mb-2">
                      {discountedPrice ? (
                        <div className="flex items-center gap-2">
                          <TypographyP className="text-gray-500 line-through">
                            ${Number(product.price).toFixed(2)}
                          </TypographyP>
                          <TypographyP className="font-bold text-red-600">
                            ${discountedPrice.toFixed(2)}
                          </TypographyP>
                        </div>
                      ) : (
                        <TypographyP className="text-gray-500">
                          ${Number(product.price).toFixed(2)}
                        </TypographyP>
                      )}
                    </div>
                    {applicableCampaigns.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {applicableCampaigns.map((campaign: Campaign) => (
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
          );
        })}
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
                  {activeCampaigns &&
                  calculateDiscountedPrice(selectedProduct, activeCampaigns) ? (
                    <div className="flex items-center gap-2">
                      <p className="text-gray-500 line-through">
                        ${Number(selectedProduct.price).toFixed(2)}
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        $
                        {calculateDiscountedPrice(
                          selectedProduct,
                          activeCampaigns,
                        )!.toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold">
                      ${Number(selectedProduct.price).toFixed(2)}
                    </p>
                  )}
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

                {activeCampaigns &&
                  activeCampaigns.filter((campaign: Campaign) => {
                    if (campaign.applyToAllProducts) return true;
                    if (
                      campaign.products.some(
                        (p: { id: string }) => p.id === selectedProduct.id,
                      )
                    )
                      return true;
                    if (
                      campaign.categories.some(
                        (c: { id: string }) =>
                          c.id === selectedProduct.categoryId,
                      )
                    )
                      return true;
                    return false;
                  }).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {activeCampaigns
                        .filter((campaign: Campaign) => {
                          if (campaign.applyToAllProducts) return true;
                          if (
                            campaign.products.some(
                              (p: { id: string }) =>
                                p.id === selectedProduct.id,
                            )
                          )
                            return true;
                          if (
                            campaign.categories.some(
                              (c: { id: string }) =>
                                c.id === selectedProduct.categoryId,
                            )
                          )
                            return true;
                          return false;
                        })
                        .map((campaign: Campaign) => (
                          <Badge
                            key={campaign.id}
                            variant={getCampaignBadgeVariant(campaign)}
                          >
                            {getCampaignBadgeText(campaign)}
                          </Badge>
                        ))}
                    </div>
                  )}

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
