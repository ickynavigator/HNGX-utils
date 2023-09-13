export type _Differ = { username: string; email: string }[];
export const differ = (general: _Differ, nextStage: _Differ) => {
  const diffedArr: _Differ = [];

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
      ? `username,email\n${diffedArr
          .map(v => `${v.username.trim()},${v.email.trim()}`)
          .join('\n')}`
      : '';

  return diffed;
};
