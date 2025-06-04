import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

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
      const userId = ctx.session.user.id;
      // Get cart with items
      const cart = await ctx.db.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }
      // Create address
      const address = await ctx.db.address.create({
        data: {
          userId,
          line1: input.address.line1,
          line2: input.address.line2,
          city: input.address.city,
          state: input.address.state,
          postalCode: input.address.postalCode,
          country: input.address.country,
        },
      });
      // Create order
      const order = await ctx.db.order.create({
        data: {
          userId,
          addressId: address.id,
          status: "PENDING",
          total: cart.items.reduce(
            (sum, item) => sum + Number(item.product.price) * item.quantity,
            0,
          ),
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      });
      // Create payment
      await ctx.db.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          status: "PENDING",
          method: input.payment,
        },
      });
      // Clear cart
      await ctx.db.cartItem.deleteMany({ where: { cartId: cart.id } });
      return { orderId: order.id };
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          items: { include: { product: true } },
          address: true,
          payment: true,
        },
      });
      if (!order) throw new Error("Order not found");
      return order;
    }),
  paginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1),
        pageSize: z.number().min(1).max(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });
      if (user?.role !== "admin") throw new Error("Unauthorized");
      const skip = (input.page - 1) * input.pageSize;
      const [orders, totalCount] = await Promise.all([
        ctx.db.order.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take: input.pageSize,
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
        ctx.db.order.count(),
      ]);
      return {
        orders,
        totalCount,
        totalPages: Math.ceil(totalCount / input.pageSize),
      };
    }),
});
