import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

class CartService {
  constructor(private readonly db: any) {}

  async getCart(userId: string) {
    // Find or create a cart for the user
    let cart = await this.db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    cart ??= await this.db.cart.create({
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
  }

  async addToCart(productId: string, quantity: number, userId: string) {
    // Find or create a cart for the user
    let cart = await this.db.cart.findUnique({
      where: { userId },
    });

    cart ??= await this.db.cart.create({
      data: {
        userId,
      },
    });

    // Check if the product already exists in the cart
    const existingItem = await this.db.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity if item already exists
      return this.db.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: existingItem.quantity + quantity,
        },
        include: {
          product: true,
        },
      });
    } else {
      // Add new item to cart
      return this.db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
        include: {
          product: true,
        },
      });
    }
  }

  async updateQuantity(cartItemId: string, quantity: number) {
    return this.db.cartItem.update({
      where: {
        id: cartItemId,
      },
      data: {
        quantity,
      },
      include: {
        product: true,
      },
    });
  }

  async removeFromCart(cartItemId: string) {
    return this.db.cartItem.delete({
      where: {
        id: cartItemId,
      },
    });
  }

  async getItemCount(userId: string) {
    const cart = await this.db.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    if (!cart) return 0;

    // Sum up the quantities of all items
    return cart.items.reduce(
      (total: number, item: { quantity: number }) => total + item.quantity,
      0,
    );
  }
}

// Create a singleton instance
let cartServiceInstance: CartService | null = null;

export const cartRouter = createTRPCRouter({
  // Get the current user's cart with items
  getCart: protectedProcedure.query(async ({ ctx }) => {
    cartServiceInstance ??= new CartService(ctx.db);
    return cartServiceInstance.getCart(ctx.session.user.id);
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
      cartServiceInstance ??= new CartService(ctx.db);
      return cartServiceInstance.addToCart(
        input.productId,
        input.quantity,
        ctx.session.user.id,
      );
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
      cartServiceInstance ??= new CartService(ctx.db);
      return cartServiceInstance.updateQuantity(
        input.cartItemId,
        input.quantity,
      );
    }),

  // Remove an item from the cart
  removeFromCart: protectedProcedure
    .input(
      z.object({
        cartItemId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      cartServiceInstance ??= new CartService(ctx.db);
      return cartServiceInstance.removeFromCart(input.cartItemId);
    }),

  // Get cart item count
  getItemCount: protectedProcedure.query(async ({ ctx }) => {
    cartServiceInstance ??= new CartService(ctx.db);
    return cartServiceInstance.getItemCount(ctx.session.user.id);
  }),
});
