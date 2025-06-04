"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { TypographyH1, TypographyP } from "~/components/ui/typography";
import { toast } from "sonner";
import { z } from "zod";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { CreditCard, Apple, Wallet } from "lucide-react";

const addressSchema = z.object({
  line1: z.string().min(2),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(2),
  country: z.string().min(2),
});

type Address = z.infer<typeof addressSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cart, isLoading } = api.cart.getCart.useQuery();
  const createOrder = api.order.createOrder.useMutation();
  const [address, setAddress] = useState<Address>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [payment, setPayment] = useState("cod");
  const [submitting, setSubmitting] = useState(false);

  const subtotal =
    cart?.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    ) ?? 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = addressSchema.safeParse(address);
    if (!result.success) {
      toast.error("Please fill in all address fields correctly.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createOrder.mutateAsync({
        address,
        payment,
      });
      toast.success("Order placed!");
      router.push(`/order/${res.orderId}`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <div className="py-12 text-center">Loading...</div>;
  if (!cart || cart.items.length === 0)
    return <div className="py-12 text-center">Your cart is empty.</div>;

  return (
    <section className="mx-auto max-w-3xl py-8">
      <TypographyH1 className="mb-6">Checkout</TypographyH1>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-4 text-lg font-semibold">Shipping Address</h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="line1" className="my-1">
                    Address Line 1
                  </Label>
                  <Input
                    id="line1"
                    name="line1"
                    value={address.line1}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="line2" className="my-1">
                    Address Line 2 (optional)
                  </Label>
                  <Input
                    id="line2"
                    name="line2"
                    value={address.line2}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="city" className="my-1">
                      City
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={address.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="state" className="my-1">
                      State
                    </Label>
                    <Input
                      id="state"
                      name="state"
                      value={address.state}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="postalCode" className="my-1">
                      Postal Code
                    </Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={address.postalCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="country" className="my-1">
                      Country
                    </Label>
                    <Input
                      id="country"
                      name="country"
                      value={address.country}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <RadioGroup
                    className="mt-2 flex flex-col gap-0"
                    value={payment}
                    onValueChange={setPayment}
                  >
                    <label
                      className={`my-1 flex w-full cursor-pointer items-center gap-3 rounded-lg border px-1 py-2 transition-colors ${payment === "card" ? "border-primary bg-primary/5" : "border-muted bg-background"}`}
                    >
                      <RadioGroupItem value="card" className="mr-2" />
                      <CreditCard className="h-5 w-5" />
                      <span className="text-sm font-light">Credit Card</span>
                    </label>
                    <label
                      className={`my-1 flex w-full cursor-pointer items-center gap-3 rounded-lg border px-1 py-2 transition-colors ${payment === "cod" ? "border-primary bg-primary/5" : "border-muted bg-background"}`}
                    >
                      <RadioGroupItem value="cod" className="mr-2" />
                      <Wallet className="h-5 w-5" />
                      <span className="text-sm font-light">
                        Cash on Delivery
                      </span>
                    </label>
                  </RadioGroup>
                </div>
                <Button
                  type="submit"
                  className="mt-4 w-full"
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? "Placing Order..." : "Place Order"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
              <div className="space-y-3">
                {cart.items.map((item) => (
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
                      ${Number(item.product.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-base font-semibold">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
