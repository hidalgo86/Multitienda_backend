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
  const limit = pagination?.limit ?? 20;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
