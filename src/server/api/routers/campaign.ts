import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { CampaignStatus, CampaignType } from "@prisma/client";

class CampaignService {
  async getPaginated(
    ctx: any,
    page: number,
    pageSize: number,
    search?: string,
  ) {
    const skip = (page - 1) * pageSize;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [campaigns, total] = await Promise.all([
      ctx.db.campaign.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          products: {
            select: {
              id: true,
              name: true,
            },
          },
          categories: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      ctx.db.campaign.count({ where }),
    ]);

    return {
      campaigns,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(ctx: any, id: string) {
    const campaign = await ctx.db.campaign.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campaign not found",
      });
    }

    return campaign;
  }

  async create(ctx: any, data: any) {
    // Check if user is admin
    const user = await ctx.db.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
    });
    if (user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can create campaigns",
      });
    }

    // Validate campaign data based on type
    this.validateCampaignData(data);

    return ctx.db.campaign.create({
      data: {
        ...data,
        createdById: ctx.session.user.id,
      },
    });
  }

  async update(ctx: any, id: string, data: any) {
    // Check if user is admin
    const user = await ctx.db.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
    });
    if (user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can update campaigns",
      });
    }

    // Check if campaign exists
    const campaign = await ctx.db.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campaign not found",
      });
    }

    // Validate campaign data based on type
    this.validateCampaignData(data);

    return ctx.db.campaign.update({
      where: { id },
      data,
    });
  }

  async delete(ctx: any, id: string) {
    // Check if user is admin
    const user = await ctx.db.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
    });
    if (user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can delete campaigns",
      });
    }

    // Check if campaign exists
    const campaign = await ctx.db.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campaign not found",
      });
    }

    return ctx.db.campaign.delete({
      where: { id },
    });
  }

  async updateStatus(ctx: any, id: string, status: CampaignStatus) {
    // Check if user is admin
    const user = await ctx.db.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
    });
    if (user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can update campaign status",
      });
    }

    // Check if campaign exists
    const campaign = await ctx.db.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campaign not found",
      });
    }

    return ctx.db.campaign.update({
      where: { id },
      data: { status },
    });
  }

  async getActiveCampaigns(ctx: any) {
    const now = new Date();
    return ctx.db.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  private validateCampaignData(data: any) {
    switch (data.type) {
      case CampaignType.PERCENTAGE_DISCOUNT:
        if (
          !data.discountValue ||
          data.discountValue <= 0 ||
          data.discountValue > 100
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Percentage discount must be between 0 and 100",
          });
        }
        break;
      case CampaignType.FIXED_AMOUNT_DISCOUNT:
        if (!data.discountValue || data.discountValue <= 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Fixed amount discount must be greater than 0",
          });
        }
        break;
      case CampaignType.BUY_ONE_GET_ONE:
        if (
          !data.buyQuantity ||
          data.buyQuantity <= 0 ||
          !data.getQuantity ||
          data.getQuantity <= 0
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Buy and get quantities must be greater than 0",
          });
        }
        break;
      case CampaignType.FLAT_PRICE:
        if (!data.flatPrice || data.flatPrice <= 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Flat price must be greater than 0",
          });
        }
        break;
    }

    if (
      data.startDate &&
      data.endDate &&
      new Date(data.startDate) >= new Date(data.endDate)
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "End date must be after start date",
      });
    }
  }
}

const campaignService = new CampaignService();

export const campaignRouter = createTRPCRouter({
  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1),
        pageSize: z.number().min(1),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return campaignService.getPaginated(
        ctx,
        input.page,
        input.pageSize,
        input.search,
      );
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return campaignService.getById(ctx, input);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string(),
        type: z.nativeEnum(CampaignType),
        status: z.nativeEnum(CampaignStatus).optional(),
        discountValue: z.number().optional(),
        buyQuantity: z.number().optional(),
        getQuantity: z.number().optional(),
        flatPrice: z.number().optional(),
        startDate: z.date(),
        endDate: z.date(),
        minimumOrderAmount: z.number().optional(),
        maximumDiscountAmount: z.number().optional(),
        productIds: z.array(z.string()).optional(),
        categoryIds: z.array(z.string()).optional(),
        applyToAllProducts: z.boolean().optional(),
        maxUsage: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { productIds, categoryIds, ...data } = input;
      return campaignService.create(ctx, {
        ...data,
        products: productIds
          ? { connect: productIds.map((id) => ({ id })) }
          : undefined,
        categories: categoryIds
          ? { connect: categoryIds.map((id) => ({ id })) }
          : undefined,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        type: z.nativeEnum(CampaignType).optional(),
        status: z.nativeEnum(CampaignStatus).optional(),
        discountValue: z.number().optional(),
        buyQuantity: z.number().optional(),
        getQuantity: z.number().optional(),
        flatPrice: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        minimumOrderAmount: z.number().optional(),
        maximumDiscountAmount: z.number().optional(),
        productIds: z.array(z.string()).optional(),
        categoryIds: z.array(z.string()).optional(),
        applyToAllProducts: z.boolean().optional(),
        maxUsage: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, productIds, categoryIds, ...data } = input;
      return campaignService.update(ctx, id, {
        ...data,
        products: productIds
          ? { set: productIds.map((id) => ({ id })) }
          : undefined,
        categories: categoryIds
          ? { set: categoryIds.map((id) => ({ id })) }
          : undefined,
      });
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return campaignService.delete(ctx, input);
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(CampaignStatus),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return campaignService.updateStatus(ctx, input.id, input.status);
    }),

  getActiveCampaigns: publicProcedure.query(async ({ ctx }) => {
    return campaignService.getActiveCampaigns(ctx);
  }),
});
