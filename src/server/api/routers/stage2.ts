import { z } from 'zod';
import { createTRPCRouter, publicProcedure as P } from '~/server/api/trpc';
import { promiseAllInBatches } from '~/utils/general';
import { getBrowser, stage2Grade } from '~/utils/testHelpers';

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

const MAX_SCORE = 10;

export const stage2Router = createTRPCRouter({
  stage: P.input(usersSchema).mutation(async ({ ctx, input }) => {
    const passedArr: string[] = [];
    const failedArr: string[] = [];
    const pendingArr: typeof input.users = [];

    console.debug('start');

    const browser = await getBrowser();

    async function graderCB(item: (typeof input.users)[number]) {
      const user = {
        username: item.username,
        link: item.hostedLink,
        email: item.email,
      };
      await stage2Grade(browser, user, {
        firstCheck: async ({ email }) => {
          const user = await ctx.prisma.stage2User.findFirst({
            where: { email, grade: { equals: MAX_SCORE } },
          });

          if (user != null) {
            await ctx.prisma.stage2Pending.deleteMany({ where: { email } });
            return true;
          }

          return false;
        },
        passed: async ({ username, email, grade, link }) => {
          passedArr.push(`${username},${email},${grade}`);

          await ctx.prisma.stage2Pending.deleteMany({ where: { email } });
          await ctx.prisma.stage2UserFailed.deleteMany({ where: { email } });
          await ctx.prisma.stage2User.upsert({
            where: { email },
            create: { username, email, hostedLink: link, grade },
            update: { username, email, hostedLink: link, grade },
          });
        },
        failed: async ({ username, email, grade, link }) => {
          failedArr.push(`${username},${link},${email},${grade}`);

          await ctx.prisma.stage2User.deleteMany({ where: { email } });
          await ctx.prisma.stage2UserFailed.upsert({
            where: { email },
            create: { username, email, hostedLink: link, grade },
            update: { username, email, hostedLink: link, grade },
          });
        },
        pending: ({ username, email, link }) => {
          pendingArr.push({ username, hostedLink: link, email });
        },
      });
    }
    await promiseAllInBatches(graderCB, input.users, 50);

    await browser.close();

    console.debug('done');

    const passed = passedArr.join('\n');
    const failed = failedArr.join('\n');
    const pending =
      pendingArr.length > 0
        ? `username,link,email\n ${pendingArr
            .map(
              v =>
                `${v.username.trim()},${v.hostedLink.trim()},${v.email.trim()}`,
            )
            .join('\n')}`
        : '';

    return { passed, failed, pending };
  }),
  stageGet: P.input(querySchema).query(async ({ ctx, input }) => {
    const query = input?.query;
    return await ctx.prisma.stage2User.findMany({ where: query });
  }),
  stageGetFailed: P.query(async ({ ctx }) => {
    return await ctx.prisma.stage2UserFailed.findMany();
  }),
  stageDeleteFailed: P.input(usernameSchema).mutation(
    async ({ input, ctx }) => {
      const { username } = input;
      await ctx.prisma.stage1UserFailed.delete({
        where: { username },
      });
    },
  ),
  stageDeleteAllFailed: P.mutation(async ({ ctx }) => {
    await ctx.prisma.stage2UserFailed.deleteMany();
  }),
  stageDeleteAllPassed: P.mutation(async ({ ctx }) => {
    await ctx.prisma.stage2User.deleteMany();
  }),
  stageUpload: P.input(usersSchema).mutation(async opts => {
    const {
      input: { users },
      ctx,
    } = opts;
    await ctx.prisma.stage1Pending.createMany({ data: users });
  }),
  stageGetPending: P.query(async ({ ctx }) => {
    return await ctx.prisma.stage1Pending.findMany();
  }),
  stageDeletePending: P.input(emailSchema).mutation(async ({ input, ctx }) => {
    const { email } = input;
    await ctx.prisma.stage1Pending.deleteMany({ where: { email } });
  }),
  stageDeleteAllPending: P.mutation(async ({ ctx }) => {
    return await ctx.prisma.stage1Pending.deleteMany();
  }),
  stageRunPending: P.mutation(async ({ ctx }) => {
    const users = await ctx.prisma.stage2Pending.findMany();
    console.debug('start');

    const browser = await getBrowser();

    async function graderCB(item: (typeof users)[number]) {
      const user = {
        username: item.username,
        link: item.hostedLink,
        email: item.email,
      };
      await stage2Grade(browser, user, {
        firstCheck: async ({ email }) => {
          const user = await ctx.prisma.stage2User.findFirst({
            where: { email, grade: { equals: MAX_SCORE } },
          });

          if (user != null) {
            await ctx.prisma.stage2Pending.deleteMany({ where: { email } });
            return true;
          }

          return false;
        },
        passed: async ({ username, email, grade, link }) => {
          await ctx.prisma.stage2Pending.deleteMany({ where: { email } });
          await ctx.prisma.stage2UserFailed.deleteMany({ where: { email } });
          await ctx.prisma.stage2User.upsert({
            where: { email },
            create: { username, email, hostedLink: link, grade },
            update: { username, email, hostedLink: link, grade },
          });
        },
        failed: async ({ username, email, grade, link }) => {
          await ctx.prisma.stage2User.deleteMany({ where: { email } });
          await ctx.prisma.stage2UserFailed.upsert({
            where: { email },
            create: { username, email, hostedLink: link, grade },
            update: { username, email, hostedLink: link, grade },
          });
        },
      });
    }
    await promiseAllInBatches(graderCB, users, 50);

    await browser.close();

    console.debug('done');
  }),
  stagePromoteAll: P.input(querySchema).mutation(async ({ ctx }) => {
    await ctx.prisma.stage1User.updateMany({ data: { promoted: true } });
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
