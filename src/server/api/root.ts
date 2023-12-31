import { createTRPCRouter } from '~/server/api/trpc';
import { grace3Router } from './routers/grace3';
import { stage1Router } from './routers/stage1';
import { stage2Router } from './routers/stage2';
import { toolsRouter } from './routers/tools';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  stage1: stage1Router,
  stage2: stage2Router,
  grace3: grace3Router,
  tools: toolsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
