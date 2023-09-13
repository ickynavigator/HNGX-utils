import { z } from 'zod';
import { createTRPCRouter, publicProcedure as P } from '~/server/api/trpc';
import { promiseAllInBatches } from '~/utils/general';
import { getBrowser, stage1Grade } from '~/utils/testHelpers';

export const user = z.object({
  username: z.string(),
  hostedLink: z.string(),
  email: z.string(),
});

export const emailSchema = z.object({ email: z.string() });
export const emailsSchema = z.object({ emails: z.array(z.string()) });
export const usernameSchema = z.object({ username: z.string() });
export const usersSchema = z.object({ users: z.array(user) });

export const querySchema = z
  .object({ query: z.object({ promoted: z.boolean().optional() }).optional() })
  .optional();

export const stage1Router = createTRPCRouter({
  stage: P.input(usersSchema).mutation(async ({ input, ctx }) => {
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
  stageGet: P.input(querySchema).query(async ({ ctx, input }) => {
    const users = await ctx.prisma.stage1User.findMany({
      where: { promoted: input?.query?.promoted },
    });
    return users;
  }),
  stageGetFailed: P.query(async ({ ctx }) => {
    const users = await ctx.prisma.stage1UserFailed.findMany();
    return users;
  }),
  stageDeleteFailed: P.input(usernameSchema).mutation(
    async ({ input, ctx }) => {
      const { username } = input;
      await ctx.prisma.stage1UserFailed.delete({
        where: { username },
      });
      return true;
    },
  ),
  stageDeleteAllFailed: P.mutation(async ({ ctx }) => {
    await ctx.prisma.stage1UserFailed.deleteMany();
    return true;
  }),
  stageDeleteAllPassed: P.mutation(async ({ ctx }) => {
    await ctx.prisma.stage1User.deleteMany();
    return true;
  }),
  stageUpload: P.input(usersSchema).mutation(async ({ input, ctx }) => {
    const { users } = input;

    await ctx.prisma.stage1Pending.createMany({ data: users });
  }),
  stageGetPending: P.query(async ({ ctx }) => {
    const users = await ctx.prisma.stage1Pending.findMany();
    return users;
  }),
  stageDeletePending: P.input(emailSchema).mutation(async ({ input, ctx }) => {
    const { email } = input;

    await ctx.prisma.stage1Pending.deleteMany({ where: { email } });
  }),
  stageDeleteAllPending: P.mutation(async ({ ctx }) => {
    const users = await ctx.prisma.stage1Pending.deleteMany();
    return users;
  }),
  stageRunPending: P.mutation(async ({ ctx }) => {
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
  stagePromoteAll: P.input(querySchema).mutation(async ({ ctx }) => {
    await ctx.prisma.stage1User.updateMany({
      data: { promoted: true },
    });
  }),
  stagePromoteSpecific: P.input(emailsSchema).mutation(
    async ({ input, ctx }) => {
      const { emails } = input;

      await ctx.prisma.stage1User.updateMany({
        where: { email: { in: emails } },
        data: { promoted: true },
      });
    },
  ),
});
