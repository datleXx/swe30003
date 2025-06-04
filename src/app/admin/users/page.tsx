"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { toast } from "sonner";
import { User, Eye, ArrowUp, ArrowDown, Ban, Check } from "lucide-react";

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const router = useRouter();
  const { data, isLoading } = api.user.getPaginated.useQuery({
    page,
    pageSize: PAGE_SIZE,
  });
  const updateRole = api.user.updateRole.useMutation();

  const utils = api.useUtils();
  const [roleDialog, setRoleDialog] = useState<{
    id: string;
    role: string;
  } | null>(null);
  const [disableDialog, setDisableDialog] = useState<{
    id: string;
    disabled: boolean;
  } | null>(null);

  const handleRoleChange = async () => {
    if (!roleDialog) return;
    try {
      await updateRole.mutateAsync({
        id: roleDialog.id,
        role: roleDialog.role,
      });
      toast.success("Role updated");
      setRoleDialog(null);
      void utils.user.getPaginated.invalidate();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update role");
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-2 py-8 md:px-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
      </div>
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || !data
              ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground py-6 text-center align-middle"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ))
              : data.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="align-middle">
                      <div className="flex items-center gap-2">
                        <User className="text-muted-foreground h-4 w-4" />
                        {user.name ?? user.email ?? user.id.slice(0, 8)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground align-middle text-xs">
                      {user.email}
                    </TableCell>
                    <TableCell className="align-middle">
                      <Badge
                        variant={user.role === "admin" ? "default" : "outline"}
                        className="text-xs"
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-middle">
                      {user._count.orders}
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          aria-label="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label={
                            user.role === "admin"
                              ? "Demote to user"
                              : "Promote to admin"
                          }
                          onClick={() =>
                            setRoleDialog({
                              id: user.id,
                              role: user.role === "admin" ? "user" : "admin",
                            })
                          }
                        >
                          {user.role === "admin" ? (
                            <ArrowDown className="h-4 w-4" />
                          ) : (
                            <ArrowUp className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </Card>
      <div className="mt-8 flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-disabled={page === 1}
              />
            </PaginationItem>
            {data &&
              Array.from({ length: data.totalPages }, (_, i) => (
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
                onClick={() =>
                  setPage((p) =>
                    data ? Math.min(data.totalPages, p + 1) : p + 1,
                  )
                }
                aria-disabled={data ? page === data.totalPages : false}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
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
            {roleDialog?.role === "admin" ? "promote" : "demote"} this user?
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
