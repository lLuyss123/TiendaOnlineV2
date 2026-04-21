import { randomBytes } from "node:crypto";

export const createShortId = (length: number) =>
  randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
