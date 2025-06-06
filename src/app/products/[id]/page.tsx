"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { CampaignType } from "@prisma/client";
import { ShoppingCart } from "lucide-react";
import { cn } from "~/lib/utils";

// Skeleton component for loading states
const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
};

export default function ProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = api.product.getById.useQuery({
    id: params.id,
  });
  const { data: activeCampaigns } = api.campaign.getActiveCampaigns.useQuery();

  const addToCartMutation = api.cart.addToCart.useMutation({
    onSuccess: () => {
      toast.success("Product added to cart");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-1/3" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-10 w-10" />
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto py-6 text-center">
        Product not found
      </div>
    );
  }

  const applicableCampaigns = activeCampaigns?.filter(
    (campaign: {
      applyToAllProducts: boolean;
      products: { id: string }[];
      categories: { id: string }[];
    }) => {
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
    },
  );

  // Function to get campaign badge text
  const getCampaignBadgeText = (campaign: {
    type: CampaignType;
    discountValue?: number | null;
    buyQuantity?: number | null;
    getQuantity?: number | null;
    flatPrice?: number | null;
    name?: string | null;
  }) => {
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
        return campaign.name || "SPECIAL OFFER";
    }
  };

  const calculateDiscountedPrice = (price: number) => {
    if (!applicableCampaigns?.length) return price;

    let finalPrice = price;
    let discountApplied = false;

    for (const campaign of applicableCampaigns) {
      switch (campaign.type) {
        case CampaignType.PERCENTAGE_DISCOUNT:
          if (campaign.discountValue) {
            const discount = (price * Number(campaign.discountValue)) / 100;
            const maxDiscount = campaign.maximumDiscountAmount
              ? Number(campaign.maximumDiscountAmount)
              : Infinity;
            finalPrice = price - Math.min(discount, maxDiscount);
            discountApplied = true;
          }
          break;
        case CampaignType.FIXED_AMOUNT_DISCOUNT:
          if (campaign.discountValue) {
            finalPrice = price - Number(campaign.discountValue);
            discountApplied = true;
          }
          break;
        case CampaignType.FLAT_PRICE:
          if (campaign.flatPrice) {
            finalPrice = Number(campaign.flatPrice);
            discountApplied = true;
          }
          break;
      }
    }

    return discountApplied ? Math.max(0, finalPrice) : price;
  };

  const originalPrice = Number(product.price);
  const discountedPrice = calculateDiscountedPrice(originalPrice);
  const hasDiscount = discountedPrice < originalPrice;

  const handleAddToCart = () => {
    addToCartMutation.mutate({
      productId: product.id,
      quantity,
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-auto w-full rounded-lg object-cover"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-gray-200">
              No image available
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="mt-2 text-gray-600">{product.description}</p>
          </div>

          <div className="flex items-center space-x-4">
            {hasDiscount ? (
              <>
                <span className="text-2xl font-bold text-red-600">
                  ${discountedPrice.toFixed(2)}
                </span>
                <span className="text-lg text-gray-500 line-through">
                  ${originalPrice.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {applicableCampaigns && applicableCampaigns.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {applicableCampaigns.map(
                (campaign: {
                  id: string;
                  type: CampaignType;
                  discountValue?: number | null;
                  buyQuantity?: number | null;
                  getQuantity?: number | null;
                  flatPrice?: number | null;
                  name?: string | null;
                }) => (
                  <Badge key={campaign.id} variant="secondary">
                    {getCampaignBadgeText(campaign)}
                  </Badge>
                ),
              )}
            </div>
          )}

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              -
            </Button>
            <span className="w-8 text-center">{quantity}</span>
            <Button
              variant="outline"
              onClick={() => setQuantity(quantity + 1)}
              disabled={quantity >= product.quantity}
            >
              +
            </Button>
            <span className="text-sm text-gray-500">
              {product.quantity > 0
                ? `${product.quantity} in stock`
                : "Out of stock"}
            </span>
          </div>

          <Button
            className="w-full"
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending || product.quantity <= 0}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {product.quantity <= 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
