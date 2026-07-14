export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const getPagination = (page: string | number = 1, limit: string | number = 10): PaginationParams => {
  const pageNum = Math.max(1, parseInt(String(page)) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit)) || 10));
  return {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
  };
};

export const getPaginationMeta = (total: number, page: number, limit: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
