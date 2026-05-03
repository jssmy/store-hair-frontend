export class PaginatedMeta {
  constructor(
    public total: number,
    public page: number,
    public limit: number,
    public totalPages: number,
  ) {}

  static empty(limit = 10): PaginatedMeta {
    return new PaginatedMeta(0, 1, limit, 0);
  }
}

export class PaginatedResponse<T> {
  constructor(
    public data: T[],
    public meta: PaginatedMeta,
  ) {}
}