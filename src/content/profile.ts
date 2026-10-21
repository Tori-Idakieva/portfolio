// Single source of truth for the page and the AI assistant.
// Public facts only: no phone number, home address, salary or references.

export const ROLES = ["all", "frontend", "product", "fullstack", "consultant", "appsec"] as const;
export type Role = (typeof ROLES)[number];
export type FocusRole = Exclude<Role, "all">;

export const ROLE_LABELS: Record<Role, string> = {
  all: "Everything",
  frontend: "Frontend",
  product: "Product Engineer",
  fullstack: "Fullstack",
  consultant: "Consultant",
  appsec: "Cybersecurity",
};

export function parseRole(value: string | string[] | undefined): Role {
  const v = Array.isArray(value) ? value[0] : value;
  return (ROLES as readonly string[]).includes(v ?? "") ? (v as Role) : "all";
}

export const person = {
  name: "Viktoria Idakieva",
  shortName: "Viktoria",
  location: "London, UK",
  headline:
    "Senior software engineer. Ten years building frontend and fullstack software, most recently AI tools, and now training as an ethical hacker.",
  email: "tori.idakieva@gmail.com",
  github: "https://github.com/Tori-Idakieva",
  linkedin: "https://www.linkedin.com/in/viktoria-idakieva-9b2533b9/" as string | null,
  // What Viktoria is doing now, and when Viktoria can start. Written by Viktoria; the AI quotes it.
  status:
    "Since leaving BlackRock in August 2026, Viktoria has been building personal projects, finishing the MSc in Ethical Hacking and Cybersecurity, earning the Claude Certified Developer certification, and looking for the right next role. Viktoria is actively looking and can start as soon as the right position comes up.",
};

export const pitches: Record<Role, string> = {
  all: "Viktoria has spent ten years turning ambiguous requirements into shipped software: a military-grade email client, two award-winning consumer apps, AI tools that cut legal procedures by at least 80%, and an investor-ready hardware PoC. Viktoria is also completing an MSc in Ethical Hacking and Cybersecurity, so security is built in rather than bolted on. Pick a role above to see the experience that matters for it.",
  frontend:
    "Viktoria is a React and TypeScript engineer with a decade of production frontend work. At BlackRock, Viktoria replaced a Power BI app with a custom React and Highcharts reporting interface that improved both visualisation and performance, and closed gaps between Figma and the component library. Earlier work spans an accessible, internationalised email client and two award-winning apps.",
  product:
    "Viktoria works best between users and code. At BlackRock, Viktoria ran user-led development on two AI greenfield products (a POC and an MVP) that streamlined legal procedures by at least 80% in internal testing. As a part-time technical lead consultant for Vynrr, Viktoria took a founder's concept to a working PoC that raised investor interest and the company's valuation.",
  fullstack:
    "Viktoria owns features end to end: planning, API design with backend teams, frontend, test automation and CI/CD. At Isode, Viktoria built and maintained automated testing systems from server config generation to CI, improving reliability and maintenance efficiency by 50%. In part-time consulting for Vynrr, Viktoria defined the API and hardware requirements behind a working PoC.",
  consultant:
    "Viktoria is used to joining a client's team, learning the domain quickly and delivering. At ANDigital, a digital consultancy, Viktoria worked on client teams to ship two award-winning apps, OneViu and Wagamama Soul Club, acted as security champion, and ran upskilling courses. As a part-time technical lead consultant for Vynrr, Viktoria worked directly with founders to turn a concept into an investor-ready PoC. At BlackRock, Viktoria shaped two AI products through user-led development with legal teams.",
  appsec:
    "Viktoria brings developer depth to security. At BlackRock, Viktoria triaged and resolved flagged vulnerabilities, set up SonarQube security scanning across multiple projects, and placed 10th out of hundreds of teams in the internal CTF. At ANDigital, Viktoria was security champion for internal and client teams and set up SonarQube and Snyk in CI. Viktoria holds CompTIA Security+, and is completing an MSc in Ethical Hacking and Cybersecurity, including automating a pentest methodology with Python and Playwright.",
};

export type EvidenceKind = "work" | "code" | "study" | "cert";

