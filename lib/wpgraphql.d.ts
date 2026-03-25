export type WooProduct = {
  id: number;
  slug?: string | null;
  name?: string | null;
  rawPrice?: string | null;
  rawRegularPrice?: string | null;
  rawSalePrice?: string | null;
};

export declare function fetchWooCommerceProducts(params?: {
  first?: number;
  after?: string | null;
}): Promise<{
  products: WooProduct[];
  pageInfo: { hasNextPage: boolean; endCursor?: string | null };
}>;

