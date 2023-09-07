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
