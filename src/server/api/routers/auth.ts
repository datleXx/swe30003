import { z } from "zod";
import bcrypt from "bcryptjs";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

class AuthService {
  constructor(private readonly db: any) {}

  async register(email: string, password: string, name?: string) {
    const existing = await this.db.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Email already in use",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.db.user.create({
      data: {
        email,
        name,
        hashedPassword,
      },
    });

    return { id: user.id, email: user.email };
  }
}

// Create a singleton instance
let authServiceInstance: AuthService | null = null;

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      authServiceInstance ??= new AuthService(ctx.db);
      return authServiceInstance.register(
        input.email,
        input.password,
        input.name,
      );
    }),
});
