"use client";
import { useRouter, useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { toast } from "sonner";
import { User, ArrowUp, ArrowDown, Ban, Check, Package } from "lucide-react";
import { useState } from "react";

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { data: user, isLoading } = api.user.getById.useQuery(
    { id: userId },
    { enabled: !!userId },
  );
  const updateRole = api.user.updateRole.useMutation();
  const utils = api.useUtils();
  const [roleDialog, setRoleDialog] = useState<string | null>(null);

  const handleRoleChange = async () => {
    if (!user || !roleDialog) return;
    try {
      await updateRole.mutateAsync({ id: user.id, role: roleDialog });
      toast.success("Role updated");
      setRoleDialog(null);
      void utils.user.getById.invalidate();
      void utils.user.getPaginated.invalidate();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update role");
    }
  };

  if (isLoading || !user)
    return <div className="py-12 text-center">Loading...</div>;

  return (
    <section className="mx-auto max-w-3xl px-2 py-8 md:px-0">
      <Card>
        <CardContent className="p-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <User className="text-muted-foreground h-8 w-8" />
              <div>
                <div className="text-lg font-bold">
                  {user.name ?? user.email ?? user.id.slice(0, 8)}
                </div>
                <div className="text-muted-foreground text-xs">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={user.role === "admin" ? "default" : "outline"}
                className="text-xs"
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>
          </div>
          <div className="mb-6 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setRoleDialog(user.role === "admin" ? "user" : "admin")
              }
              className="gap-2"
              disabled={updateRole.isPending}
            >
              {user.role === "admin" ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
              {user.role === "admin" ? "Demote to user" : "Promote to admin"}
            </Button>
          </div>
          <h2 className="mt-6 mb-2 flex items-center gap-2 text-lg font-semibold">
            <Package className="h-5 w-5" /> Order History
          </h2>
          <Card className="mb-6">
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.orders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-muted-foreground text-center"
                      >
                        No orders
                      </TableCell>
                    </TableRow>
                  ) : (
                    user.orders.map((order: any) => (
                      <TableRow
                        key={order.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => router.push(`/order/${order.id}`)}
                      >
                        <TableCell className="font-mono text-xs">
                          {order.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(order.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {order.status.charAt(0) +
                              order.status.slice(1).toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${Number(order.total).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <h2 className="mb-2 text-lg font-semibold">Addresses</h2>
          <Card>
            <CardContent className="p-4">
              {user.addresses.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  No addresses
                </div>
              ) : (
                <ul className="space-y-2">
                  {user.addresses.map((addr: any) => (
                    <li key={addr.id} className="text-sm">
                      {addr.line1}
                      {addr.line2 && <>, {addr.line2}</>}
                      <br />
                      {addr.city}, {addr.state} {addr.postalCode}
                      <br />
                      {addr.country}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      {/* Role dialog */}
      <Dialog
        open={!!roleDialog}
        onOpenChange={(open) => !open && setRoleDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to{" "}
            {roleDialog === "admin" ? "promote" : "demote"} this user?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialog(null)}
              disabled={updateRole.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleRoleChange}
              disabled={updateRole.isPending}
            >
              {updateRole.isPending ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
