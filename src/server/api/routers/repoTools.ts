import { Octokit } from '@octokit/rest';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const repoToolsRouter = createTRPCRouter({
  repoFetch: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const octokit = new Octokit({ auth: input.token });

      let repos: string[] = [];
      const URL = 'GET /user/repos';

      for await (const response of octokit.paginate.iterator(URL)) {
        repos = repos.concat(
          response.data.map(r => `${r.owner.login}/${r.name}`),
        );
      }

      return repos;
    }),
  addUsers: publicProcedure
    .input(
      z.object({
        selectedRepo: z.string(),
        users: z.string(),
      }),
    )
    .mutation(({}) => {
      return {};
    }),
});
