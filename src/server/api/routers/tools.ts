import { z } from 'zod';
import { differ } from '~/utils/tools';
import { createTRPCRouter, publicProcedure as PP } from '../trpc';

const _diffSchema = z.array(
  z.object({ username: z.string(), email: z.string() }),
);
const diffSchema = z.object({ general: _diffSchema, nextStage: _diffSchema });

export const toolsRouter = createTRPCRouter({
  diff: PP.input(diffSchema).mutation(({ input }) => {
    const { general, nextStage } = input;

    const diffed = differ(general, nextStage);
    return { diffed };
  }),
});
