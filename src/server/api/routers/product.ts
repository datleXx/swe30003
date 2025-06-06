import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

class ProductService {
  constructor(private readonly db: any) {}

  async getPaginated(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [products, total] = await Promise.all([
      this.db.product.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.db.product.count(),
    ]);

    return {
      products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async create(
    name: string,
    description: string,
    price: number,
    quantity: number,
    brand: string,
    image: string,
    categoryId: string,
    userId: string,
  ) {
    // Only allow admins
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (user?.role !== "admin") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    return this.db.product.create({
      data: {
        name,
        description,
        price,
        quantity,
        brand,
        image,
        categoryId,
      },
    });
  }

  async getCategories() {
    return this.db.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  async update(
    id: string,
    name: string,
    description: string,
    price: number,
    quantity: number,
    brand: string,
    image: string,
    categoryId: string,
    userId: string,
  ) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (user?.role !== "admin") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    return this.db.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        quantity,
        brand,
        image,
        categoryId,
      },
    });
  }

  async delete(id: string, userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (user?.role !== "admin") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    await this.db.product.delete({ where: { id } });
    return { success: true };
  }

  async getById(id: string, userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (user?.role !== "admin") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    const product = await this.db.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Product not found",
      });
    }

    return product;
  }
}

// Create a singleton instance
let productServiceInstance: ProductService | null = null;

export const productRouter = createTRPCRouter({
  getPaginated: publicProcedure
    .input(
      z.object({
        page: z.number().min(1),
        pageSize: z.number().min(1).max(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      productServiceInstance ??= new ProductService(ctx.db);
      return productServiceInstance.getPaginated(input.page, input.pageSize);
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
      productServiceInstance ??= new ProductService(ctx.db);
      return productServiceInstance.create(
        input.name,
        input.description,
        input.price,
        input.quantity,
        input.brand,
        input.image,
        input.categoryId,
        ctx.session.user.id,
      );
    }),

  getCategories: publicProcedure.query(async ({ ctx }) => {
    productServiceInstance ??= new ProductService(ctx.db);
    return productServiceInstance.getCategories();
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
      productServiceInstance ??= new ProductService(ctx.db);
      return productServiceInstance.update(
        input.id,
        input.name,
        input.description,
        input.price,
        input.quantity,
        input.brand,
        input.image,
        input.categoryId,
        ctx.session.user.id,
      );
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      productServiceInstance ??= new ProductService(ctx.db);
      return productServiceInstance.delete(input.id, ctx.session.user.id);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      productServiceInstance ??= new ProductService(ctx.db);
      return productServiceInstance.getById(input.id, ctx.session.user.id);
    }),
});
