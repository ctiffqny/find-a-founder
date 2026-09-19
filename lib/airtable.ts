import type { Founder } from "./types";

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_ACCESS_TOKEN = process.env.AIRTABLE_ACCESS_TOKEN;

if (!AIRTABLE_BASE_ID) {
  throw new Error("Missing AIRTABLE_BASE_ID");
}

if (!AIRTABLE_ACCESS_TOKEN) {
  throw new Error("Missing AIRTABLE_ACCESS_TOKEN");
}

const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;
const FOUNDERS_TABLE = "Founders";

/*
 * Convert an Airtable record into the safe Founder object
 * used by the website.
 *
 * Private fields such as email, phone number, LinkedIn,
 * and Auth User ID are deliberately NOT returned.
 */

function recordToFounder(record: any): Founder {
  const fields = record.fields;

  const graduationYear =
    fields["Graduation Year"] === "Other"
      ? fields["If Other, Graduation Year"]
      : fields["Graduation Year"];

  const school =
    fields["USC School"] === "Other"
      ? fields["If Other, USC School"]
      : fields["USC School"];

  return {
    id: record.id,

    name: fields["Name"] || "",
    firstName: fields["First Name"] || "",
    lastName: fields["Last Name"] || "",

    profilePhoto:
      fields["Profile Photo"]?.[0]?.url,

    graduationYear,
    school,

    degreeProgram:
      fields["Degree / Program"] || "",

    hometown:
      fields["Hometown"] || "",

    currentLocation:
      fields["Current Location"] || "",

    bio:
      fields["Bio"] || "",

    skills:
      fields["Skills"] || [],

    areasOfInterest:
      fields["Areas of Interest"] || [],

    lookingToConnectWith:
      fields["Looking to Connect With"] || [],

    workingOn:
      fields["What I'm Working On"] || "",

    availability:
      fields["Availability"] || "",
  };
}

/*
 * Get all founders who are Active and Visible.
 */
export async function getFounders(): Promise<Founder[]> {
  const params = new URLSearchParams();

  params.set(
    "filterByFormula",
    "AND({Profile Visible}=1,{Profile Status}='Active')"
  );

  const response = await fetch(
    `${AIRTABLE_URL}/${encodeURIComponent(
      FOUNDERS_TABLE
    )}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_ACCESS_TOKEN}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const error = await response.text();

    console.error("Airtable error:", error);

    throw new Error(
      `Failed to retrieve founders from Airtable (${response.status})`
    );
  }

  const data = await response.json();

  return data.records.map(recordToFounder);
}

/*
 * Get one founder by Airtable record ID.
 */
export async function getFounderById(
  id: string
): Promise<Founder | null> {
  const response = await fetch(
    `${AIRTABLE_URL}/${encodeURIComponent(
      FOUNDERS_TABLE
    )}/${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_ACCESS_TOKEN}`,
      },
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.text();

    console.error("Airtable error:", error);

    throw new Error(
      `Failed to retrieve founder from Airtable (${response.status})`
    );
  }

  const record = await response.json();
  const fields = record.fields;

  // Someone should not be able to access a hidden profile
  // simply by knowing its Airtable record ID.
  if (
    !fields["Profile Visible"] ||
    fields["Profile Status"] !== "Active"
  ) {
    return null;
  }

  return recordToFounder(record);
}