export type Evidence = {
  id: string;
  kind: EvidenceKind;
  title: string;
  // One line shown in the list; the full summary opens on click.
  short: string;
  org: string;
  period: string;
  summary: string;
  stack?: string[];
  link?: string;
  // Public pages about the work, shown as "Read more" links.
  sources?: { label: string; href: string }[];
  // Screenshot in /public/work, with credit to its owner.
  image?: { src: string; alt: string; credit: string };
  // 0 to 3: how strongly this item supports each role.
  weight: Record<FocusRole, number>;
  // What this item proves, per role, when it is relevant.
  why?: Partial<Record<FocusRole, string>>;
};

export const evidence: Evidence[] = [
  {
    id: "blk-ai-greenfield",
    kind: "work",
    title: "Two AI products for legal workflows",
    short: "Took two AI products for legal teams from idea to MVP. User testing showed procedures at least 80% faster.",
    org: "BlackRock",
    period: "2024 to 2026",
    summary:
      "Delivered two AI-based greenfield projects, a POC and an MVP, through user-led development. Internal user testing showed legal procedures streamlined by at least 80%.",
    stack: ["React", "TypeScript", "Python"],
    weight: { frontend: 2, product: 3, fullstack: 2, consultant: 2, appsec: 1 },
    why: {
      consultant: "Ran discovery with non-technical stakeholders.",
      product: "Found the workflow pain with users and proved the outcome with numbers.",
      fullstack: "Owned both products from planning to deployment.",
      frontend: "Built the interfaces people used to work with the AI.",
    },
  },
  {
    id: "blk-powerbi-react",
    kind: "work",
    title: "From Power BI to a custom React reporting UI",
    short: "Replaced a Power BI app with a faster, more flexible React and Highcharts reporting UI, including the Python endpoints behind it.",
    org: "BlackRock",
    period: "2024 to 2026",
    summary:
      "Migrated a Power BI application to React to remove custom reporting limits, delivering a charting interface that improved data visualisation and overall performance. Edited the Python endpoints that feed it, and investigated the underlying Snowflake data to make sure each endpoint returned the correct information.",
    stack: ["React", "TypeScript", "Highcharts", "Python", "Snowflake"],
    weight: { frontend: 3, product: 2, fullstack: 2, consultant: 1, appsec: 0 },
    why: {
      frontend: "Data-heavy UI, charting and performance work in production.",
      product: "Chose to rebuild because the tool limited what users needed.",
      fullstack: "Worked from the UI down to the Python endpoints and the Snowflake data.",
    },
  },
  {
    id: "blk-vuln-triage",
    kind: "work",
    title: "Vulnerability triage and resolution",
    short: "Triages and fixes flagged vulnerabilities across the team's applications.",
    org: "BlackRock",
    period: "2024 to 2026",
    summary:
      "Triaged and resolved flagged vulnerabilities across owned applications, and used AI-accelerated workflows for planning, documentation and PR review.",
    weight: { frontend: 1, product: 0, fullstack: 1, consultant: 0, appsec: 3 },
    why: { appsec: "Day-to-day remediation of real findings in a regulated enterprise." },
  },
  {
    id: "blk-security-scanning",
    kind: "work",
    title: "Security scanning across multiple projects",
    short: "Set up SonarQube on the CI pipelines of multiple projects.",
    org: "BlackRock",
    period: "2024 to 2026",
    summary:
      "Set up SonarQube static analysis on the CI pipelines of multiple projects, so code quality and security checks run on every build.",
    stack: ["SonarQube", "CI/CD"],
    weight: { frontend: 1, product: 0, fullstack: 2, consultant: 1, appsec: 3 },
    why: {
      appsec: "Shifted security left across several codebases, not just one.",
      fullstack: "Owns the delivery pipeline as well as the code.",
    },
  },
  {
    id: "blk-ctf",
    kind: "work",
    title: "10th place in BlackRock's internal CTF",
    short: "Placed 10th out of hundreds of teams in the internal capture the flag.",
    org: "BlackRock",
    period: "2024 to 2026",
    summary: "Competed in BlackRock's internal capture the flag competition and placed 10th out of hundreds of teams.",
    weight: { frontend: 0, product: 0, fullstack: 1, consultant: 0, appsec: 3 },
    why: { appsec: "Hands-on offensive skills tested against hundreds of teams." },
  },
  {
    id: "blk-design-system",
    kind: "work",
    title: "Closing the gap between Figma and the component library",
    short: "Fixed gaps between Figma, Storybook and the component library with the design system owners.",
    org: "BlackRock",
    period: "2024 to 2026",
    summary:
      "Spotted mismatches between Figma designs and the component library and worked with the design system owners to fix them, unblocking the team and keeping delivery on schedule. Compared components in Storybook against the designs, updated the Storybook examples and improved the component library code.",
    stack: ["Figma", "Storybook", "Design systems"],
    weight: { frontend: 3, product: 2, fullstack: 0, consultant: 1, appsec: 0 },
    why: { frontend: "Cares about the seam between design and code." },
  },
  {
    id: "blk-hackathon",
    kind: "work",
    title: "Regional internal hackathon",
    short: "Organised the regional hackathon and doubled entries on the year before.",
    org: "BlackRock",
    period: "2024 to 2026",
    summary:
      "Organised an internal hackathon with directors and VPs, doubling the region's entries from the previous year.",
    weight: { frontend: 0, product: 2, fullstack: 1, consultant: 1, appsec: 0 },
    why: { product: "Rallies people around new ideas, not only code." },
  },
  {
    id: "and-awards",
    kind: "work",
    title: "Two award-winning apps: OneViu and Wagamama Soul Club",
    short: "Built OneViu and Wagamama Soul Club, both of which won industry awards.",
    org: "ANDigital",
    period: "2022 to 2024",
    summary:
      "Delivered OneViu (HKB Technology Excellence Award for Retail app) and Wagamama Soul Club (MCA Hospitality Award), and created the training that onboarded three teams to Soul Club.",
    stack: ["React Native", "TypeScript", "React", "DatoCMS"],
    sources: [{ label: "AND Digital case study: Wagamama Soul Club", href: "https://and.digital/our-work/wagamama-soul-club" }],
    weight: { frontend: 3, product: 3, fullstack: 2, consultant: 3, appsec: 0 },
    why: {
      consultant: "Delivered award-winning work for two different clients.",
      frontend: "Consumer apps judged good enough to win industry awards.",
      product: "Shipped for real clients with real customers.",
    },
  },
  {
    id: "and-security-champion",
    kind: "work",
    title: "Security champion",
    short: "Security champion for internal and client teams.",
    org: "ANDigital",
    period: "2022 to 2024",
    summary:
      "Acted as security champion for internal and client teams while working across legacy migrations and greenfield builds.",
    weight: { frontend: 0, product: 0, fullstack: 1, consultant: 2, appsec: 3 },
    why: { consultant: "Raised the security bar inside client teams.", appsec: "Brought secure practices into internal and client delivery teams." },
  },
  {
    id: "and-security-scanning",
    kind: "work",
    title: "Security scanning in CI pipelines",
    short: "Set up SonarQube on CI pipelines and used Snyk for dependency scanning.",
    org: "ANDigital",
    period: "2022 to 2024",
    summary:
      "Set up SonarQube static analysis on CI pipelines and used Snyk to scan dependencies, so security checks ran as part of every build.",
    stack: ["SonarQube", "Snyk", "CI/CD"],
    weight: { frontend: 1, product: 0, fullstack: 2, consultant: 2, appsec: 3 },
    why: {
      consultant: "Set up the same safeguards on consultancy projects.",
      appsec: "Wired code and dependency scanning into the delivery pipeline.",
    },
  },
  {
    id: "and-upskilling",
    kind: "work",
    title: "Upskilling courses for colleagues",
    short: "Created an internal React Native course and regular cybersecurity material to upskill colleagues.",
    org: "ANDigital",
    period: "2022 to 2024",
    summary:
      "Created an internal upskilling course for React Native, and consistently produced cybersecurity material to educate colleagues and raise security awareness across teams.",
    stack: ["React Native"],
    weight: { frontend: 2, product: 1, fullstack: 1, consultant: 2, appsec: 2 },
    why: {
      consultant: "Leaves teams more capable than they were.",
      frontend: "Knows React Native well enough to teach it.",
      appsec: "Builds security awareness in others, not only in their own code.",
    },
  },
  {
    id: "and-leadership",
    kind: "work",
    title: "Technical guild, Toastmasters and mentoring",
    short: "Led the technical guild and Toastmasters, and mentored junior developers.",
    org: "ANDigital",
    period: "2022 to 2024",
    summary:
      "Led the technical guild initiative and Toastmasters sessions, and coached junior developers until they could deliver code reliably.",
    weight: { frontend: 1, product: 2, fullstack: 1, consultant: 2, appsec: 0 },
    why: { consultant: "Mentors and leads, which matters on client teams.", product: "Communicates clearly and grows the people around them." },
  },
  {
    id: "isode-email-client",
    kind: "work",
    title: "Frontend for Harrier, a military-grade email client",
    short: "Built core frontend features, including S/MIME, compose and release, for Harrier, a military messaging client.",
    org: "Isode",
    period: "2016 to 2022",
    summary:
      "Delivered frontend features for Isode's Harrier web client, used for formal military messaging with S/MIME, security labels and role-based mailboxes: Draft and Release, Compose, S/MIME, email profiling and forwarding. Defined API needs with the backend team and worked on accessibility and i18n.",
    stack: ["React", "JavaScript", "S/MIME", "i18n", "WCAG"],
    sources: [{ label: "Isode: Harrier user messaging", href: "https://www.isode.com/user-messaging/" }],
    weight: { frontend: 3, product: 1, fullstack: 2, consultant: 0, appsec: 2 },
    why: {
      frontend: "Six years of complex, accessible UI for demanding users.",
      appsec: "Secure messaging features where mistakes matter.",
      fullstack: "Shaped API contracts together with backend engineers.",
    },
  },
  {
    id: "isode-test-automation",
    kind: "work",
    title: "Test automation and CI/CD",
    short: "Rebuilt test automation and CI, making them 50% more reliable and easier to maintain.",
    org: "Isode",
    period: "2016 to 2022",
    summary:
      "Delivered, migrated and maintained automated testing systems, from server config generation to CI/CD integration, improving reliability and maintenance efficiency by 50%.",
    stack: ["Python", "Bash", "Perl", "Robot Framework", "Selenium"],
    weight: { frontend: 2, product: 0, fullstack: 3, consultant: 0, appsec: 1 },
    why: {
      fullstack: "Owns the whole path to production, not only the UI.",
      frontend: "End-to-end testing of a complex web client.",
    },
  },
  {
    id: "vynrr-poc",
    kind: "work",
    title: "Technical lead for an investor-ready PoC",
    short: "Part-time consulting: took a founder's idea to a working PoC that raised investor interest and the company's valuation.",
    org: "Vynrr",
    period: "2024 to 2025, part-time consulting",
    summary:
      "Part-time consulting alongside full-time roles. Worked directly with founders from concept to delivery: API and hardware requirements, a Figma prototype with a design team, and a working PoC whose investor demo raised interest and the company's valuation.",
    stack: ["React Native", "Figma"],
    weight: { frontend: 1, product: 3, fullstack: 2, consultant: 3, appsec: 0 },
    why: {
      consultant: "Advised founders directly and turned their idea into something investors could see.",
      product: "Took a founder's idea to something investors could see working.",
      fullstack: "Made the technical calls across app, API and hardware.",
    },
  },
  {
    id: "repo-portfolio",
    kind: "code",
    title: "portfolio",
    short: "This site: Next.js and React, with a Claude assistant locked down against abuse.",
    org: "GitHub",
    period: "2026",
    summary:
      "The source of this site. Next.js 15, React 19 and TypeScript, with a Claude assistant that answers only from the CV, behind origin checks, rate limits, a daily token budget and a strict Content Security Policy.",
    stack: ["TypeScript", "React", "Next.js", "Claude API"],
    link: "https://github.com/Tori-Idakieva/portfolio",
    weight: { frontend: 3, product: 2, fullstack: 3, consultant: 1, appsec: 2 },
    why: {
      frontend: "Shows current frontend craft: interaction, accessibility and theming.",
      fullstack: "A server route, streaming, validation and rate limiting end to end.",
      appsec: "Security headers, input sanitising and cost controls on an AI endpoint.",
    },
  },
  {
    id: "repo-methodology-automation",
    kind: "code",
    title: "methodology-automation",
    short: "Python and Playwright scripts that automate a penetration testing methodology.",
    org: "GitHub",
    period: "2026, MSc coursework",
    summary: "Automates a penetration testing methodology with Python scripts and Playwright.",
    stack: ["Python", "Playwright"],
    link: "https://github.com/Tori-Idakieva/methodology-automation",
    weight: { frontend: 0, product: 0, fullstack: 1, consultant: 0, appsec: 3 },
    why: { appsec: "Applies engineering habits to offensive security work." },
  },
  {
    id: "repo-colorperception",
    kind: "code",
    title: "ColorPerception",
    short: "BSc dissertation on colour perception, built in JavaScript.",
    org: "GitHub",
    period: "2018, BSc dissertation",
    summary: "Dissertation project on colour perception, built in JavaScript.",
    stack: ["JavaScript"],
    link: "https://github.com/Tori-Idakieva/ColorPerception",
    weight: { frontend: 1, product: 0, fullstack: 0, consultant: 0, appsec: 0 },
    why: { frontend: "An early interest in how people see interfaces." },
  },
  {
    id: "study-msc",
    kind: "study",
    title: "MSc Ethical Hacking and Cybersecurity",
    short: "Master's in Ethical Hacking and Cybersecurity, studied part-time outside work hours.",
    org: "Abertay University",
    period: "2025 to present, part-time",
    summary: "A part-time Master's taken outside work hours, alongside a full-time engineering role. It covers penetration testing, vulnerability assessment, secure web engineering, security scripting and malware analysis. Coursework includes methodology-automation, which automates a penetration testing methodology with Python and Playwright.",
    weight: { frontend: 0, product: 0, fullstack: 1, consultant: 0, appsec: 3 },
    why: { appsec: "Formal offensive security training on top of ten years of building." },
  },
  {
    id: "study-security-plus",
    kind: "cert",
    title: "CompTIA Security+",
    short: "Vendor-neutral security certification, first earned in July 2021 and renewed in 2026. Valid until 31 July 2029.",
    org: "CompTIA",
    period: "July 2021, renewed 2026",
    summary: "CompTIA Security+ is a vendor-neutral certification covering threats, vulnerabilities and mitigations, security architecture, security operations and incident response, and governance, risk and compliance. Viktoria first earned it in July 2021 while working on secure messaging at Isode, and renewed it in 2026. It is valid until 31 July 2029.",
    weight: { frontend: 0, product: 0, fullstack: 0, consultant: 0, appsec: 2 },
  },
  {
    id: "study-ccdv-f",
    kind: "cert",
    title: "Claude Certified Developer, Foundations",
    short: "Anthropic's proctored exam for building applications and agents on Claude. Passed in October 2026.",
    org: "Anthropic",
    period: "October 2026",
    summary:
      "Anthropic's Claude Certified Developer, Foundations (CCDV-F) credential covers building and shipping production applications and agents on Claude: Claude API integration, agents and workflows, prompt and context engineering, tools and MCP servers, model selection and cost, security and safety, and evaluation and debugging. Viktoria passed it on 18 October 2026.",
    stack: ["Claude", "Prompt engineering", "Agents and MCP"],
    weight: { frontend: 1, product: 2, fullstack: 2, consultant: 1, appsec: 1 },
    why: {
      product: "Formal grounding for the AI products Viktoria has already shipped.",
      fullstack: "Covers the API, tool and agent plumbing behind AI features.",
      appsec: "Includes prompt injection, guardrails and least privilege for AI systems.",
    },
  },
  {
    id: "study-bsc",
    kind: "study",
    title: "BSc Computer Science with a Year in Industry (2:1)",
    short: "Computer Science with a Year in Industry, graduating with a 2:1, and a dissertation on colour perception.",
    org: "Cardiff University",
    period: "2014 to 2018",
    summary: "BSc Computer Science with a Year in Industry at Cardiff University, graduating with a 2:1 in 2018. The final-year dissertation, ColorPerception, explored how people perceive colour and was built in JavaScript.",
    weight: { frontend: 1, product: 1, fullstack: 1, consultant: 0, appsec: 1 },
  },
];

