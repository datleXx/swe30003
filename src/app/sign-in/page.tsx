"use client";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { TypographyH1, TypographyP } from "~/components/ui/typography";
import { LogIn } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-sm p-6">
        <CardContent className="flex flex-col items-center gap-6">
          <LogIn className="text-primary h-8 w-8" />
          <TypographyH1 className="text-2xl">Sign In</TypographyH1>
          <TypographyP className="text-muted-foreground text-center text-sm">
            Sign in to your account using Google.
          </TypographyP>
          <Button
            className="mt-4 w-full gap-2"
            onClick={() => signIn("google", { callbackUrl: "/products" })}
            variant="default"
            size="lg"
          >
            <LogIn className="h-4 w-4" /> Sign in with Google
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link href="/products">Continue browsing</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
