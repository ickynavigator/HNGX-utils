import { z } from 'zod';
import { createTRPCRouter, publicProcedure as PP } from '../trpc';

const _graceSchema = z.object({
  username: z.string(),
  friends: z.array(z.string()),
});
const graceSchema = z.object({ users: z.array(_graceSchema) });
const mentionsSchema = z
  .object({
    shouldBeMentioned: z.boolean().optional(),
  })
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
  getNoMentions: PP.input(mentionsSchema).query(async opts => {
    const { input, ctx } = opts;

    const users = await ctx.prisma.general.findMany();
    const grace = await ctx.prisma.savingGrace3.findMany();

    // get people in general that have not been mentioned in one of the friends
    const mentions = users.filter(user => {
      const found = grace.find(submission => {
        return submission.friends.includes(user.username);
      });

      if (input?.shouldBeMentioned) {
        return found !== undefined;
      }

      return found === undefined;
    });

    return mentions;
  }),
});