// Where each tool was used, newest employer first. "MSc" is the Abertay degree.
export type Skill = { name: string; at: string[] };
const EVERY_ROLE = ["BlackRock", "ANDigital", "Vynrr", "Isode"];
export const skills: Record<"stack" | "practice" | "security" | "ai", Skill[]> = {
  stack: [
    { name: "React", at: ["BlackRock", "ANDigital", "Isode"] },
    { name: "TypeScript", at: ["BlackRock", "ANDigital"] },
    { name: "JavaScript", at: ["Isode"] },
    { name: "HTML/CSS", at: EVERY_ROLE },
    { name: "Python", at: ["BlackRock", "ANDigital", "Isode", "MSc"] },
    { name: "React Native", at: ["BlackRock", "ANDigital", "Vynrr"] },
    { name: "GraphQL", at: ["BlackRock"] },
    { name: "REST", at: ["BlackRock", "ANDigital"] },
    { name: "WebSockets", at: ["Isode"] },
    { name: "D3.js", at: ["BlackRock", "ANDigital"] },
    { name: "Highcharts", at: ["BlackRock", "ANDigital"] },
    { name: "Snowflake", at: ["BlackRock"] },
    { name: "DatoCMS", at: ["ANDigital"] },
  ],
  practice: [
    { name: "Docker", at: ["BlackRock", "ANDigital", "Isode"] },
    { name: "CI/CD", at: ["BlackRock", "ANDigital", "Isode"] },
    { name: "Jest", at: ["BlackRock", "ANDigital"] },
    { name: "Playwright", at: ["BlackRock", "ANDigital"] },
    { name: "Cypress", at: ["Isode"] },
    { name: "Robot Framework", at: ["Isode"] },
    { name: "WCAG accessibility", at: ["ANDigital", "Isode"] },
    { name: "Figma", at: ["BlackRock", "Vynrr"] },
    { name: "Storybook", at: ["BlackRock"] },
  ],
  security: [
    { name: "Vulnerability triage", at: ["BlackRock"] },
    { name: "Vulnerability assessment", at: ["BlackRock", "ANDigital"] },
    { name: "SonarQube", at: ["BlackRock", "ANDigital"] },
    { name: "Snyk", at: ["ANDigital"] },
    { name: "OWASP-aligned development", at: ["ANDigital", "Isode"] },
    { name: "Penetration testing", at: ["MSc"] },
    { name: "Security scripting", at: ["MSc"] },
    { name: "Malware analysis", at: ["MSc"] },
  ],
  ai: [
    { name: "Windsurf", at: ["BlackRock"] },
    { name: "Copilot", at: ["BlackRock", "ANDigital"] },
    { name: "Figma Make", at: ["BlackRock"] },
    { name: "Claude", at: ["CCDV-F"] },
    { name: "Prompt engineering", at: ["CCDV-F"] },
    { name: "Agents and MCP", at: ["CCDV-F"] },
  ],
};

