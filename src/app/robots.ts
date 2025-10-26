import type { MetadataRoute } from "next";

const baseUrl = "https://anchorlabs.solixdb.xyz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/private/",
    },
    sitemap: baseUrl,
  };
}