import type { Response, CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = 'refreshToken' as const;

function resolveCookieOptions(): CookieOptions {
  const days = Number(process.env.REFRESH_EXPIRES_DAYS ?? 7);
  const isProd = process.env.NODE_ENV === 'production';

  const envSameSite = process.env.COOKIE_SAMESITE as
    | CookieOptions['sameSite']
    | undefined;

  const sameSite: CookieOptions['sameSite'] =
    envSameSite ?? (isProd ? 'none' : 'none');

  return {
    httpOnly: true,
    sameSite,
    secure: isProd ? true : false,
    path: '/',
    maxAge: days * 24 * 60 * 60 * 1000,
  };
}

export const getRefreshCookieOptions = (): CookieOptions =>
  resolveCookieOptions();

export const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_COOKIE_NAME, token, resolveCookieOptions());
};

export const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(REFRESH_COOKIE_NAME, resolveCookieOptions());
};
