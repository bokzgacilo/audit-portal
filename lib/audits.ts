export type Audit = {
  id: string;
  name: string;
  type: string;
  format: string;
  createdOn: string;
  reportUrl: string;
  visitUrl: string;
  link: string;
  password: string;
  sharedTo: string[];
  html_text?: string;
  html_zip?: string;
  video?: string;
};

export type AuditActivity = {
  id: string;
  auditId: string;
  actor: string;
  action: string;
  createdAt: string;
};

type SupabaseAuditRow = Record<string, unknown>;

export const AUDITS: Audit[] = [
  {
    id: "aud-001",
    name: "Q1 Vendor Compliance Review",
    type: "Compliance",
    format: "html",
    createdOn: "2026-04-21",
    reportUrl: "/dashboard/audits/aud-001",
    visitUrl: "https://example.com/vendors/q1-review",
    link: "https://example.com/vendors/q1-review",
    password: "",
    sharedTo: ["maria@kasama.co", "finance@client.com"],
  },
  {
    id: "aud-002",
    name: "Branch Cash Handling Audit",
    type: "Finance",
    format: "pdf",
    createdOn: "2026-04-19",
    reportUrl: "/dashboard/audits/aud-002",
    visitUrl: "https://example.com/branches/cash-handling",
    link: "https://example.com/branches/cash-handling",
    password: "",
    sharedTo: ["leo@kasama.co", "ops@client.com", "auditor@client.com"],
  },
  {
    id: "aud-003",
    name: "Access Control Spot Check",
    type: "Security",
    format: "video",
    createdOn: "2026-04-18",
    reportUrl: "/dashboard/audits/aud-003",
    visitUrl: "https://example.com/security/access-control",
    link: "https://example.com/security/access-control",
    password: "",
    sharedTo: ["security@client.com"],
  },
  {
    id: "aud-004",
    name: "Fulfillment SLA Assessment",
    type: "Operations",
    format: "html",
    createdOn: "2026-04-16",
    reportUrl: "/dashboard/audits/aud-004",
    visitUrl: "https://example.com/fulfillment/sla",
    link: "https://example.com/fulfillment/sla",
    password: "",
    sharedTo: ["nina@kasama.co", "warehouse@client.com"],
  },
  {
    id: "aud-005",
    name: "Payroll Controls Walkthrough",
    type: "Finance",
    format: "pdf",
    createdOn: "2026-04-12",
    reportUrl: "/dashboard/audits/aud-005",
    visitUrl: "https://example.com/payroll/controls",
    link: "https://example.com/payroll/controls",
    password: "",
    sharedTo: ["payroll@client.com", "hr@client.com"],
  },
  {
    id: "aud-006",
    name: "Data Retention Policy Check",
    type: "Compliance",
    format: "html",
    createdOn: "2026-04-10",
    reportUrl: "/dashboard/audits/aud-006",
    visitUrl: "https://example.com/compliance/data-retention",
    link: "https://example.com/compliance/data-retention",
    password: "",
    sharedTo: ["legal@client.com"],
  },
  {
    id: "aud-007",
    name: "Incident Response Drill",
    type: "Security",
    format: "video",
    createdOn: "2026-04-08",
    reportUrl: "/dashboard/audits/aud-007",
    visitUrl: "https://example.com/security/incident-response",
    link: "https://example.com/security/incident-response",
    password: "",
    sharedTo: ["cto@client.com", "security@client.com"],
  },
  {
    id: "aud-008",
    name: "Store Opening Readiness",
    type: "Operations",
    format: "html",
    createdOn: "2026-04-03",
    reportUrl: "/dashboard/audits/aud-008",
    visitUrl: "https://example.com/stores/opening-readiness",
    link: "https://example.com/stores/opening-readiness",
    password: "",
    sharedTo: ["retail@client.com", "ops@client.com"],
  },
  {
    id: "aud-009",
    name: "Expense Approval Sampling",
    type: "Finance",
    format: "pdf",
    createdOn: "2026-03-29",
    reportUrl: "/dashboard/audits/aud-009",
    visitUrl: "https://example.com/finance/expense-sampling",
    link: "https://example.com/finance/expense-sampling",
    password: "",
    sharedTo: ["controller@client.com"],
  },
  {
    id: "aud-010",
    name: "Privacy Notice Review",
    type: "Compliance",
    format: "html",
    createdOn: "2026-03-25",
    reportUrl: "/dashboard/audits/aud-010",
    visitUrl: "https://example.com/privacy/notice-review",
    link: "https://example.com/privacy/notice-review",
    password: "",
    sharedTo: ["dpo@client.com", "legal@client.com"],
  },
  {
    id: "aud-011",
    name: "Endpoint Inventory Audit",
    type: "Security",
    format: "video",
    createdOn: "2026-03-22",
    reportUrl: "/dashboard/audits/aud-011",
    visitUrl: "https://example.com/security/endpoint-inventory",
    link: "https://example.com/security/endpoint-inventory",
    password: "",
    sharedTo: ["it@client.com"],
  },
  {
    id: "aud-012",
    name: "Returns Process Review",
    type: "Operations",
    format: "html",
    createdOn: "2026-03-18",
    reportUrl: "/dashboard/audits/aud-012",
    visitUrl: "https://example.com/operations/returns",
    link: "https://example.com/operations/returns",
    password: "",
    sharedTo: ["support@client.com", "ops@client.com"],
  },
];

