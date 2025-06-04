import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getPaginated: protectedProcedure
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
      console.log(user);
      if (user?.role !== "admin") throw new Error("Unauthorized");
      const skip = (input.page - 1) * input.pageSize;
      const [users, totalCount] = await Promise.all([
        ctx.db.user.findMany({
          skip,
          take: input.pageSize,
          include: {
            _count: { select: { orders: true } },
          },
        }),
        ctx.db.user.count(),
      ]);
      return {
        users,
        totalCount,
        totalPages: Math.ceil(totalCount / input.pageSize),
      };
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const admin = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });
      if (admin?.role !== "admin") throw new Error("Unauthorized");
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        include: {
          orders: {
            orderBy: { createdAt: "desc" },
            include: {
              items: { include: { product: true } },
            },
          },
          addresses: true,
        },
      });
      if (!user) throw new Error("User not found");
      return user;
    }),
  updateRole: protectedProcedure
    .input(z.object({ id: z.string().min(1), role: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const admin = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });
      if (admin?.role !== "admin") throw new Error("Unauthorized");
      return ctx.db.user.update({
        where: { id: input.id },
        data: { role: input.role },
      });
    }),
});
