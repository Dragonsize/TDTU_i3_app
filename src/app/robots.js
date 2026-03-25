const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/auth/",
          "/login",
          "/signup",
          "/reset-password",
          "/dashboard",
          "/project",
          "/calendar",
          "/chat",
          "/chatbot",
          "/files",
          "/settings",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
