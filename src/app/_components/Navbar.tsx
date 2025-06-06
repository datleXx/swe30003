"use client";
import { Button } from "~/components/ui/button";
import {
  LogIn,
  LogOut,
  User,
  ShoppingCart,
  ListOrdered,
  BarChart3,
} from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const { data: userData } = api.user.getById.useQuery(
    { id: user?.id ?? "" },
    {
      enabled: !!user,
    },
  );
  const { data: cartItemCount = 0 } = api.cart.getItemCount.useQuery(
    undefined,
    {
      enabled: !!user,
    },
  );
  const router = useRouter();
  return (
    <nav className="flex w-full items-center justify-between border-b bg-white px-4 py-3 md:px-6 md:py-4">
      <span
        className="cursor-pointer text-lg font-bold tracking-tight"
        onClick={() => router.push("/products")}
      >
        ElectroStore
      </span>
      <div className="flex items-center gap-2 md:gap-4">
        <Link href="/products" className="relative">
          <Button variant="ghost" size="icon" className="relative">
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
        </Link>
        <Link href="/orders">
          <Button variant="ghost" size="icon">
            <ListOrdered className="h-5 w-5" />
            <span className="sr-only">My Orders</span>
          </Button>
        </Link>
        {userData?.role === "admin" && (
          <>
            <Link href="/admin/products">
              <Button variant="ghost" size="sm">
                Admin Products
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm">
                Admin Orders
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                Admin Users
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="ghost" size="sm" className="gap-1">
                <BarChart3 className="h-4 w-4" />
                Reports
              </Button>
            </Link>
          </>
        )}
        {status === "loading" ? null : user ? (
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden items-center gap-2 text-sm text-gray-700 md:flex">
              <User className="h-4 w-4" />
              {user.name ?? user.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4" />{" "}
              <span className="hidden md:inline">Sign out</span>
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() =>
              signIn("credentials", {
                redirect: true,
                callbackUrl: "/products",
              })
            }
          >
            <LogIn className="h-4 w-4" />{" "}
            <span className="hidden md:inline">Sign in</span>
          </Button>
        )}
      </div>
    </nav>
  );
}
