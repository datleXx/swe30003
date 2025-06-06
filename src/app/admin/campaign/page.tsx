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
import { Plus, Edit, Trash2, Play, Pause, StopCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { toast } from "sonner";

const PAGE_SIZE = 10;

const statusVariant = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "outline";
    case "ACTIVE":
      return "default";
    case "PAUSED":
      return "secondary";
    case "ENDED":
      return "destructive";
    default:
      return "outline";
  }
};

const typeLabel = (type: string) => {
  switch (type) {
    case "PERCENTAGE_DISCOUNT":
      return "Percentage Discount";
    case "FIXED_AMOUNT_DISCOUNT":
      return "Fixed Amount Discount";
    case "BUY_ONE_GET_ONE":
      return "Buy One Get One";
    case "FREE_SHIPPING":
      return "Free Shipping";
    case "FLAT_PRICE":
      return "Flat Price";
    default:
      return type;
  }
};

export default function AdminCampaignsPage() {
  const [page, setPage] = useState(1);
  const router = useRouter();
  const { data, isLoading } = api.campaign.getPaginated.useQuery({
    page,
    pageSize: PAGE_SIZE,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteCampaign = api.campaign.delete.useMutation();
  const updateStatus = api.campaign.updateStatus.useMutation();
  const utils = api.useUtils();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCampaign.mutateAsync(deleteId);
      toast.success("Campaign deleted");
      setDeleteId(null);
      void utils.campaign.getPaginated.invalidate();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete campaign");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus as any });
      toast.success(`Campaign ${newStatus.toLowerCase()}`);
      void utils.campaign.getPaginated.invalidate();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update campaign status");
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-2 py-8 md:px-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        <Button onClick={() => router.push("/admin/campaigns/new")}>
          <Plus className="mr-2 h-4 w-4" /> Add Campaign
        </Button>
      </div>
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || !data
              ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell
                      colSpan={7}
                      className="text-muted-foreground py-6 text-center"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ))
              : data.campaigns.map((campaign: any) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      {campaign.name}
                    </TableCell>
                    <TableCell>{typeLabel(campaign.type)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(campaign.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(campaign.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {campaign.usageCount} / {campaign.maxUsage || "∞"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            router.push(`/admin/campaigns/${campaign.id}`)
                          }
                          aria-label="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {campaign.status === "DRAFT" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              handleStatusChange(campaign.id, "ACTIVE")
                            }
                            aria-label="Activate"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {campaign.status === "ACTIVE" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              handleStatusChange(campaign.id, "PAUSED")
                            }
                            aria-label="Pause"
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {(campaign.status === "ACTIVE" ||
                          campaign.status === "PAUSED") && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              handleStatusChange(campaign.id, "ENDED")
                            }
                            aria-label="End"
                          >
                            <StopCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteId(campaign.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this campaign?</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleteCampaign.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCampaign.isPending}
            >
              {deleteCampaign.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
