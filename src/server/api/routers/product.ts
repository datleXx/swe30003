import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const productRouter = createTRPCRouter({
  getPaginated: publicProcedure
    .input(
      z.object({
        page: z.number().min(1),
        pageSize: z.number().min(1).max(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.pageSize;
      const [products, total] = await Promise.all([
        ctx.db.product.findMany({
          skip,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            category: {
              select: {
                name: true,
              },
            },
          },
        }),
        ctx.db.product.count(),
      ]);
      return {
        products,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        description: z.string().min(10),
        price: z.number().min(0.01),
        quantity: z.number().int().min(0),
        brand: z.string().min(2),
        image: z.string().url(),
        categoryId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Only allow admins
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });
      if (user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return ctx.db.product.create({
        data: {
          name: input.name,
          description: input.description,
          price: input.price,
          quantity: input.quantity,
          brand: input.brand,
          image: input.image,
          categoryId: input.categoryId,
        },
      });
    }),
  getCategories: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(2),
        description: z.string().min(10),
        price: z.number().min(0.01),
        quantity: z.number().int().min(0),
        brand: z.string().min(2),
        image: z.string().url(),
        categoryId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });
      if (user?.role !== "admin") throw new Error("Unauthorized");
      return ctx.db.product.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          price: input.price,
          quantity: input.quantity,
          brand: input.brand,
          image: input.image,
          categoryId: input.categoryId,
        },
      });
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });
      if (user?.role !== "admin") throw new Error("Unauthorized");
      await ctx.db.product.delete({ where: { id: input.id } });
      return { success: true };
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });
      console.log("user", user);
      if (user?.role !== "admin") throw new Error("Unauthorized");
      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
      });
      if (!product) throw new Error("Product not found");
      return product;
    }),
});
