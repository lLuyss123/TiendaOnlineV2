import type { CookieOptions } from "express";

import { COOKIE_NAME } from "../config/constants";
import { isProduction } from "../config/env";

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/"
};

export const clearAuthCookieOptions: CookieOptions = {
  ...authCookieOptions,
  maxAge: 0
};

export const authCookieName = COOKIE_NAME;
