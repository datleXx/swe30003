import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

class OrderService {
  constructor(private readonly db: any) {}

  async createOrder(
    userId: string,
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    },
    payment: string,
  ) {
    // Get cart with items
    const cart = await this.db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cart is empty",
      });
    }

    // Create address
    const newAddress = await this.db.address.create({
      data: {
        userId,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      },
    });

    // Create order
    const order = await this.db.order.create({
      data: {
        userId,
        addressId: newAddress.id,
        status: "PENDING",
        total: cart.items.reduce(
          (
            sum: number,
            item: { product: { price: number }; quantity: number },
          ) => sum + Number(item.product.price) * item.quantity,
          0,
        ),
        items: {
          create: cart.items.map(
            (item: {
              productId: string;
              quantity: number;
              product: { price: number };
            }) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            }),
          ),
        },
      },
    });

    // Create payment
    await this.db.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        status: "PENDING",
        method: payment,
      },
    });

    // Clear cart
    await this.db.cartItem.deleteMany({ where: { cartId: cart.id } });

    return { orderId: order.id };
  }

  async getById(id: string) {
    const order = await this.db.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: { include: { product: true } },
        address: true,
        payment: true,
      },
    });

    if (!order) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Order not found",
      });
    }

    return order;
  }

  async getPaginated(page: number, pageSize: number, userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (user?.role !== "admin") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    const skip = (page - 1) * pageSize;
    const [orders, totalCount] = await Promise.all([
      this.db.order.findMany({
        where: {
          userId: userId,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
          address: true,
          payment: true,
        },
      }),
      this.db.order.count(),
    ]);

    return {
      orders,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }
}

// Create a singleton instance
let orderServiceInstance: OrderService | null = null;

export const orderRouter = createTRPCRouter({
  createOrder: protectedProcedure
    .input(
      z.object({
        address: z.object({
          line1: z.string(),
          line2: z.string().optional(),
          city: z.string(),
          state: z.string(),
          postalCode: z.string(),
          country: z.string(),
        }),
        payment: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      orderServiceInstance ??= new OrderService(ctx.db);
      return orderServiceInstance.createOrder(
        ctx.session.user.id,
        input.address,
        input.payment,
      );
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      orderServiceInstance ??= new OrderService(ctx.db);
      return orderServiceInstance.getById(input.id);
    }),

  paginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1),
        pageSize: z.number().min(1).max(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      orderServiceInstance ??= new OrderService(ctx.db);
      return orderServiceInstance.getPaginated(
        input.page,
        input.pageSize,
        ctx.session.user.id,
      );
    }),
});