// Certifications shown with their badges. `adds` maps what each exam covers to where Viktoria already uses it.
export const certifications: {
  id: string;
  name: string;
  issuer: string;
  badge: "security-plus" | "claude-developer";
  status: string;
  summary: string;
  adds: { skill: string; detail: string; evidence?: string }[];
  link: string;
}[] = [
  {
    id: "study-security-plus",
    name: "CompTIA Security+",
    issuer: "CompTIA",
    badge: "security-plus",
    status: "Earned July 2021 · Renewed 2026 · Valid until 31 July 2029",
    summary:
      "A widely recognised baseline for security work, covering five areas: general security concepts, threats and mitigations, security architecture, security operations, and governance, risk and compliance. Renewed in 2026, so it stays current until 2029.",
    adds: [
      { skill: "Vulnerability management", detail: "Finding, prioritising and fixing weaknesses, as Viktoria did triaging flagged vulnerabilities at BlackRock.", evidence: "blk-vuln-triage" },
      { skill: "Security operations and automation", detail: "Monitoring and automated checks, in practice the SonarQube scanning Viktoria set up in CI at BlackRock and ANDigital, plus Snyk at ANDigital.", evidence: "blk-security-scanning" },
      { skill: "Threats and secure design", detail: "Common attacks and how to design them out, the basis of Viktoria's OWASP-aligned frontend work.", evidence: "isode-email-client" },
      { skill: "Governance and risk", detail: "Policies, compliance and risk thinking that fit regulated settings such as BlackRock." },
    ],
    link: "https://www.comptia.org/certifications/security",
  },
  {
    id: "study-ccdv-f",
    name: "Claude Certified Developer, Foundations",
    issuer: "Anthropic",
    badge: "claude-developer",
    status: "Passed 18 October 2026 · Proctored exam",
    summary:
      "Anthropic's developer certification for building, integrating and shipping production applications and agents on Claude. It tests practical decisions across the Claude API, Claude Code, custom tools and MCP servers.",
    adds: [
      { skill: "Claude API integration", detail: "Messages, tool use, streaming, prompt caching and batching. The assistant on this site runs on the Claude API." },
      { skill: "Agents and MCP", detail: "Tool-use loops, subagents, hooks and building MCP servers to connect models to real systems." },
      { skill: "Prompt and context engineering", detail: "Structured output, few-shot examples and managing context, applied to grounded answers like this site's assistant." },
      { skill: "Model choice and cost", detail: "Picking the right model and controlling tokens and spend in production." },
      { skill: "AI security", detail: "Prompt injection, PII handling, guardrails and least privilege, where it meets Viktoria's security background.", evidence: "study-msc" },
    ],
    link: "https://www.credly.com/org/anthropic/badge/claude-certified-developer-foundations",
  },
];

