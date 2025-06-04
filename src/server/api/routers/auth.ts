import { z } from "zod";
import bcrypt from "bcryptjs";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

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
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        throw new Error("Email already in use");
      }
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          name: input.name,
          hashedPassword,
        },
      });
      return { id: user.id, email: user.email };
    }),
});
