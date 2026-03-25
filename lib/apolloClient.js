import { ApolloClient, InMemoryCache, HttpLink, gql } from "@apollo/client";

function getEnvOrThrow(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable "${name}". Add it to "my-app/.env.local" (or set it in your runtime).`
    );
  }
  return value;
}

function buildAuthHeader() {
  const token = process.env.WPGRAPHQL_AUTH_TOKEN;
  if (token) return `Bearer ${token}`;

  const basicUser = process.env.WPGRAPHQL_BASIC_USER;
  const basicPassword = process.env.WPGRAPHQL_BASIC_PASSWORD;
  if (basicUser && basicPassword) {
    return "Basic " + Buffer.from(`${basicUser}:${basicPassword}`).toString("base64");
  }

  return null;
}

export function getApolloClient() {
  const uri = getEnvOrThrow("WPGRAPHQL_ENDPOINT");
  const authorization = buildAuthHeader();

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri,
      fetch,
      headers: {
        ...(authorization ? { Authorization: authorization } : {}),
      },
    }),
    // For this demo we always hit WordPress fresh.
    defaultOptions: {
      query: { fetchPolicy: "no-cache", errorPolicy: "all" },
      watchQuery: { fetchPolicy: "no-cache", errorPolicy: "all" },
    },
  });
}

export const WOO_PRODUCTS_QUERY = gql`
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