export function orderedEvidence(role: Role): Evidence[] {
  if (role === "all") return evidence;
  return [...evidence]
    .map((e, i) => ({ e, i }))
    .sort((a, b) => b.e.weight[role] - a.e.weight[role] || a.i - b.i)
    .map(({ e }) => e);
}

export const evidenceById = new Map(evidence.map((e) => [e.id, e]));

// Career timeline. `match` is the text an evidence item's org must contain.
export const timeline: { org: string; match: string; label: string; from: number; to: number; lane: "work" | "side" | "study"; dates: string; highlights: string[] }[] = [
  { org: "Cardiff University", match: "Cardiff", label: "BSc Computer Science with a Year in Industry", from: 2014, to: 2018, lane: "study", dates: "2014 to 2018", highlights: ["Computer Science with a Year in Industry, 2:1", "Dissertation on how people perceive colour"] },
  { org: "Isode", match: "Isode", label: "Software Engineer", from: 2016, to: 2022, lane: "work", dates: "2016 to 2022", highlights: ["Frontend for Harrier, a military-grade email client", "S/MIME, accessibility and internationalisation", "Test automation made 50% more reliable"] },
  { org: "ANDigital", match: "ANDigital", label: "Product Developer", from: 2022.4, to: 2024.95, lane: "work", dates: "May 2022 to Dec 2024", highlights: ["Two award-winning client apps", "Security champion for internal and client teams", "Ran React Native and security upskilling"] },
  { org: "Vynrr", match: "Vynrr", label: "Part-time consulting, side work", from: 2024.4, to: 2025.95, lane: "side", dates: "May 2024 to Dec 2025", highlights: ["Part-time, alongside full-time roles", "Took a founder's idea to an investor-ready PoC"] },
  { org: "BlackRock", match: "BlackRock", label: "Associate Application Engineer", from: 2024.95, to: 2026.65, lane: "work", dates: "Dec 2024 to Aug 2026", highlights: ["Two AI products built with legal teams", "Power BI replaced with a custom React UI", "10th of hundreds in the internal CTF"] },
  { org: "Abertay", match: "Abertay", label: "MSc Ethical Hacking and Cybersecurity", from: 2025.7, to: 2026.8, lane: "study", dates: "2025 to present", highlights: ["Part-time, outside work hours", "Pentesting, secure web engineering, malware analysis"] },
];

// Headline numbers, each backed by an evidence item.
export const stats: { value: number; prefix?: string; suffix: string; label: string; evidence: string; roles: FocusRole[] }[] = [
  { value: 10, suffix: " yrs", label: "building production software", evidence: "isode-email-client", roles: ["fullstack"] },
  { value: 6, suffix: " yrs", label: "on Harrier, a military-grade secure email client", evidence: "isode-email-client", roles: ["frontend", "appsec"] },
  { value: 2, suffix: "", label: "award-winning client apps delivered at ANDigital: OneViu and Wagamama Soul Club", evidence: "and-awards", roles: ["frontend", "product", "consultant"] },
  { value: 2, suffix: "", label: "AI products shaped through user-led development with BlackRock's legal teams", evidence: "blk-ai-greenfield", roles: ["product", "fullstack"] },
]
