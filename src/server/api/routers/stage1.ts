import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import { promiseAllInBatches } from '~/utils/general';
import { getBrowser, stage1Grade } from '~/utils/testHelpers';

export const user = z.object({
  username: z.string(),
  hostedLink: z.string(),
  email: z.string(),
});
export const users = z.array(user);
export const query = z
  .object({
    query: z
      .object({
        promoted: z.boolean().optional(),
      })
      .optional(),
  })
  .optional();

export const stage1Router = createTRPCRouter({
  stage1: publicProcedure
    .input(z.object({ users }))
    .mutation(async ({ input, ctx }) => {
      const { users } = input;

      const passed: string[] = [];
      const failed: string[] = [];
      const pending: z.infer<typeof user>[] = [];

      const browser = await getBrowser();

      await promiseAllInBatches(
        async submission => {
          await stage1Grade(
            browser,
            submission.username,
            submission.hostedLink,
            submission.email,
            {
              firstCheck: async ({ email }) => {
                const user = await ctx.prisma.stage1User.findFirst({
                  where: { email, grade: { equals: 10 } },
                });

                if (user != null) {
                  await ctx.prisma.stage1Pending.deleteMany({
                    where: { email },
                  });
                  return true;
                }
                return false;
              },
              passed: async ({ username, email, grade, link }) => {
                passed.push(`${username}, ${email}, ${grade}`);
                await ctx.prisma.stage1Pending.deleteMany({ where: { email } });
                await ctx.prisma.stage1UserFailed.deleteMany({
                  where: { username },
                });
                await ctx.prisma.stage1User.upsert({
                  where: { email },
                  create: { username, email, hostedLink: link, grade },
                  update: { username, email, hostedLink: link, grade },
                });
              },
              failed: async ({ username, email, grade, link }) => {
                failed.push(`${username},${link},${email},${grade}`);

                await ctx.prisma.stage1User.deleteMany({ where: { email } });
                await ctx.prisma.stage1UserFailed.upsert({
                  where: { email },
                  create: { username, email, hostedLink: link, grade },
                  update: { username, email, hostedLink: link, grade },
                });
              },
              pending: ({ username, email, link }) => {
                pending.push({ username, hostedLink: link, email });
              },
            },
          );
        },
        users,
        50,
      );

      await browser.close();

      const passedText = passed.join('\n');
      const failedText = failed.join('\n');
      const pendingText =
        pending.length > 0
          ? `username,link,email\n ${pending
              .map(
                v =>
                  `${v.username.trim()},${v.hostedLink.trim()},${v.email.trim()}`,
              )
              .join('\n')}`
          : '';

      return { passed: passedText, failed: failedText, pending: pendingText };
    }),
  stage1Get: publicProcedure.input(query).query(async ({ ctx, input }) => {
    const users = await ctx.prisma.stage1User.findMany({
      where: { promoted: input?.query?.promoted },
    });
    return users;
  }),
  stage1GetFailed: publicProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.stage1UserFailed.findMany();
    return users;
  }),
  stage1DeleteFailed: publicProcedure
    .input(
      z.object({
        username: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { username } = input;
      await ctx.prisma.stage1UserFailed.delete({
        where: { username },
      });
      return true;
    }),
  stage1DeleteAllFailed: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.stage1UserFailed.deleteMany();
    return true;
  }),
  stage1DeleteAllPassed: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.stage1User.deleteMany();
    return true;
  }),
  stage1Upload: publicProcedure
    .input(z.object({ users }))
    .mutation(async ({ input, ctx }) => {
      const { users } = input;

      await ctx.prisma.stage1Pending.createMany({ data: users });
    }),
  stage1GetPending: publicProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.stage1Pending.findMany();
    return users;
  }),
  stage1DeletePending: publicProcedure.mutation(async ({ ctx }) => {
    const users = await ctx.prisma.stage1Pending.deleteMany();
    return users;
  }),
  stage1RunPending: publicProcedure.mutation(async ({ ctx }) => {
    const users = await ctx.prisma.stage1Pending.findMany();
    console.debug('start');

    const browser = await getBrowser();
    await promiseAllInBatches(
      async item => {
        await stage1Grade(browser, item.username, item.hostedLink, item.email, {
          firstCheck: async ({ email }) => {
            const user = await ctx.prisma.stage1User.findFirst({
              where: { email, grade: { equals: 10 } },
            });

            if (user != null) {
              await ctx.prisma.stage1Pending.deleteMany({
                where: { email },
              });
              return true;
            }

            return false;
          },
          passed: async ({ username, email, grade, link }) => {
            await ctx.prisma.stage1Pending.deleteMany({ where: { email } });
            await ctx.prisma.stage1UserFailed.deleteMany({
              where: { email },
            });
            await ctx.prisma.stage1User.upsert({
              where: { email },
              create: { username, email, hostedLink: link, grade },
              update: { username, email, hostedLink: link, grade },
            });
          },
          failed: async ({ username, email, grade, link }) => {
            await ctx.prisma.stage1User.deleteMany({ where: { email } });
            await ctx.prisma.stage1UserFailed.upsert({
              where: { email },
              create: { username, email, hostedLink: link, grade },
              update: { username, email, hostedLink: link, grade },
            });
          },
        });
      },
      users,
      50,
    );
    await browser.close();

    console.debug('done');
  }),
  stage1PromoteAll: publicProcedure.input(query).mutation(async ({ ctx }) => {
    await ctx.prisma.stage1User.updateMany({
      data: { promoted: true },
    });
  }),
  stage1PromoteSpecific: publicProcedure
    .input(z.object({ emails: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      const { emails } = input;

      await ctx.prisma.stage1User.updateMany({
        where: { email: { in: emails } },
        data: { promoted: true },
      });
    }),
});