export const AUDIT_ACTIVITIES: AuditActivity[] = AUDITS.flatMap(
  (audit, index) => [
    {
      id: `${audit.id}-activity-1`,
      auditId: audit.id,
      actor: index % 2 === 0 ? "Maria Santos" : "Leo Reyes",
      action: "Created the audit record",
      createdAt: `${audit.createdOn}T09:00:00`,
    },
    {
      id: `${audit.id}-activity-2`,
      auditId: audit.id,
      actor: "Kasama Audit Portal",
      action: "Generated the report link",
      createdAt: `${audit.createdOn}T09:12:00`,
    },
    {
      id: `${audit.id}-activity-3`,
      auditId: audit.id,
      actor: index % 2 === 0 ? "Finance Team" : "Operations Team",
      action: `Shared with ${audit.sharedTo.length} recipient${audit.sharedTo.length === 1 ? "" : "s"}`,
      createdAt: `${audit.createdOn}T10:30:00`,
    },
  ],
);

export const AUDIT_TYPES = [
  "All types",
  "Compliance",
  "Finance",
  "Operations",
  "Security",
];

export const formatAuditDate = (date: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));

export const formatAuditDateTime = (date: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

export const getAuditById = (id: string) =>
  AUDITS.find((audit) => audit.id === id) ?? null;

export const getAuditActivities = (auditId: string) =>
  AUDIT_ACTIVITIES.filter((activity) => activity.auditId === auditId);

const readString = (row: SupabaseAuditRow, keys: string[], fallback = "") => {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return fallback;
};

const readStringList = (row: SupabaseAuditRow, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];

    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string");
    }

    if (typeof value === "string" && value.trim()) {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const readReportUrl = (row: SupabaseAuditRow, id: string) => {
  const directUrl = readString(row, ["report_url", "reportUrl", "link", "url"]);

  if (directUrl) {
    return directUrl;
  }

  const links = row.links;

  if (Array.isArray(links)) {
    const firstLink = links.find(
      (link): link is string => typeof link === "string",
    );

    if (firstLink) {
      return firstLink;
    }
  }

  if (typeof links === "string" && links.trim()) {
    return links;
  }

  return `/dashboard/audits/${id}`;
};

export const mapSupabaseAudit = (row: SupabaseAuditRow): Audit => {
  const id = readString(row, ["id"], crypto.randomUUID());
  const createdOn = readString(
    row,
    ["created_on", "createdOn", "created_at", "createdAt"],
    new Date().toISOString(),
  );

  return {
    id,
    name: readString(
      row,
      ["name", "audit_name", "auditName"],
      "Untitled audit",
    ),
    type: readString(
      row,
      ["type", "audit_type", "auditType"],
      "Operations",
    ) as Audit["type"],
    format: readString(row, ["format"], "html").toLowerCase(),
    createdOn,
    reportUrl: readReportUrl(row, id),
    visitUrl: readString(row, ["visit", "visit_url", "visitUrl"], "#"),
    link: readString(
      row,
      ["link", "public_url", "publicUrl"],
      readReportUrl(row, id),
    ),
    html_text: readString(row, ["html_text"], ""),
    html_zip: readString(row, ["html_zip"], ""),
    video: readString(row, ["video"], ""),
    password: readString(row, ["password"], ""),
    sharedTo: readStringList(row, ["shared_to", "sharedTo", "shared"]),
  };
};
