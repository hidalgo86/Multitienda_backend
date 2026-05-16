export class PaginatedModel<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;

  constructor(partial?: Partial<PaginatedModel<T>>) {
    Object.assign(this, {
      items: [],
      total: 0,
      page: 1,
      totalPages: 1,
      ...partial,
    });
  }
}
