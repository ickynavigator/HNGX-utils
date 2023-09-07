import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import {
  getBrowser,
  getDayOfTheWeek,
  isNumberInRange,
} from '~/utils/testHelpers';

const user = z.object({
  username: z.string(),
  hostedLink: z.string(),
  email: z.string(),
});
const users = z.array(user);

const PAGE_TIMEOUT = 1000 * 120;
const PASS_MARK = 60;
const UTC_RANGE = 1000000;

export const stageRouter = createTRPCRouter({
  stage1: publicProcedure
    .input(z.object({ users }))
    .mutation(async ({ input, ctx }) => {
      const { users } = input;

      const passed: string[] = [];
      const failed: string[] = [];
      const pending: z.infer<typeof user>[] = [];

      const browser = await getBrowser();

      async function grade(username: string, link: string, email: string) {
        if (!username || !link || !email) {
          // TODO: HANDLE
          return;
        }

        const user = await ctx.prisma.stage1User.findUnique({
          where: { username, grade: { equals: 100 } },
        });

        if (user) {
          return;
        }

        if (!link.includes('https://')) {
          link = `https://${link}`;
        }

        const page = await browser.newPage();
        page.setDefaultTimeout(PAGE_TIMEOUT);

        try {
          const url = new URL(link.trim()).toString();
          await page.goto(url);

          let grade = 0;

          const getElementByTestID = async (selector: string) => {
            return await page.$(`[data-testid="${selector}"]`);
          };
          const getElementTextContent = async (selector: string) => {
            return await (
              await getElementByTestID(selector)
            )?.evaluate(el => el.textContent);
          };

          const slackUserName = await getElementTextContent('slackUserName');
          if (slackUserName === username) {
            grade += 20;
          }

          const slackImgAlt = await (
            await getElementByTestID('slackDisplayImage')
          )?.evaluate(el => el.getAttribute('alt'));
          if (slackImgAlt === username) {
            grade += 20;
          }

          const currentDayOfTheWeek = await getElementTextContent(
            'currentDayOfTheWeek',
          );
          if (currentDayOfTheWeek) {
            const day = new Date().getUTCDay();
            if (
              getDayOfTheWeek(day).toLowerCase() ===
              currentDayOfTheWeek.toLowerCase()
            ) {
              grade += 20;
            }
          }

          const utcTime = await getElementTextContent('currentUTCTime');
          if (utcTime) {
            const time = new Date().getTime();
            if (isNumberInRange(time, Number(utcTime), UTC_RANGE)) {
              grade += 20;
            }
          }

          const track = await getElementTextContent('myTrack');
          if (track) {
            const check = track
              .replace(/front(.*)end/gi, 'frontend')
              .toLowerCase()
              .includes('frontend');

            if (check) {
              grade += 20;
            }
          }

          if (grade >= PASS_MARK) {
            passed.push(`${username}, ${email}, ${grade}`);

            const failedUser = await ctx.prisma.stage1UserFailed.findUnique({
              where: { username },
            });

            if (failedUser) {
              await ctx.prisma.stage1User.delete({ where: { username } });
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
          } else {
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
          }
        } catch (error) {
          console.error(error);
          pending.push({ username, hostedLink: link, email });

          await page.close();
          throw new Error(`Failed to grade - ${username}`);
        }

        await page.close();
      }

      await Promise.all(
        users.map(
          async submission =>
            await grade(
              submission.username,
              submission.hostedLink,
              submission.email,
            ),
        ),
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
});
