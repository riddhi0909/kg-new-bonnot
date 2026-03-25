function getEnvOrThrow(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable "${name}". Add it to "my-app/.env.local" (or set it in your runtime).`
    );
  }
  return value;
}

/**
 * Fetch WooCommerce products via WPGraphQL WooCommerce.
 * Uses:
 * - WPGRAPHQL_ENDPOINT (required)
 * - WPGRAPHQL_AUTH_TOKEN (optional, Bearer)
 * - WPGRAPHQL_BASIC_USER + WPGRAPHQL_BASIC_PASSWORD (optional, Basic)
 */
export async function fetchWooCommerceProducts(params) {
  const endpoint = getEnvOrThrow("WPGRAPHQL_ENDPOINT");

  const token = process.env.WPGRAPHQL_AUTH_TOKEN;
  const basicUser = process.env.WPGRAPHQL_BASIC_USER;
  const basicPassword = process.env.WPGRAPHQL_BASIC_PASSWORD;

  const query = /* GraphQL */ `
    query WooProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        nodes {
          databaseId
          slug
          name
          ... on SimpleProduct {
            rawPrice: price(format: RAW)
            rawRegularPrice: regularPrice(format: RAW)
            rawSalePrice: salePrice(format: RAW)
          }
          ... on VariableProduct {
            rawPrice: price(format: RAW)
            rawRegularPrice: regularPrice(format: RAW)
            rawSalePrice: salePrice(format: RAW)
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const variables = {
    first: params?.first ?? 12,
    after: params?.after ?? null,
  };

  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (basicUser && basicPassword) {
    headers.Authorization =
      "Basic " + Buffer.from(`${basicUser}:${basicPassword}`).toString("base64");
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `WPGraphQL request failed (${res.status}). ${text ? `Response: ${text}` : ""}`.trim()
    );
  }

  const json = await res.json();

  if (json?.errors?.length) {
    throw new Error(
      json.errors.map((e) => e?.message).filter(Boolean).join(" | ") || "GraphQL error"
    );
  }

  const products =
    json?.data?.products?.nodes?.map((p) => ({
      id: p.databaseId,
      slug: p.slug ?? null,
      name: p.name ?? null,
      rawPrice: p.rawPrice ?? null,
      rawRegularPrice: p.rawRegularPrice ?? null,
      rawSalePrice: p.rawSalePrice ?? null,
    })) ?? [];

  const pageInfo = json?.data?.products?.pageInfo ?? { hasNextPage: false, endCursor: null };

  return { products, pageInfo };
}

