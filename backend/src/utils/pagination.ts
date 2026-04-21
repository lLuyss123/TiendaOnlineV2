import { DEFAULT_PAGE_SIZE } from "../config/constants";

export const getPagination = (query: Record<string, unknown>) => {
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const pageSize = Math.min(48, Math.max(1, Number(query.pageSize ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip, take: pageSize };
};
