import puppeteer, {
  type Browser,
  type PuppeteerLaunchOptions,
} from 'puppeteer';

const MINIMAL_ARGS = [
  '--autoplay-policy=user-gesture-required',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-domain-reliability',
  '--disable-extensions',
  '--disable-features=AudioServiceOutOfProcess',
  '--disable-hang-monitor',
  '--disable-ipc-flooding-protection',
  '--disable-notifications',
  '--disable-offer-store-unmasked-wallet-cards',
  '--disable-popup-blocking',
  '--disable-print-preview',
  '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding',
  '--disable-setuid-sandbox',
  '--disable-speech-api',
  '--disable-sync',
  '--hide-scrollbars',
  '--ignore-gpu-blacklist',
  '--ignore-certificate-errors',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-default-browser-check',
  '--no-first-run',
  '--no-pings',
  '--no-sandbox',
  '--no-zygote',
  '--password-store=basic',
  '--use-gl=swiftshader',
  '--use-mock-keychain',
  '--shm-size=3gb',
];
const DEFAULT_PROTOCOL_TIMEOUT = 1000 * 120;
const PAGE_TIMEOUT = 1000 * 120;
const PAGE_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36';

export const getBrowser = async (options?: PuppeteerLaunchOptions) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: MINIMAL_ARGS,
    ignoreHTTPSErrors: true,
    protocolTimeout: DEFAULT_PROTOCOL_TIMEOUT,
    ...options,
  });

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
      return 'Tuesday';
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

type Response = {
  username: string;
  link: string;
  email: string;
  grade: number;
};
type CB = {
  passed?: (val: Response) => void | Promise<void>;
  failed?: (val: Response) => void | Promise<void>;
  pending?: (val: Omit<Response, 'grade'>) => void | Promise<void>;
  firstCheck?: (val: Omit<Response, 'grade'>) => boolean | Promise<boolean>;
};
export async function stage1Grade(
  browser: Browser,
  username: string,
  link: string,
  email: string,
  cb?: CB,
) {
  const PASS_MARK = 6;
  const UTC_RANGE = 1000000;

  if (!username || !link || !email) {
    // TODO: HANDLE
    return;
  }

  if (await cb?.firstCheck?.({ username, link, email })) {
    return;
  }

  if (link.includes('http//')) {
    link = link.replace('http//', 'https://');
  }
  if (link.includes('https//')) {
    link = link.replace('https//', 'https://');
  }
  if (!link.includes('http') && !link.includes('https')) {
    link = `http://${link}`;
  }

  const page = await browser.newPage();
  page.setDefaultTimeout(PAGE_TIMEOUT);
  await page.setUserAgent(PAGE_USER_AGENT);

  try {
    page.on('dialog', dialog => {
      void dialog.accept();
    });
    const url = new URL(link.trim()).toString();
    const navigationPromise = page.waitForNavigation();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await navigationPromise;

    let grade = 0;

    const getElementByTestID = async (selector: string) => {
      return await page.$(`[data-testid="${selector}"]`);
    };

    const getElementTextContent = async (selector: string) => {
      return await (
        await getElementByTestID(selector)
      )?.evaluate(el => el.textContent);
    };

    const slackUserName = await getElementTextContent('slackUserName');
    if (slackUserName?.toLowerCase().includes(username.toLowerCase())) {
      grade += 2;
    }

    const slackImgAlt = await (
      await getElementByTestID('slackDisplayImage')
    )?.evaluate(el => el.getAttribute('alt'));
    if (slackImgAlt?.toLowerCase().includes(username.toLowerCase())) {
      grade += 2;
    }

    const currentDay = await getElementTextContent('currentDayOfTheWeek');
    if (currentDay) {
      const day = getDayOfTheWeek(new Date().getUTCDay()).toLowerCase();
      if (currentDay.toLowerCase().includes(day)) {
        grade += 2;
      }
    }

    const utcTime = await getElementTextContent('currentUTCTime');
    if (utcTime) {
      const time = new Date().getTime();
      if (isNumberInRange(time, Number(utcTime), UTC_RANGE)) {
        grade += 2;
      }
    }

    const track = await getElementTextContent('myTrack');
    if (track) {
      const check = track
        .replace(/front(.*)end/gi, 'frontend')
        .toLowerCase()
        .includes('frontend');

      if (check) {
        grade += 2;
      }
    }

    if (grade >= PASS_MARK) {
      await cb?.passed?.({ username, link, email, grade });
    } else {
      await cb?.failed?.({ username, link, email, grade });
    }
  } catch (error) {
    console.error(email, ' - ', link);
    console.error(error);
    await cb?.pending?.({ username, link, email });

    await page.close();
    throw new Error(`Failed to grade - ${username}`);
  }

  await page.close();
}
//#endregion
