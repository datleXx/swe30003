"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { CampaignStatus, CampaignType } from "@prisma/client";

const campaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  type: z.nativeEnum(CampaignType),
  status: z.nativeEnum(CampaignStatus),
  discountValue: z.number().optional(),
  buyQuantity: z.number().optional(),
  getQuantity: z.number().optional(),
  flatPrice: z.number().optional(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  minimumOrderAmount: z.number().optional(),
  maximumDiscountAmount: z.number().optional(),
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  applyToAllProducts: z.boolean(),
  maxUsage: z.number().optional(),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

interface CampaignFormProps {
  campaignId?: string;
}

export default function CampaignForm({ campaignId }: CampaignFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(!!campaignId);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [productPage, setProductPage] = useState(1);

  const { data: campaign } = api.campaign.getById.useQuery(campaignId!, {
    enabled: !!campaignId,
  });

  const { data: products } = api.product.getPaginated.useQuery({
    page: productPage,
    pageSize: 50,
  });

  const { data: categories } = api.product.getCategories.useQuery();

  const createMutation = api.campaign.create.useMutation({
    onSuccess: () => {
      toast.success("Campaign created successfully");
      router.push("/admin/campaigns");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = api.campaign.update.useMutation({
    onSuccess: () => {
      toast.success("Campaign updated successfully");
      router.push("/admin/campaigns");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm<CampaignFormValues>({
    // @ts-expect-error - zodResolver is not typed correctly
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      type: CampaignType.PERCENTAGE_DISCOUNT,
      status: CampaignStatus.DRAFT,
      applyToAllProducts: false,
    },
  });

  useEffect(() => {
    if (campaign) {
      const productIds = campaign.products.map((p: any) => p.id);
      const categoryIds = campaign.categories.map((c: any) => c.id);
      setSelectedProducts(productIds);
      setSelectedCategories(categoryIds);

      form.reset({
        name: campaign.name,
        description: campaign.description,
        type: campaign.type,
        status: campaign.status,
        discountValue: campaign.discountValue
          ? Number(campaign.discountValue)
          : undefined,
        buyQuantity: campaign.buyQuantity ?? undefined,
        getQuantity: campaign.getQuantity ?? undefined,
        flatPrice: campaign.flatPrice ? Number(campaign.flatPrice) : undefined,
        startDate: campaign.startDate.toISOString().split("T")[0],
        endDate: campaign.endDate.toISOString().split("T")[0],
        minimumOrderAmount: campaign.minimumOrderAmount
          ? Number(campaign.minimumOrderAmount)
          : undefined,
        maximumDiscountAmount: campaign.maximumDiscountAmount
          ? Number(campaign.maximumDiscountAmount)
          : undefined,
        productIds,
        categoryIds,
        applyToAllProducts: campaign.applyToAllProducts,
        maxUsage: campaign.maxUsage ?? undefined,
      });
    }
  }, [campaign, form]);

  const onSubmit = (data: CampaignFormValues) => {
    if (isEditing && campaignId) {
      updateMutation.mutate({
        id: campaignId,
        ...data,
        productIds: selectedProducts,
        categoryIds: selectedCategories,
      });
    } else {
      createMutation.mutate({
        ...data,
        productIds: selectedProducts,
        categoryIds: selectedCategories,
      });
    }
  };

  const watchType = form.watch("type");
  const watchApplyToAllProducts = form.watch("applyToAllProducts");

  const handleProductSelect = (productId: string) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? "Edit Campaign" : "Create Campaign"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit as any)}
              className="space-y-6"
            >
              <FormField
                control={form.control as any}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select campaign type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={CampaignType.PERCENTAGE_DISCOUNT}>
                            Percentage Discount
                          </SelectItem>
                          <SelectItem
                            value={CampaignType.FIXED_AMOUNT_DISCOUNT}
                          >
                            Fixed Amount Discount
                          </SelectItem>
                          <SelectItem value={CampaignType.BUY_ONE_GET_ONE}>
                            Buy One Get One
                          </SelectItem>
                          <SelectItem value={CampaignType.FREE_SHIPPING}>
                            Free Shipping
                          </SelectItem>
                          <SelectItem value={CampaignType.FLAT_PRICE}>
                            Flat Price
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={CampaignStatus.DRAFT}>
                            Draft
                          </SelectItem>
                          <SelectItem value={CampaignStatus.ACTIVE}>
                            Active
                          </SelectItem>
                          <SelectItem value={CampaignStatus.PAUSED}>
                            Paused
                          </SelectItem>
                          <SelectItem value={CampaignStatus.ENDED}>
                            Ended
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchType === CampaignType.PERCENTAGE_DISCOUNT && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="discountValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Enter a value between 0 and 100
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="maximumDiscountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Discount Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {watchType === CampaignType.FIXED_AMOUNT_DISCOUNT && (
                <FormField
                  control={form.control as any}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchType === CampaignType.BUY_ONE_GET_ONE && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="buyQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buy Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="getQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Get Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {watchType === CampaignType.FLAT_PRICE && (
                <FormField
                  control={form.control as any}
                  name="flatPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flat Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control as any}
                name="minimumOrderAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Order Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="maxUsage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Usage</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty for unlimited usage
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="applyToAllProducts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Apply to all products</FormLabel>
                      <FormDescription>
                        If checked, the campaign will apply to all products
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {!watchApplyToAllProducts && (
                <>
                  <FormField
                    control={form.control as any}
                    name="productIds"
                    render={() => (
                      <FormItem>
                        <FormLabel>Products</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {products?.products.map((product: any) => (
                              <div
                                key={product.id}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`product-${product.id}`}
                                  checked={selectedProducts.includes(
                                    product.id,
                                  )}
                                  onCheckedChange={() =>
                                    handleProductSelect(product.id)
                                  }
                                />
                                <label
                                  htmlFor={`product-${product.id}`}
                                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {product.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="categoryIds"
                    render={() => (
                      <FormItem>
                        <FormLabel>Categories</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {categories?.map((category: any) => (
                              <div
                                key={category.id}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`category-${category.id}`}
                                  checked={selectedCategories.includes(
                                    category.id,
                                  )}
                                  onCheckedChange={() =>
                                    handleCategorySelect(category.id)
                                  }
                                />
                                <label
                                  htmlFor={`category-${category.id}`}
                                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {category.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/campaigns")}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditing ? "Update Campaign" : "Create Campaign"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
