import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const cartRouter = createTRPCRouter({
  // Get the current user's cart with items
  getCart: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Find or create a cart for the user
    let cart = await ctx.db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    cart ??= await ctx.db.cart.create({
      data: {
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return cart;
  }),

  // Add an item to the cart
  addToCart: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        quantity: z.number().min(1).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Find or create a cart for the user
      let cart = await ctx.db.cart.findUnique({
        where: { userId },
      });

      cart ??= await ctx.db.cart.create({
        data: {
          userId,
        },
      });

      // Check if the product already exists in the cart
      const existingItem = await ctx.db.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: input.productId,
          },
        },
      });

      if (existingItem) {
        // Update quantity if item already exists
        return ctx.db.cartItem.update({
          where: {
            id: existingItem.id,
          },
          data: {
            quantity: existingItem.quantity + input.quantity,
          },
          include: {
            product: true,
          },
        });
      } else {
        // Add new item to cart
        return ctx.db.cartItem.create({
          data: {
            cartId: cart.id,
            productId: input.productId,
            quantity: input.quantity,
          },
          include: {
            product: true,
          },
        });
      }
    }),

  // Update cart item quantity
  updateQuantity: protectedProcedure
    .input(
      z.object({
        cartItemId: z.string(),
        quantity: z.number().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cartItem.update({
        where: {
          id: input.cartItemId,
        },
        data: {
          quantity: input.quantity,
        },
        include: {
          product: true,
        },
      });
    }),

  // Remove an item from the cart
  removeFromCart: protectedProcedure
    .input(
      z.object({
        cartItemId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cartItem.delete({
        where: {
          id: input.cartItemId,
        },
      });
    }),

  // Get cart item count
  getItemCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const cart = await ctx.db.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    if (!cart) return 0;

    // Sum up the quantities of all items
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }),
});
