import { z } from 'zod';
import { createTRPCRouter, publicProcedure as PP } from '../trpc';

const _diffSchema = z.array(
  z.object({ username: z.string(), email: z.string() }),
);
const diffSchema = z.object({ general: _diffSchema, nextStage: _diffSchema });

export const toolsRouter = createTRPCRouter({
  diff: PP.input(diffSchema).mutation(({ input }) => {
    const { general, nextStage } = input;

    const diffedArr: z.infer<typeof _diffSchema> = [];

    for (const g of general) {
      const found = nextStage.find(n => n.username === g.username);
      if (!found) {
        diffedArr.push(g);
      } else if (found.email !== g.email) {
        diffedArr.push(found);
      }
    }

    const diffed =
      diffedArr.length > 0
        ? `username,email\n ${diffedArr
            .map(v => `${v.username.trim()},${v.email.trim()}`)
            .join('\n')}`
        : '';
    return { diffed };
  }),
});
