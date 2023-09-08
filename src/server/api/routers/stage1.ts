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
              firstCheck: async ({ username }) => {
                const user = await ctx.prisma.stage1User.findUnique({
                  where: { username, grade: { equals: 100 } },
                });

                if (user) return true;
                return false;
              },
              passed: async ({ username, email, grade, link }) => {
                passed.push(`${username}, ${email}, ${grade}`);

                await ctx.prisma.stage1Pending.deleteMany({ where: { email } });

                const failedUser = await ctx.prisma.stage1UserFailed.findUnique(
                  {
                    where: { username },
                  },
                );

                if (failedUser) {
                  await ctx.prisma.stage1UserFailed.delete({
                    where: { username },
                  });
                }

                const user = await ctx.prisma.stage1User.findUnique({
                  where: { username },
                });

                if (user) {
                  await ctx.prisma.stage1User.update({
                    where: { username },
                    data: { username, email, hostedLink: link, grade },
                  });
                } else {
                  await ctx.prisma.stage1User.create({
                    data: { username, email, hostedLink: link, grade },
                  });
                }
              },
              failed: async ({ username, email, grade, link }) => {
                failed.push(`${username},${link},${email},${grade}`);
                const failedUser = await ctx.prisma.stage1UserFailed.findFirst({
                  where: {
                    OR: [{ username }, { email }],
                  },
                });

                if (failedUser) {
                  await ctx.prisma.stage1UserFailed.update({
                    where: { username },
                    data: { username, email, hostedLink: link, grade },
                  });
                } else {
                  await ctx.prisma.stage1UserFailed.create({
                    data: { username, email, hostedLink: link, grade },
                  });
                }
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
  stage1Get: publicProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.stage1User.findMany();
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

      await promiseAllInBatches(async user => {
        const { email, username, hostedLink } = user;
        const userExists = await ctx.prisma.stage1Pending.findUnique({
          where: { email },
        });

        if (userExists) {
          await ctx.prisma.stage1Pending.update({
            where: { email },
            data: { email, username, hostedLink },
          });

          return;
        }

        await ctx.prisma.stage1Pending.create({
          data: { email, username, hostedLink },
        });
      }, users);
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

    const browser = await getBrowser();

    await promiseAllInBatches(
      async item => {
        await stage1Grade(browser, item.username, item.hostedLink, item.email, {
          firstCheck: async ({ username }) => {
            const user = await ctx.prisma.stage1User.findUnique({
              where: { username, grade: { equals: 100 } },
            });

            if (user) return true;
            return false;
          },
          passed: async ({ username, email, grade, link }) => {
            const failedUser = await ctx.prisma.stage1UserFailed.findUnique({
              where: { username },
            });

            if (failedUser) {
              await ctx.prisma.stage1UserFailed.delete({ where: { username } });
            }

            await ctx.prisma.stage1Pending.deleteMany({ where: { email } });

            const user = await ctx.prisma.stage1User.findUnique({
              where: { username },
            });

            if (user) {
              await ctx.prisma.stage1User.update({
                where: { username },
                data: { username, email, hostedLink: link, grade },
              });
            } else {
              await ctx.prisma.stage1User.create({
                data: { username, email, hostedLink: link, grade },
              });
            }
          },
          failed: async ({ username, email, grade, link }) => {
            const failedUser = await ctx.prisma.stage1UserFailed.findFirst({
              where: {
                OR: [{ username }, { email }],
              },
            });

            const passedUser = await ctx.prisma.stage1User.findUnique({
              where: { username },
            });

            if (passedUser) {
              await ctx.prisma.stage1User.delete({ where: { username } });
            }

            if (failedUser) {
              await ctx.prisma.stage1UserFailed.update({
                where: { username },
                data: { username, email, hostedLink: link, grade },
              });
            } else {
              await ctx.prisma.stage1UserFailed.create({
                data: { username, email, hostedLink: link, grade },
              });
            }
          },
        });
      },
      users,
      50,
    );

    await browser.close();
  }),
});
