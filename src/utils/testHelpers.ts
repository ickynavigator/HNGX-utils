import playwright from 'playwright';

export const getBrowser = async () => {
  const browser = await playwright.firefox.launch();

  return browser;
};

//#region Stage 1
export const getDayOfTheWeek = (day: number) => {
  switch (day) {
    case 0:
      return 'Sunday';
    case 1:
      return 'Monday';
    case 2:
      return 'Tueday';
    case 3:
      return 'Wednesday';
    case 4:
      return 'Thursday';
    case 5:
      return 'Friday';
    default:
      return 'Saturday';
  }
};

export const isNumberInRange = (check: number, num: number, range: number) => {
  // check if number is between +-range
  return check >= num - range && check <= num + range;
};
//#endregion
