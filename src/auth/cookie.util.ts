import type { Response, CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = 'refreshToken' as const;

function resolveCookieOptions(): CookieOptions {
  const days = Number(process.env.REFRESH_EXPIRES_DAYS ?? 7);
  const isProd = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
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
