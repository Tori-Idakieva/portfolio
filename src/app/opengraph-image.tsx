import { ImageResponse } from "next/og";

// The card shown when the site is shared on LinkedIn, Slack, WhatsApp and similar.
export const alt = "Viktoria Idakieva, software engineer in London";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#14161a",
          color: "#e9e7e2",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, color: "#a3a7ae" }}>SOFTWARE ENGINEER · LONDON</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>Viktoria</div>
          <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: -3, lineHeight: 1, color: "#e07a55" }}>Idakieva</div>
          <div style={{ marginTop: 32, fontSize: 36, color: "#c9c6bf" }}>
            Frontend · Product · Full-stack · Consultant · Cybersecurity
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#a3a7ae" }}>viktoriaidakieva.co.uk</div>
      </div>
    ),
    size,
  );
}
