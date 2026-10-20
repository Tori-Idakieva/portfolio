import type { NextConfig } from "next";

// Pages get a nonce-based Content Security Policy from src/middleware.ts. Everything else
// (API responses, robots.txt, images) never needs to run scripts, so it gets a deny-all policy.
const lockedDownCsp = "default-src 'none'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/(api/.*|robots.txt|sitemap.xml|opengraph-image.*)",
        headers: [{ key: "Content-Security-Policy", value: lockedDownCsp }],
      },
    ];
  },
};

export default nextConfig;
