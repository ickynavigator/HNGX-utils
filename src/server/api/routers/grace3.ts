import { z } from 'zod';
import { createTRPCRouter, publicProcedure as PP } from '../trpc';

const _graceSchema = z.object({
  username: z.string(),
  friends: z.array(z.string()),
});
const graceSchema = z.object({ users: z.array(_graceSchema) });

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
  runSavingGraceSorted: PP.mutation(async ({ ctx }) => {
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

    const sorted: { username: string; count: number }[] = [];
    counterMap.forEach((value, key) => {
      sorted.push({ username: key, count: value });
    });

    await ctx.prisma.savingGrace3Counted.deleteMany();
    await ctx.prisma.savingGrace3Counted.createMany({
      data: sorted,
      skipDuplicates: true,
    });
  }),
  getSavingGraceSorted: PP.query(async ({ ctx }) => {
    return await ctx.prisma.savingGrace3Counted.findMany();
  }),
  deleteSavingGraceSubmissions: PP.mutation(async ({ ctx }) => {
    await ctx.prisma.savingGrace3.deleteMany();
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
