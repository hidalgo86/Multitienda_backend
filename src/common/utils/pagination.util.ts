export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationOutput {
  page: number;
  limit: number;
  skip: number;
}

export function buildPagination(
  pagination?: PaginationInput,
): PaginationOutput {
  const page = pagination?.page ?? 1;
  const defaultLimit = Number(process.env.DEFAULT_PAGE_LIMIT) || 20;
  const maxLimit = Number(process.env.MAX_PAGE_LIMIT) || 100;
  const requestedLimit = pagination?.limit ?? defaultLimit;
  const limit = Math.min(maxLimit, Math.max(1, requestedLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
