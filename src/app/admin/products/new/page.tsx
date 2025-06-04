"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(10, "Description is required"),
  price: z.coerce.number().min(0.01, "Price must be positive"),
  quantity: z.coerce.number().int().min(0, "Quantity must be 0 or more"),
  brand: z.string().min(2, "Brand is required"),
  image: z.string().url("Image must be a valid URL"),
  categoryId: z.string().min(1, "Category is required"),
});

type ProductForm = z.infer<typeof productSchema>;

const IMGUR_CLIENT_ID = process.env.NEXT_PUBLIC_IMGUR_CLIENT_ID;

export default function AddProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>({
    name: "",
    description: "",
    price: 0,
    quantity: 0,
    brand: "",
    image: "",
    categoryId: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductForm, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const { data: categories, isLoading: loadingCategories } =
    api.product.getCategories.useQuery();
  const createProduct = api.product.create.useMutation();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = productSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ProductForm, string>> = {};
      for (const err of result.error.errors) {
        fieldErrors[err.path[0] as keyof ProductForm] = err.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await createProduct.mutateAsync(result.data);
      toast.success("Product created!");
      router.push("/admin/products");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    await uploadImage(file);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
          Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data.link) {
        setForm((f) => ({ ...f, image: data.data.link }));
        toast.success("Image uploaded!");
      } else {
        toast.error("Image upload failed");
      }
    } catch (err) {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl px-2 py-10 md:px-0">
      <Card>
        <CardContent className="p-8">
          <h1 className="mb-8 text-center text-2xl font-bold tracking-tight">
            Add Product
          </h1>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name" className="my-1">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                disabled={submitting}
              />
              {errors.name && (
                <div className="mt-1 text-xs text-red-500">{errors.name}</div>
              )}
            </div>
            <div>
              <Label htmlFor="description" className="my-1">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                disabled={submitting}
                rows={3}
              />
              {errors.description && (
                <div className="mt-1 text-xs text-red-500">
                  {errors.description}
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="price" className="my-1">
                  Price
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                />
                {errors.price && (
                  <div className="mt-1 text-xs text-red-500">
                    {errors.price}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="quantity" className="my-1">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                />
                {errors.quantity && (
                  <div className="mt-1 text-xs text-red-500">
                    {errors.quantity}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="brand" className="my-1">
                  Brand
                </Label>
                <Input
                  id="brand"
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                />
                {errors.brand && (
                  <div className="mt-1 text-xs text-red-500">
                    {errors.brand}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Label className="my-1">Product Image</Label>
                <div
                  className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 px-3 py-6 text-center transition hover:bg-gray-100"
                  onDrop={handleImageDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ minHeight: 120 }}
                >
                  {uploading ? (
                    <span className="text-muted-foreground text-xs">
                      Uploading...
                    </span>
                  ) : form.image ? (
                    <img
                      src={form.image}
                      alt="Preview"
                      className="mb-2 h-20 w-20 rounded border object-contain"
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      Drag & drop or click to upload
                    </span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                    disabled={uploading || submitting}
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    id="image"
                    name="image"
                    value={form.image}
                    onChange={handleChange}
                    placeholder="Or paste image URL"
                    disabled={submitting || uploading}
                  />
                  {form.image && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setForm((f) => ({ ...f, image: "" }))}
                      disabled={submitting || uploading}
                      aria-label="Remove image"
                    >
                      ×
                    </Button>
                  )}
                </div>
                {errors.image && (
                  <div className="mt-1 text-xs text-red-500">
                    {errors.image}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="categoryId" className="my-1">
                Category
              </Label>
              <select
                id="categoryId"
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                required
                disabled={submitting || loadingCategories}
                className="focus:ring-primary mt-1 block w-full rounded border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              >
                <option value="" disabled>
                  {loadingCategories ? "Loading..." : "Select a category"}
                </option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <div className="mt-1 text-xs text-red-500">
                  {errors.categoryId}
                </div>
              )}
            </div>
            <Button
              type="submit"
              className="mt-4 w-full"
              size="lg"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Product"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
