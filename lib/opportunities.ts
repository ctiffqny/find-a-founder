import "server-only";

import type { OpportunityType } from "@/lib/opportunity-options";

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_ACCESS_TOKEN;
const TABLE = "Opportunities";

export type Opportunity = {
  id: string;
  title: string;
  type: OpportunityType | string;
  description: string;
  skills: string;
  location: string;
  commitment: string;
  founderId: string;
  founderName: string;
  status: "Open" | "Closed";
  createdAt: string;
};

type AirtableRecord = {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
};

function apiUrl(id?: string) {
  if (!BASE_ID || !TOKEN) {
    throw new Error("Missing Airtable credentials");
  }

  const base =
    `https://api.airtable.com/v0/` +
    `${encodeURIComponent(BASE_ID)}/` +
    `${encodeURIComponent(TABLE)}`;

  return id ? `${base}/${encodeURIComponent(id)}` : base;
}

async function airtableRequest(
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
      "Opportunities Airtable error",
      response.status,
      await response.text()
    );

    throw new Error(
      "Could not load or save opportunities. Check Airtable setup."
    );
  }

  return response.json();
}

function mapOpportunity(
  record: AirtableRecord
): Opportunity {
  const fields = record.fields;

  const get = (key: string) =>
    String(fields[key] ?? "");

  return {
    id: record.id,
    title: get("Title"),
    type: get("Type"),
    description: get("Description"),
    skills: get("Skills Needed"),
    location: get("Location"),
    commitment: get("Commitment"),
    founderId: get("Founder ID"),
    founderName: get("Founder Name"),
    status:
      get("Status") === "Closed"
        ? "Closed"
        : "Open",
    createdAt: record.createdTime || "",
  };
}

export async function getOpportunities(): Promise<
  Opportunity[]
> {
  const results: Opportunity[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({
      pageSize: "100",
    });

    if (offset) {
      params.set("offset", offset);
    }

    const data = (await airtableRequest(
      `${apiUrl()}?${params}`
    )) as {
      records: AirtableRecord[];
      offset?: string;
    };

    results.push(...data.records.map(mapOpportunity));
    offset = data.offset;
  } while (offset);

  return results.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export async function getOpportunity(
  id: string
): Promise<Opportunity | null> {
  if (!/^rec[A-Za-z0-9]+$/.test(id)) {
    return null;
  }

  const response = await fetch(apiUrl(id), {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to load this opportunity.");
  }

  return mapOpportunity(
    (await response.json()) as AirtableRecord
  );
}

export async function createOpportunity(
  input: Omit<Opportunity, "id" | "createdAt">
) {
  const data = (await airtableRequest(apiUrl(), {
    method: "POST",
    body: JSON.stringify({
      fields: {
        Title: input.title,
        Type: input.type,
        Description: input.description,
        "Skills Needed": input.skills,
        Location: input.location,
        Commitment: input.commitment,
        "Founder ID": input.founderId,
        "Founder Name": input.founderName,
        Status: "Open",
      },
    }),
  })) as AirtableRecord;

  return mapOpportunity(data);
}

export async function closeOpportunity(
  id: string
) {
  await airtableRequest(apiUrl(id), {
    method: "PATCH",
    body: JSON.stringify({
      fields: {
        Status: "Closed",
      },
    }),
  });
}