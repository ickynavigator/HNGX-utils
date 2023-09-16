import { z } from 'zod';
import { differ } from '~/utils/tools';
import { createTRPCRouter, publicProcedure as PP } from '../trpc';

const _diffSchema = z.array(
  z.object({ username: z.string(), email: z.string() }),
);
const diffSchema = z.object({ general: _diffSchema, nextStage: _diffSchema });
const _graceSchema = z.object({
  username: z.string(),
  friends: z.array(z.string()),
});
const graceSchema = z.object({
  users: z.array(_graceSchema),
});

export const toolsRouter = createTRPCRouter({
  diff: PP.input(diffSchema).mutation(({ input }) => {
    const { general, nextStage } = input;

    const diffed = differ(general, nextStage);
    return { diffed };
  }),
  uploadSavingGrace3: PP.input(graceSchema).mutation(async opts => {
    const {
      input: { users },
      ctx,
    } = opts;

    await ctx.prisma.savingGrace3.createMany({
      data: users,
      skipDuplicates: true,
    });
  }),
  getSavingGrace3Submissions: PP.query(async ({ ctx }) => {
    const submissions = await ctx.prisma.savingGrace3.findMany();
    return submissions;
  }),
  getSavingGrace3Sorted: PP.query(async ({ ctx }) => {
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
    return sorted;
  }),
  deleteSavingGrace3Submissions: PP.mutation(async ({ ctx }) => {
    await ctx.prisma.savingGrace3.deleteMany();
  }),
});
