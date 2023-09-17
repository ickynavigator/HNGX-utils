import puppeteer, {
  type Browser,
  type PuppeteerLaunchOptions,
} from 'puppeteer';
import { env } from '~/env.mjs';

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

export const linkSanitizer = (link: string) => {
  if (link.includes('http//')) {
    link = link.replace('http//', 'https://');
  }
  if (link.includes('https//')) {
    link = link.replace('https//', 'https://');
  }
  if (!link.includes('http') && !link.includes('https')) {
    link = `http://${link}`;
  }

  return link;
};

export const isNumberInRange = (check: number, num: number, range: number) => {
  // check if number is between +-range
  return check >= num - range && check <= num + range;
};

const UTC_RANGE = 1000000;

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

export async function stage1Grade(
  browser: Browser,
  username: string,
  link: string,
  email: string,
  cb?: CB,
) {
  const PASS_MARK = 6;

  if (!username || !link || !email) {
    // TODO: HANDLE
    return;
  }

  if (await cb?.firstCheck?.({ username, link, email })) {
    return;
  }

  link = linkSanitizer(link);

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

//#region Stage 2
type PaginatedMovies = {
  page: number;
  results: {
    adult: boolean;
    backdrop_path: string;
    genre_ids: number[];
    id: number;
    original_language: string;
    original_title: string;
    overview: string;
    popularity: number;
    poster_path: string;
    release_date: string;
    title: string;
    video: boolean;
    vote_average: number;
    vote_count: number;
  }[];
  total_pages: number;
  total_results: number;
};

type Movie = {
  adult: boolean;
  backdrop_path: string;
  belongs_to_collection: string;
  budget: number;
  genres: {
    id: number;
    name: string;
  }[];
  homepage: string;
  id: number;
  imdb_id: string;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  production_companies: {
    id: number;
    logo_path: string;
    name: string;
    origin_country: string;
  }[];
  production_countries: {
    iso_3166_1: string;
    name: string;
  }[];
  release_date: string;
  revenue: number;
  runtime: number;
  spoken_languages: {
    english_name: string;
    iso_639_1: string;
    name: string;
  }[];
  status: string;
  tagline: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
};

declare global {
  // eslint-disable-next-line no-var
  var paginatedMovies: PaginatedMovies | undefined;
  // eslint-disable-next-line no-var
  var movie: Movie | undefined;
}

export const getRatedMovieDetails = async () => {
  const url =
    'https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=1';
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${env.IMDB_API_KEY}`,
    },
  };

  const res = await fetch(url, options);
  const data = (await res.json()) as PaginatedMovies;

  return data;
};

export const getMovieDetails = async (id: string | number) => {
  const url = `https://api.themoviedb.org/3/movie/${id}?language=en-US`;
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${env.IMDB_API_KEY}`,
    },
  };

  const res = await fetch(url, options);
  const data = (await res.json()) as Movie;

  return data;
};

const paginatedMovies =
  global.paginatedMovies ?? (await getRatedMovieDetails());
const movie =
  global.movie ?? (await getMovieDetails(paginatedMovies.results[0]!.id));

export async function stage2Grade(
  browser: Browser,
  user: Omit<Response, 'grade'>,
  cb?: CB,
) {
  const PASS_MARK = 6;

  if (!user.username || !user.link || !user.email) {
    // TODO: HANDLE
    return;
  }

  try {
    if (await cb?.firstCheck?.(user)) {
      return;
    }
  } catch (error) {
    console.error('first check', user.email, ' - ', user.link);
    if (error != null && typeof error == 'object' && 'message' in error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    await cb?.pending?.(user);

    throw new Error(`Failed to run first check - ${user.username}`);
  }

  user.link = linkSanitizer(user.link);

  const page = await browser.newPage();
  page.setDefaultTimeout(PAGE_TIMEOUT);
  await page.setUserAgent(PAGE_USER_AGENT);

  const { username, link, email } = user;

  try {
    page.on('dialog', dialog => {
      void dialog.accept();
    });
    const url = new URL(link.trim()).toString();

    let navigationPromise = page.waitForNavigation();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await navigationPromise;

    let grade = 0;

    const getElementByTestID = async (selector: string) => {
      return await page.$(`[data-testid="${selector}"]`);
    };

    const getElementsByTestID = async (selector: string) => {
      return await page.$$(`[data-testid="${selector}"]`);
    };
    const getPageLinkElement = async (id: string) => {
      return await page.$(`[href*="/movies/${id}"]`);
    };

    const getElementTextContent = async (selector: string) => {
      return await (
        await getElementByTestID(selector)
      )?.evaluate(el => el.textContent);
    };

    const selectors = {
      movieCard: 'movie-card',
      moviePoster: 'movie-poster',
      movieTitle: 'movie-title',
      movieReleaseDate: 'movie-release-date',
      movieRuntime: 'movie-runtime',
      movieOverview: 'movie-overview',
    };

    const page1Selectors = [
      selectors.movieCard,
      selectors.moviePoster,
      selectors.movieTitle,
      selectors.movieReleaseDate,
    ];
    await page
      .waitForSelector(
        page1Selectors.map(selector => `[data-testid="${selector}"]`).join(','),
        { timeout: 1000 },
      )
      .catch(() => undefined);

    const cards = await getElementsByTestID('movie-card');
    if (cards.length >= 10) {
      grade += 1;
    }

    const posters = await getElementsByTestID('movie-poster');
    if (posters.length >= 10) {
      grade += 1;
    }

    const titles = await getElementsByTestID('movie-title');
    if (titles.length >= 10) {
      grade += 1;
    }
    if (titles.length == 10) {
      grade += 1;
    }

    const firstMovie = paginatedMovies.results[0]!;
    const title = await getElementTextContent('movie-title');
    if (title?.toLowerCase().includes(firstMovie.title.toLowerCase())) {
      grade += 1;
    }

    const release_date = await getElementTextContent('movie-release-date');
    if (release_date) {
      const time = new Date(firstMovie.release_date).getTime();
      const correctTime = new Date(release_date).getTime();
      if (isNumberInRange(time, correctTime, UTC_RANGE)) {
        grade += 1;
      }
    }

    const movieButton = await getPageLinkElement(String(firstMovie.id));
    if (movieButton) {
      navigationPromise = page.waitForNavigation();
      await movieButton.click();
      await navigationPromise;
    } else {
      const movieURL = `${url}/movies/${firstMovie.id}`;
      navigationPromise = page.waitForNavigation();
      await page.goto(movieURL, { waitUntil: 'networkidle2' });
      await navigationPromise;
    }
    grade += 1;

    const page2Selectors = [
      selectors.movieTitle,
      selectors.movieReleaseDate,
      selectors.movieRuntime,
      selectors.movieOverview,
    ];
    await page
      .waitForSelector(
        page2Selectors.map(selector => `[data-testid="${selector}"]`).join(','),
        { timeout: 1000 },
      )
      .catch(() => undefined);

    const movieTitle = await getElementTextContent('movie-title');
    if (movieTitle?.toLowerCase().includes(movie.title.toLowerCase())) {
      grade += 1;
    }

    const movieReleaseDate = await getElementTextContent('movie-release-date');
    if (movieReleaseDate) {
      const time = new Date(movie.release_date).getTime();
      const correctTime = new Date(movieReleaseDate).getTime();
      if (isNumberInRange(time, correctTime, UTC_RANGE)) {
        grade += 1;
      }
    }

    const movieRuntime = await getElementTextContent('movie-runtime');
    if (movieRuntime?.toLowerCase().includes(String(movie.runtime))) {
      grade += 1;
    }

    const movieOverview = await getElementTextContent('movie-overview');
    if (movieOverview?.toLowerCase().includes(movie.overview.toLowerCase())) {
      grade += 1;
    }

    if (grade >= PASS_MARK) {
      await cb?.passed?.({ username, link, email, grade });
    } else {
      await cb?.failed?.({ username, link, email, grade });
    }
  } catch (error) {
    console.error(email, ' - ', link);
    if (error != null && typeof error == 'object' && 'message' in error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    await cb?.pending?.({ username, link, email });

    await page.close();
    throw new Error(`Failed to grade - ${username}`);
  }
  await page.close();
}
//#endregion
