import { z } from 'zod';
import { createTRPCRouter, publicProcedure as PP } from '../trpc';

const _generalSchema = z.object({ username: z.string() });
const generalSchema = z.object({ users: z.array(_generalSchema) });
const _diffSchema = z.array(
  z.object({ username: z.string(), email: z.string() }),
);
const diffSchema = z.object({ general: _diffSchema, nextStage: _diffSchema });
const _graceSchema = z.object({
  username: z.string(),
  friends: z.array(z.string()),
});
const graceSchema = z.object({ users: z.array(_graceSchema) });

export const querySchema = z
  .object({ query: z.object({ count: z.number().optional() }).optional() })
  .optional();

export const grace3Router = createTRPCRouter({
  uploadSavingGrace: PP.input(graceSchema).mutation(async opts => {
    const {
      input: { users },
      ctx,
    } = opts;

    await ctx.prisma.savingGrace3.createMany({
      data: users,
      skipDuplicates: true,
    });
  }),
  getSavingGraceSubmissions: PP.query(async ({ ctx }) => {
    const submissions = await ctx.prisma.savingGrace3.findMany();
    return submissions;
  }),
  runSavingGraceSorted: PP.query(async ({ ctx }) => {
    const submissions = await ctx.prisma.savingGrace3.findMany();

    const counterMap = new Map<string, number>();

    submissions.forEach(submission => {
      submission.friends.forEach(friend => {
        if (counterMap.has(friend)) {
          counterMap.set(friend, counterMap.get(friend)! + 1);
        } else {
          counterMap.set(friend, 1);
        }
      });
    });

    const sorted: { username: string; counter: number }[] = [];
    counterMap.forEach((value, key) => {
      sorted.push({ username: key, counter: value });
    });

    await ctx.prisma.savingGrace3Counted.deleteMany();
    await ctx.prisma.savingGrace3Counted.createMany({
      data: sorted,
      skipDuplicates: true,
    });
  }),
  getSavingGraceSorted: PP.input(querySchema).query(async ({ ctx, input }) => {
    const query = input?.query;
    return await ctx.prisma.savingGrace3Counted.findMany({ where: query });
  }),
  deleteSavingGraceSubmissions: PP.mutation(async ({ ctx }) => {
    await ctx.prisma.savingGrace3.deleteMany();
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
  getNoMentions: PP.query(async ({ ctx }) => {
    const users = await ctx.prisma.general.findMany();
    const counts = await ctx.prisma.savingGrace3Counted.findMany();

    const noMentions = users.filter(user => {
      const found = counts.find(count => count.username === user.username);
      return !found;
    });

    return noMentions;
  }),
});
