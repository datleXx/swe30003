import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";
import { TypographyH1, TypographyP } from "~/components/ui/typography";
import Link from "next/link";

export default function HomePage() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-6">
      <TypographyH1>Welcome to ElectroStore</TypographyH1>
      <TypographyP className="max-w-xl text-center">
        Discover the latest electronics and gadgets at competitive prices.
      </TypographyP>
      <Link href="/products">
        <Button size="lg" className="gap-2">
          Shop Now <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </section>
  );
}
