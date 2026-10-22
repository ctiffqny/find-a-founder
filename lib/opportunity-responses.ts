
import "server-only";

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_ACCESS_TOKEN;
const TABLE = "Opportunity Responses";

export type OpportunityResponseStatus =
  | "Pending"
  | "Accepted"
  | "Declined";

export type OpportunityResponse = {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  opportunityOwnerId: string;
  applicantId: string;
  applicantName: string;
  message: string;
  status: OpportunityResponseStatus;
  submittedAt: string;
};

type AirtableRecord = {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
};

function tableUrl(id?: string) {
  if (!BASE_ID || !TOKEN) {
    throw new Error("Missing Airtable credentials.");
  }

  const base =
    `https://api.airtable.com/v0/` +
    `${encodeURIComponent(BASE_ID)}/` +
    `${encodeURIComponent(TABLE)}`;

  return id ? `${base}/${encodeURIComponent(id)}` : base;
}

async function request(
  url: string,
  init: RequestInit = {}
) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(init.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error(
      "Opportunity responses Airtable error:",
      response.status,
      await response.text()
    );

    throw new Error("Unable to save or load opportunity responses.");
  }

  return response.json();
}

function mapResponse(
  record: AirtableRecord
): OpportunityResponse {
  const get = (key: string) =>
    String(record.fields[key] ?? "");

  const status = get("Status");

  return {
    id: record.id,
    opportunityId: get("Opportunity ID"),
    opportunityTitle: get("Opportunity Title"),
    opportunityOwnerId: get("Opportunity Owner ID"),
    applicantId: get("Applicant ID"),
    applicantName: get("Applicant Name"),
    message: get("Message"),
    status:
      status === "Accepted" || status === "Declined"
        ? status
        : "Pending",
    submittedAt:
      get("Submitted At") || record.createdTime || "",
  };
}

export async function getOpportunityResponses():
  Promise<OpportunityResponse[]> {
  const results: OpportunityResponse[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({
      pageSize: "100",
    });

    if (offset) {
      params.set("offset", offset);
    }

    const data = (await request(
      `${tableUrl()}?${params.toString()}`
    )) as {
      records: AirtableRecord[];
      offset?: string;
    };

    results.push(...data.records.map(mapResponse));
    offset = data.offset;
  } while (offset);

  return results.sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt)
  );
}

export async function getResponseById(
  id: string
): Promise<OpportunityResponse | null> {
  if (!/^rec[A-Za-z0-9]+$/.test(id)) {
    return null;
  }

  const response = await fetch(tableUrl(id), {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
    cache: "no-store",
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error("Unable to load response.");
  }

  return mapResponse(
    (await response.json()) as AirtableRecord
  );
}

export async function createOpportunityResponse(input: {
  opportunityId: string;
  opportunityTitle: string;
  opportunityOwnerId: string;
  applicantId: string;
  applicantName: string;
  message: string;
}) {
  const data = (await request(tableUrl(), {
    method: "POST",
    body: JSON.stringify({
      fields: {
        "Opportunity ID": input.opportunityId,
        "Opportunity Title": input.opportunityTitle,
        "Opportunity Owner ID": input.opportunityOwnerId,
        "Applicant ID": input.applicantId,
        "Applicant Name": input.applicantName,
        Message: input.message,
        Status: "Pending",
      },
    }),
  })) as AirtableRecord;

  return mapResponse(data);
}

export async function updateOpportunityResponseStatus(
  id: string,
  status: "Accepted" | "Declined"
) {
  await request(tableUrl(id), {
    method: "PATCH",
    body: JSON.stringify({
      fields: { Status: status },
    }),
  });
}
