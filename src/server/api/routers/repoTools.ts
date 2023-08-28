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
        users: z.array(z.string()),
        token: z.string(),
        permission: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { permission } = input;

        const octokit = new Octokit({ auth: input.token });
        const [owner, repo] = input.selectedRepo.split('/');

        if (owner == undefined || repo == undefined) {
          throw new Error('Invalid repository name');
        }

        const handleCollaboratorAdd = async (username: string) => {
          return await octokit.rest.repos.addCollaborator({
            owner,
            repo,
            username,
            permission,
          });
        };

        await Promise.all(input.users.map(handleCollaboratorAdd));
      } catch (error) {
        console.error(error);

        if (
          error != null &&
          typeof error == 'object' &&
          'message' in error &&
          typeof error.message == 'string'
        ) {
          throw new Error(error.message);
        }

        throw new Error('An unknown error occurred');
      }
    }),
});
