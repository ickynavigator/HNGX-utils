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
const PASS_MARK = 30;
const UTC_RANGE = 1000000;

export const stageRouter = createTRPCRouter({
  stage1: publicProcedure
    .input(z.object({ users }))
    .mutation(async ({ input }) => {
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

        if (!link.includes('https://')) {
          // TODO: HANDLE
        }

        const page = await browser.newPage();
        page.setDefaultTimeout(PAGE_TIMEOUT);

        try {
          await page.goto(link.trim());

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
          console.log(slackUserName);
          if (slackUserName === username) {
            console.log('passed username');
            grade += 10;
          }

          const slackImgAlt = await (
            await getElementByTestID('slackDisplayImage')
          )?.evaluate(el => el.getAttribute('alt'));
          if (slackImgAlt === username) {
            console.log('passed image');

            grade += 10;
          }

          const currentDayOfTheWeek = await getElementTextContent(
            'currentDayOfTheWeek',
          );
          if (currentDayOfTheWeek) {
            const day = new Date().getDay();
            if (
              getDayOfTheWeek(day).toLowerCase() ===
              currentDayOfTheWeek.toLowerCase()
            ) {
              console.log('passed day');
              grade += 10;
            }
          }

          const utcTime = await getElementTextContent('currentUTCTime');
          if (utcTime) {
            const time = new Date().getTime();
            if (isNumberInRange(time, Number(utcTime), UTC_RANGE)) {
              console.log('passed utc');
              grade += 10;
            }
          }

          const track = await getElementTextContent('myTrack');
          if (track) {
            const check = track
              .replace(/front(.*)end/gi, 'frontend')
              .toLowerCase()
              .includes('frontend');

            if (check) {
              console.log('passed track');
              grade += 10;
            }
          }

          console.log(username, grade);
          if (grade >= PASS_MARK) {
            passed.push(`${username}, ${email}`);
          } else {
            failed.push(`${username},${link},${email}`);
          }
        } catch (error) {
          pending.push({ username, hostedLink: link, email });
        }

        await page.close();
      }

      await Promise.all(
        users.map(submission =>
          grade(submission.username, submission.hostedLink, submission.email),
        ),
      );
      await browser.close();

      const passedText = passed.join('\n');
      const failedText = failed.join('\n');
      const pendingText = `username,link,email\n ${pending
        .map(
          v => `${v.username.trim()},${v.hostedLink.trim()},${v.email.trim()}`,
        )
        .join('\n')}`;

      return { passed: passedText, failed: failedText, pending: pendingText };
    }),
});
