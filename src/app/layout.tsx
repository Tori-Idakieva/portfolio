import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter_Tight, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { person } from "@/content/profile";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const display = Inter_Tight({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-mono", display: "swap" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

const title = "Viktoria Idakieva, software engineer in London";
const description =
  "Senior software engineer in London with ten years of frontend and fullstack work, an MSc in Ethical Hacking and Cybersecurity, and recent AI products. Pick a role and see the evidence.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  alternates: { canonical: "/" },
  authors: [{ name: person.name, url: SITE_URL }],
  openGraph: { type: "profile", url: "/", siteName: person.name, title, description, locale: "en_GB" },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

// Structured data so search engines know the page is about a person and link the profiles.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: person.name,
  url: SITE_URL,
  jobTitle: "Software Engineer",
  address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" },
  sameAs: [person.github, person.linkedin].filter(Boolean),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfbf8" },
    { media: "(prefers-color-scheme: dark)", color: "#14161a" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The static preview has no middleware, so it has no nonce.
  const nonce = process.env.NEXT_PUBLIC_PREVIEW === "1" ? undefined : ((await headers()).get("x-nonce") ?? undefined);
  return (
    <html lang="en-GB" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          nonce={nonce}
          // JSON-LD is data, not code; "<" is escaped so the content can't close the tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
        />
        {children}
        {process.env.NEXT_PUBLIC_PREVIEW !== "1" && <Analytics />}
      </body>
    </html>
  );
}
