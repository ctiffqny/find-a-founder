
import "server-only";

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_ACCESS_TOKEN = process.env.AIRTABLE_ACCESS_TOKEN;

const TABLE_NAME = "Connection Requests";

export type ConnectionStatus = "Pending" | "Accepted" | "Declined";

export type ConnectionRequest = {
  id: string;
  fromFounderId: string;
  toFounderId: string;
  message: string;
  status: ConnectionStatus;
  createdAt: string;
  respondedAt: string | null;
  emailSent: boolean;
};

type AirtableRecord = {
  id: string;
  createdTime?: string;
  fields: Record<string, any>;
};

function getAirtableConfig() {
  if (!AIRTABLE_BASE_ID || !AIRTABLE_ACCESS_TOKEN) {
    throw new Error("Missing Airtable environment variables.");
  }

  return {
    baseId: AIRTABLE_BASE_ID,
    token: AIRTABLE_ACCESS_TOKEN,
  };
}

function getTableUrl() {
  const { baseId } = getAirtableConfig();

  return `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(TABLE_NAME)}`;
}

async function airtableRequest(
  url: string,
  options: RequestInit = {}
) {
  const { token } = getAirtableConfig();

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();

    console.error("Airtable connection request error:", errorText);

    throw new Error("Unable to process connection request.");
  }

  return response.json();
}

function mapConnectionRequest(
  record: AirtableRecord
): ConnectionRequest {
  const fields = record.fields;

  return {
    id: record.id,
    fromFounderId: fields["From Founder"]?.[0] ?? "",
    toFounderId: fields["To Founder"]?.[0] ?? "",
    message: fields["Message"] ?? "",
    status: fields["Status"] ?? "Pending",
    createdAt:
      fields["Created At"] ??
      record.createdTime ??
      "",
    respondedAt: fields["Responded At"] ?? null,
    emailSent: fields["Email Sent"] ?? false,
  };
}

// Create a connection request.
// Caller must first verify the authenticated sender,
// recipient eligibility, and duplicate-request rules.
export async function createConnectionRequest(
  fromFounderId: string,
  toFounderId: string,
  message: string
): Promise<ConnectionRequest> {
  const data = await airtableRequest(getTableUrl(), {
    method: "POST",
    body: JSON.stringify({
      fields: {
        "From Founder": [fromFounderId],
        "To Founder": [toFounderId],
        Message: message,
        Status: "Pending",
        "Email Sent": false,
      },
    }),
  });

  return mapConnectionRequest(data);
}

// Get requests involving a particular founder.
// This is a data-access helper, not an authorization boundary.
// Only call it from server code that has checked the user.
export async function getConnectionRequestsForFounder(
  founderId: string
): Promise<ConnectionRequest[]> {
  const allRequests: ConnectionRequest[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(getTableUrl());

    url.searchParams.set("pageSize", "100");

    if (offset) {
      url.searchParams.set("offset", offset);
    }

    const data = await airtableRequest(url.toString());

    const records = (data.records ?? []) as AirtableRecord[];

    allRequests.push(
      ...records.map(mapConnectionRequest).filter(
        (request) =>
          request.fromFounderId === founderId ||
          request.toFounderId === founderId
      )
    );

    offset = data.offset;
  } while (offset);

  return allRequests;
}

// Get one connection request by Airtable record ID.
// Only expose the result after checking user permissions.
export async function getConnectionRequestById(
  requestId: string
): Promise<ConnectionRequest | null> {
  if (!/^rec[a-zA-Z0-9]+$/.test(requestId)) {
    return null;
  }

  const { token } = getAirtableConfig();

  const response = await fetch(
    `${getTableUrl()}/${requestId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to load connection request.");
  }

  const data = (await response.json()) as AirtableRecord;

  return mapConnectionRequest(data);
}

// Update the status of an existing request.
// Authorization must be checked by the server action
// before calling this function.
export async function updateConnectionRequestStatus(
  requestId: string,
  status: "Accepted" | "Declined"
): Promise<ConnectionRequest> {
  const data = await airtableRequest(
    `${getTableUrl()}/${encodeURIComponent(requestId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        fields: {
          Status: status,
          "Responded At": new Date().toISOString(),
        },
      }),
    }
  );

  return mapConnectionRequest(data);
}

// Mark an email notification as successfully sent.
export async function markConnectionEmailSent(
  requestId: string
): Promise<void> {
  await airtableRequest(
    `${getTableUrl()}/${encodeURIComponent(requestId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        fields: {
          "Email Sent": true,
          "Email Sent At": new Date().toISOString(),
        },
      }),
    }
  );
}



export async function getConnectionStatusBetweenFounders(
  currentFounderId: string,
  otherFounderId: string
): Promise<ConnectionStatus | null> {
  const requests = await getConnectionRequestsForFounder(
    currentFounderId
  );

  const matchingRequests = requests.filter(
    (request) =>
      (request.fromFounderId === currentFounderId &&
        request.toFounderId === otherFounderId) ||
      (request.fromFounderId === otherFounderId &&
        request.toFounderId === currentFounderId)
  );

  // Accepted takes priority if historical records exist.
  if (matchingRequests.some((request) => request.status === "Accepted")) {
    return "Accepted";
  }

  if (matchingRequests.some((request) => request.status === "Pending")) {
    return "Pending";
  }

  if (matchingRequests.some((request) => request.status === "Declined")) {
    return "Declined";
  }

  return null;
}
