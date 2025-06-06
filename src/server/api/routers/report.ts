import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

class ReportService {
  constructor(private readonly db: any) {}

  async getDailyMetrics(userId: string, startDate: Date, endDate: Date) {
    // Check if user is admin
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (user?.role !== "admin") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    // Get daily order metrics
    const dailyOrderMetrics = await this.db.order.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    });

    // Get top selling products
    const topSellingProducts = await this.db.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    // Get product details for top selling products
    const productIds = topSellingProducts.map((item: any) => item.productId);
    const products = await this.db.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
      },
    });

    // Combine product details with sales data
    const topProducts = topSellingProducts.map((item: any) => {
      const product = products.find((p: any) => p.id === item.productId);
      return {
        id: item.productId,
        name: product?.name || "Unknown Product",
        price: product?.price || 0,
        image: product?.image || "",
        totalQuantity: item._sum.quantity,
      };
    });

    // Get order status distribution
    const orderStatusDistribution = await this.db.order.groupBy({
      by: ["status"],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Format the data for the frontend
    const formattedDailyMetrics = dailyOrderMetrics.map((metric: any) => {
      const date = new Date(metric.createdAt);
      const formattedDate = date.toISOString().split("T")[0];

      return {
        date: formattedDate,
        orderCount: metric._count.id,
        totalRevenue: Number(metric._sum.total),
      };
    });

    return {
      dailyMetrics: formattedDailyMetrics,
      topProducts,
      orderStatusDistribution: orderStatusDistribution.map((status: any) => ({
        status: status.status,
        count: status._count.id,
      })),
      summary: {
        totalOrders: dailyOrderMetrics.reduce(
          (sum: number, metric: any) => sum + metric._count.id,
          0,
        ),
        totalRevenue: dailyOrderMetrics.reduce(
          (sum: number, metric: any) => sum + Number(metric._sum.total),
          0,
        ),
      },
    };
  }
}

// Create a singleton instance
let reportServiceInstance: ReportService | null = null;

export const reportRouter = createTRPCRouter({
  getDailyMetrics: protectedProcedure
    .input(
      z.object({
        startDate: z.string().transform((str) => new Date(str)),
        endDate: z.string().transform((str) => new Date(str)),
      }),
    )
    .query(async ({ ctx, input }) => {
      reportServiceInstance ??= new ReportService(ctx.db);
      return reportServiceInstance.getDailyMetrics(
        ctx.session.user.id,
        input.startDate,
        input.endDate,
      );
    }),
});
