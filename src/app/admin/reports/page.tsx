"use client";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { format } from "date-fns";
import {
  CalendarIcon,
  BarChart3,
  Users,
  ShoppingCart,
  DollarSign,
} from "lucide-react";

export default function AdminReportsPage() {
  const [startDate, setStartDate] = useState(
    format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data, isLoading } = api.report.getDailyMetrics.useQuery(
    {
      startDate,
      endDate,
    },
    {
      enabled: !!startDate && !!endDate,
    },
  );

  return (
    <section className="mx-auto max-w-7xl px-2 py-8 md:px-0">
      <div className="mb-6 flex items-center gap-4 justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Reports & Analytics
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="startDate">From</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="endDate">To</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders
                </CardTitle>
                <ShoppingCart className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.summary.totalOrders}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${data?.summary.totalRevenue.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Metrics Table */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Daily Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.dailyMetrics.map((metric) => (
                    <TableRow key={metric.date}>
                      <TableCell>{metric.date}</TableCell>
                      <TableCell>{metric.orderCount}</TableCell>
                      <TableCell>${metric.totalRevenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity Sold</TableHead>
                    <TableHead>Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.topProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 rounded border bg-gray-100 object-contain"
                        />
                      </TableCell>
                      <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                      <TableCell>{product.totalQuantity}</TableCell>
                      <TableCell>
                        $
                        {(
                          Number(product.price) * product.totalQuantity
                        ).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.orderStatusDistribution.map((status) => (
                    <TableRow key={status.status}>
                      <TableCell className="font-medium">
                        {status.status}
                      </TableCell>
                      <TableCell>{status.count}</TableCell>
                      <TableCell>
                        {data.summary.totalOrders > 0
                          ? (
                              (status.count / data.summary.totalOrders) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
