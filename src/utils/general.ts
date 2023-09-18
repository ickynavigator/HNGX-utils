import { z } from 'zod';

export async function promiseAllInBatches<T, R = unknown>(
  task: (val: T) => Promise<R>,
  items: T[],
  batchSize = 10,
) {
  let position = 0;
  let results: (R | PromiseSettledResult<Awaited<R>>)[] = [];

  while (position < items.length) {
    const itemsForBatch = items.slice(position, position + batchSize);
    results = [
      ...results,
      ...(await Promise.allSettled(
        itemsForBatch.map(async (item: T) => await task(item)),
      )),
    ];
    position += batchSize;
  }

  return results;
}

export const exportSchema = z.object({
  username: z.string().min(1),
  email: z.string().min(1),
  status: z.string().min(1),
  'has-2fa': z.string(),
  userid: z.string().min(1),
  fullname: z.string().min(1),
  displayname: z.string().min(1).optional(),
  timezone: z.string().min(1),
});
