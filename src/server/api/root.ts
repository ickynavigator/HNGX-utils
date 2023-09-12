import { createTRPCRouter } from '~/server/api/trpc';
import { stage1Router } from './routers/stage1';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  stage1: stage1Router,
});

// export type definition of API
export type AppRouter = typeof appRouter;
