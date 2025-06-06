"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { CampaignStatus, CampaignType } from "@prisma/client";
import { Pencil, Trash2, Play, Pause } from "lucide-react";

const PAGE_SIZE = 10;

const statusVariant: Record<
  CampaignStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  [CampaignStatus.DRAFT]: "secondary",
  [CampaignStatus.ACTIVE]: "default",
  [CampaignStatus.PAUSED]: "outline",
  [CampaignStatus.ENDED]: "destructive",
};

const typeLabel: Record<CampaignType, string> = {
  [CampaignType.PERCENTAGE_DISCOUNT]: "Percentage Discount",
  [CampaignType.FIXED_AMOUNT_DISCOUNT]: "Fixed Amount Discount",
  [CampaignType.BUY_ONE_GET_ONE]: "Buy One Get One",
  [CampaignType.FREE_SHIPPING]: "Free Shipping",
  [CampaignType.FLAT_PRICE]: "Flat Price",
};

export default function CampaignsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  const { data, isLoading } = api.campaign.getPaginated.useQuery({
    page,
    pageSize: PAGE_SIZE,
  });

  const deleteMutation = api.campaign.delete.useMutation({
    onSuccess: () => {
      toast.success("Campaign deleted successfully");
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateStatusMutation = api.campaign.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Campaign status updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = (id: string) => {
    setCampaignToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (campaignToDelete) {
      deleteMutation.mutate(campaignToDelete);
    }
  };

  const handleStatusUpdate = (id: string, status: CampaignStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Button onClick={() => router.push("/admin/campaigns/new")}>
          Add New Campaign
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.campaigns.map((campaign: any) => (
                    <TableRow key={campaign.id}>
                      <TableCell>{campaign.name}</TableCell>
                      <TableCell>
                        {typeLabel[campaign.type as CampaignType]}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusVariant[campaign.status as CampaignStatus]
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(campaign.startDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(campaign.endDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(`/admin/campaigns/${campaign.id}`)
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {campaign.status === CampaignStatus.ACTIVE ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleStatusUpdate(
                                  campaign.id,
                                  CampaignStatus.PAUSED,
                                )
                              }
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : campaign.status === CampaignStatus.PAUSED ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleStatusUpdate(
                                  campaign.id,
                                  CampaignStatus.ACTIVE,
                                )
                              }
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(campaign.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span>
                  Page {page} of {data?.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data?.totalPages}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this campaign? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
