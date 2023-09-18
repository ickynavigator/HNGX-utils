import { z } from 'zod';
import { differ } from '~/utils/tools';
import { createTRPCRouter, publicProcedure as PP } from '../trpc';

const _generalSchema = z.object({ username: z.string() });
const generalSchema = z.object({ users: z.array(_generalSchema) });
const _diffSchema = z.array(
  z.object({ username: z.string(), email: z.string() }),
);
const diffSchema = z.object({ general: _diffSchema, nextStage: _diffSchema });

export const toolsRouter = createTRPCRouter({
  diff: PP.input(diffSchema).mutation(({ input }) => {
    const { general, nextStage } = input;

    const diffed = differ(general, nextStage);
    return { diffed };
  }),
  uploadGeneral: PP.input(generalSchema).mutation(async opts => {
    const {
      input: { users },
      ctx,
    } = opts;

    await ctx.prisma.general.createMany({
      data: users,
      skipDuplicates: true,
    });
  }),
  deleteGeneral: PP.mutation(async ({ ctx }) => {
    await ctx.prisma.general.deleteMany();
  }),
  getGeneral: PP.query(async ({ ctx }) => {
    return await ctx.prisma.general.findMany();
  }),
});
