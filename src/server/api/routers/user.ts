import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

class UserService {
  constructor(private readonly db: any) {}

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
    const [users, totalCount] = await Promise.all([
      this.db.user.findMany({
        skip,
        take: pageSize,
        include: {
          _count: { select: { orders: true } },
        },
      }),
      this.db.user.count(),
    ]);

    return {
      users,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  async getById(id: string, userId: string) {
    const admin = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (admin?.role !== "admin") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    const user = await this.db.user.findUnique({
      where: { id },
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

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }

  async updateRole(id: string, role: string, userId: string) {
    const admin = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (admin?.role !== "admin") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    return this.db.user.update({
      where: { id },
      data: { role },
    });
  }
}

// Create a singleton instance
let userServiceInstance: UserService | null = null;

export const userRouter = createTRPCRouter({
  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1),
        pageSize: z.number().min(1).max(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      userServiceInstance ??= new UserService(ctx.db);
      return userServiceInstance.getPaginated(
        input.page,
        input.pageSize,
        ctx.session.user.id,
      );
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      userServiceInstance ??= new UserService(ctx.db);
      return userServiceInstance.getById(input.id, ctx.session.user.id);
    }),

  updateRole: protectedProcedure
    .input(z.object({ id: z.string().min(1), role: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      userServiceInstance ??= new UserService(ctx.db);
      return userServiceInstance.updateRole(
        input.id,
        input.role,
        ctx.session.user.id,
      );
    }),
});
