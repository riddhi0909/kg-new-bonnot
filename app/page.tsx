import { getApolloClient, WOO_PRODUCTS_QUERY } from "../lib/apolloClient.js";

function displayPrice(rawPrice?: string | null) {
  // rawPrice (format: RAW) is usually a numeric string without currency.
  if (!rawPrice) return null;
  const n = Number(rawPrice);
  if (Number.isNaN(n)) return rawPrice;
  const formatted = n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return formatted;
}

export default async function Home() {
  let products: Array<{ id: number; slug?: string | null; name?: string | null; rawPrice?: string | null }> = [];
  let error: string | null = null;

  try {
    type GraphQLErrorLike = { message?: string };
    type ApolloErrorLike = { message?: string; graphQLErrors?: GraphQLErrorLike[] };
    type ProductNode = {
      databaseId: number;
      slug?: string | null;
      name?: string | null;
      rawPrice?: string | null;
    };
    type ApolloQueryResultLike = {
      data?: { products?: { nodes?: ProductNode[] } };
      errors?: GraphQLErrorLike[];
      error?: ApolloErrorLike;
    };

    const client = getApolloClient();
    const res = (await client.query({
      query: WOO_PRODUCTS_QUERY,
      variables: { first: 12, after: null },
    })) as ApolloQueryResultLike;

    // Apollo may surface GraphQL problems as `error` (ApolloError) and/or `errors`
    // depending on errorPolicy and client version. Handle both safely.
    const graphQLErrors =
      (Array.isArray(res.errors) ? res.errors : undefined) ?? res.error?.graphQLErrors;
    if (graphQLErrors?.length) {
      throw new Error(graphQLErrors.map((e) => e.message).filter(Boolean).join(" | "));
    }
    if (res.error) {
      throw new Error(res.error.message || "Apollo query error");
    }

    products =
      res.data?.products?.nodes?.map((p) => ({
        id: p.databaseId,
        slug: p.slug ?? null,
        name: p.name ?? null,
        rawPrice: p.rawPrice ?? null,
      })) ?? [];
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <header className="px-6 py-8 border-b bg-white">
        <h1 className="text-2xl font-semibold">WooCommerce Products (WPGraphQL demo)</h1>
        <p className="text-sm text-zinc-600 mt-1">
          Uses `WPGRAPHQL_ENDPOINT` (and optional `WPGRAPHQL_AUTH_TOKEN`) to query products via GraphQL.
        </p>
      </header>

      <main className="px-6 py-8 w-full max-w-5xl mx-auto">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="font-semibold text-red-800">Could not load products</div>
            <div className="text-red-700 text-sm mt-1 break-words">{error}</div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border rounded-lg p-4">No products found (or the query returned none).</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const price = displayPrice(p.rawPrice);

              return (
                <div
                  key={p.id}
                  className="bg-white border rounded-lg p-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="font-semibold text-zinc-900">{p.name ?? `Product #${p.id}`}</div>
                  <div className="text-sm text-zinc-500 mt-1">
                    {p.slug ? `Slug: ${p.slug}` : `ID: ${p.id}`}
                  </div>
                  <div className="mt-3 text-lg font-semibold">
                    {price ? price : "Price not available"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
