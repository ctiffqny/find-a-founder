
import "server-only";

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
 * Private fields such as USC Email, Auth User ID,
 * LinkedIn URL, and Portfolio URL are deliberately
 * NOT returned.
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

    memberTypes: fields["Member Type"] || [],

    profilePhoto: fields["Profile Photo"]?.[0]?.url,

    graduationYear: graduationYear || "",
    school: school || "",

    degreeProgram:
      fields["Degree / Program"] || "",

    hometown:
      fields["Hometown"] || "",

    currentLocation:
      fields["Current Location"] || "",

    bio:
      fields["Bio"] || "",

    whatICanHelpWith:
      fields["What I Can Help With"] || [],

    areasOfInterest: [
      ...(fields["Areas of Interest"] || []).filter(
        (interest: string) => interest !== "Other"
      ),
      ...String(fields["If Other, Area of Interest"] || "")
        .split(",")
        .map((interest) => interest.trim())
        .filter(Boolean),
    ],

    lookingToConnectWith:
      fields["Looking to Connect With"] || [],

    workingOn:
      fields["What I'm Working On"] || "",

    status:
      fields["Status"] || "",

    profileCompleted:
      fields["Profile Completed"] === true,
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
 *
 * Hidden or inactive profiles cannot be accessed
 * through this function.
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

  if (
    !fields["Profile Visible"] ||
    fields["Profile Status"] !== "Active"
  ) {
    return null;
  }

  return recordToFounder(record);
}

/*
 * Get a founder profile by Clerk user ID.
 *
 * This includes Draft profiles so we can check
 * whether a user has completed onboarding.
 */
export async function getFounderByAuthUserId(
  userId: string
): Promise<Founder | null> {
  const params = new URLSearchParams();

  // Escape characters that have special meaning
  // inside an Airtable formula string.
  const safeUserId = userId
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");

  params.set(
    "filterByFormula",
    `{Auth User ID}='${safeUserId}'`
  );

  params.set("maxRecords", "1");

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
      `Failed to retrieve founder from Airtable (${response.status})`
    );
  }

  const data = await response.json();

  if (data.records.length === 0) {
    return null;
  }

  return recordToFounder(data.records[0]);
}

/*
 * Data accepted when a user creates a profile.
 *
 * Property names match the updated onboarding form
 * and server action.
 */
type CreateFounderInput = {
  firstName: string;
  lastName: string;
  uscEmail: string;

  memberTypes: string[];

  graduationYear: string;
  otherGraduationYear: string;

  school: string;
  degreeProgram: string;

  hometown: string;
  currentLocation: string;

  bio: string;

  whatICanHelpWith: string[];
  areasOfInterest: string[];
  otherAreaOfInterest: string;

  lookingToConnectWith: string[];
  workingOn: string;

  status: string;

  linkedinUrl: string;
  portfolioUrl: string;
};

/*
 * Create a new founder profile.
 *
 * One Clerk account can create only one profile.
 * Newly created profiles are marked as completed
 * but remain Draft and hidden until approved.
 */
export async function createFounder(
  userId: string,
  input: CreateFounderInput
): Promise<Founder> {
  const existingFounder =
    await getFounderByAuthUserId(userId);

  if (existingFounder) {
    throw new Error(
      "A founder profile already exists for this account."
    );
  }

  const response = await fetch(
    `${AIRTABLE_URL}/${encodeURIComponent(
      FOUNDERS_TABLE
    )}`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${AIRTABLE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        fields: {
          Name: `${input.firstName} ${input.lastName}`.trim(),

          "First Name": input.firstName,
          "Last Name": input.lastName,

          "USC Email": input.uscEmail,

          // Clerk provides this ID on the server.
          "Auth User ID": userId,

          "Member Type": input.memberTypes,

          "Graduation Year": input.graduationYear,

          "If Other, Graduation Year":
            input.graduationYear === "Other"
              ? input.otherGraduationYear
              : "",

          "USC School": input.school,

          "Degree / Program": input.degreeProgram,

          Hometown: input.hometown,

          "Current Location": input.currentLocation,

          Bio: input.bio,

          "What I Can Help With":
            input.whatICanHelpWith,

          "Areas of Interest":
            input.areasOfInterest,

          "If Other, Area of Interest":
            input.areasOfInterest.includes("Other")
              ? input.otherAreaOfInterest
              : "",

          "Looking to Connect With":
            input.lookingToConnectWith,

          "What I'm Working On":
            input.workingOn,

          Status: input.status,

          // Stored in Airtable but not returned
          // by recordToFounder().
          "LinkedIn URL": input.linkedinUrl,
          "Portfolio URL": input.portfolioUrl,

          // User completed the onboarding form.
          "Profile Completed": true,

          // Profile approval is separate from
          // onboarding completion.
          "Profile Visible": true,
          "Profile Status": "Active",
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();

    console.error("Airtable create error:", error);

    throw new Error(
      `Failed to create founder (${response.status})`
    );
  }

  const record = await response.json();

  return recordToFounder(record);
}


/*
 * Upload a JPEG or PNG profile photo to an existing
 * Airtable founder record.
 *
 * This function must only be called on the server.
 */
export async function uploadFounderProfilePhoto(
  founderRecordId: string,
  file: File
): Promise<void> {
  const allowedTypes = ["image/jpeg", "image/png"];
  const maxFileSize = 2 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPEG and PNG images are allowed.");
  }

  if (file.size === 0 || file.size > maxFileSize) {
    throw new Error("Profile photos must be smaller than 2 MB.");
  }

  // Check the file signature, not just the browser MIME type.
  const header = new Uint8Array(
    await file.slice(0, 8).arrayBuffer()
  );

  const isJpeg =
    header[0] === 0xff &&
    header[1] === 0xd8 &&
    header[2] === 0xff;

  const isPng =
    header.length >= 8 &&
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47 &&
    header[4] === 0x0d &&
    header[5] === 0x0a &&
    header[6] === 0x1a &&
    header[7] === 0x0a;

  if (
    (file.type === "image/jpeg" && !isJpeg) ||
    (file.type === "image/png" && !isPng)
  ) {
    throw new Error("The selected file is not a valid image.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  const extension =
    file.type === "image/png" ? "png" : "jpg";

  const response = await fetch(
    `https://content.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(
      founderRecordId
    )}/${encodeURIComponent("Profile Photo")}/uploadAttachment`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contentType: file.type,
        filename: `profile-photo.${extension}`,
        file: bytes.toString("base64"),
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const error = await response.text();

    console.error("Airtable photo upload error:", error);

    throw new Error(
      `Failed to upload profile photo (${response.status})`
    );
  }
}



export async function getFounderProfessionalLinks(
  founderId: string
): Promise<{
  linkedinUrl: string | null;
  portfolioUrl: string | null;
}> {
  if (!/^rec[a-zA-Z0-9]+$/.test(founderId)) {
    throw new Error("Invalid founder ID.");
  }

  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_ACCESS_TOKEN;

  if (!baseId || !token) {
    throw new Error("Missing Airtable configuration.");
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/Founders/${encodeURIComponent(founderId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Unable to retrieve professional links.");
  }

  const record = await response.json();

  const fields = record.fields ?? {};

  return {
    linkedinUrl: fields["LinkedIn URL"] || null,
    portfolioUrl: fields["Portfolio URL"] || null,
  };
}



export type EditableFounderProfile = {
  id: string;
  firstName: string;
  lastName: string;
  bio: string;
  hometown: string;
  currentLocation: string;
  degreeProgram: string;
  workingOn: string;
  status: string;
  memberTypes: string[];
  whatICanHelpWith: string[];
  areasOfInterest: string[];
  customInterests: string[];
  lookingToConnectWith: string[];
  linkedinUrl: string;
  portfolioUrl: string;
};

export async function getEditableFounderProfile(
  userId: string
): Promise<EditableFounderProfile | null> {
  const founder = await getFounderByAuthUserId(userId);

  if (!founder) return null;

  const response = await fetch(
    `${AIRTABLE_URL}/${encodeURIComponent(FOUNDERS_TABLE)}/${founder.id}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_ACCESS_TOKEN}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Could not load your profile for editing.");
  }

  const record = await response.json();
  const fields = record.fields ?? {};

  return {
    id: founder.id,
    firstName: fields["First Name"] || "",
    lastName: fields["Last Name"] || "",
    bio: fields["Bio"] || "",
    hometown: fields["Hometown"] || "",
    currentLocation: fields["Current Location"] || "",
    degreeProgram: fields["Degree / Program"] || "",
    workingOn: fields["What I'm Working On"] || "",
    status: fields["Status"] || "",
    memberTypes: fields["Member Type"] || [],
    whatICanHelpWith: fields["What I Can Help With"] || [],
    areasOfInterest: (fields["Areas of Interest"] || []).filter(
      (interest: string) => interest !== "Other"
    ),
    customInterests: String(
      fields["If Other, Area of Interest"] || ""
    )
      .split(",")
      .map((interest) => interest.trim())
      .filter(Boolean),
    lookingToConnectWith:
      fields["Looking to Connect With"] || [],
    linkedinUrl: fields["LinkedIn URL"] || "",
    portfolioUrl: fields["Portfolio URL"] || "",
  };
}

export async function updateFounderProfile(
  userId: string,
  input: Omit<EditableFounderProfile, "id">
): Promise<void> {
  // Always resolve ownership from the authenticated Clerk ID.
  // Never trust a founder record ID submitted by the browser.
  const founder = await getFounderByAuthUserId(userId);

  if (!founder) {
    throw new Error("Founder profile not found.");
  }

  const customInterests = [
    ...new Set(
      input.customInterests
        .map((interest) => interest.trim())
        .filter(Boolean)
    ),
  ];

  const response = await fetch(
    `${AIRTABLE_URL}/${encodeURIComponent(FOUNDERS_TABLE)}/${founder.id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Name: `${input.firstName} ${input.lastName}`.trim(),
          "First Name": input.firstName,
          "Last Name": input.lastName,
          Bio: input.bio,
          Hometown: input.hometown,
          "Current Location": input.currentLocation,
          "Degree / Program": input.degreeProgram,
          "What I'm Working On": input.workingOn,
          Status: input.status,
          "Member Type": input.memberTypes,
          "What I Can Help With": input.whatICanHelpWith,
          "Areas of Interest": [
            ...input.areasOfInterest,
            ...(customInterests.length ? ["Other"] : []),
          ],
          "If Other, Area of Interest":
            customInterests.join(", "),
          "Looking to Connect With":
            input.lookingToConnectWith,
          "LinkedIn URL": input.linkedinUrl,
          "Portfolio URL": input.portfolioUrl,
        },
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.error(
      "Airtable profile update error:",
      await response.text()
    );
    throw new Error("Failed to update founder profile.");
  }
}



export async function keepLatestFounderPhoto(
  founderRecordId: string
): Promise<void> {
  const recordUrl =
    `${AIRTABLE_URL}/${encodeURIComponent(FOUNDERS_TABLE)}/${founderRecordId}`;

  // Read the current photo attachments.
  const readResponse = await fetch(recordUrl, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_ACCESS_TOKEN}`,
    },
    cache: "no-store",
  });

  if (!readResponse.ok) {
    throw new Error("Could not read founder photos.");
  }

  const record = await readResponse.json();

  const photos: Array<{ id: string; url: string }> =
    record.fields?.["Profile Photo"] || [];

  if (photos.length <= 1) return;

  // Airtable's uploadAttachment endpoint appends new photos.
  // Keep the last uploaded attachment.
  const latestPhoto = photos[photos.length - 1];

  const updateResponse = await fetch(recordUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AIRTABLE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        "Profile Photo": [
          {
            id: latestPhoto.id,
          },
        ],
      },
    }),
    cache: "no-store",
  });

  if (!updateResponse.ok) {
    console.error(
      "Airtable photo cleanup error:",
      await updateResponse.text()
    );

    throw new Error("Could not replace old profile photos.");
  }
}


export type FounderContactDetails = {
  name: string;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
};

export async function getFounderContactDetails(
  founderId: string
): Promise<FounderContactDetails> {
  if (!/^rec[A-Za-z0-9]+$/.test(founderId)) {
    throw new Error("Invalid founder ID.");
  }

  const response = await fetch(
    `${AIRTABLE_URL}/${encodeURIComponent(
      FOUNDERS_TABLE
    )}/${encodeURIComponent(founderId)}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_ACCESS_TOKEN}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Could not load founder contact details.");
  }

  const record = await response.json();
  const fields = record.fields ?? {};

  return {
    name: fields["Name"] || "Founder",
    email: fields["USC Email"] || "",
    phone:
      fields["Share Phone With Connections"] === true
        ? fields["Phone Number"] || null
        : null,
    linkedinUrl: fields["LinkedIn URL"] || null,
    portfolioUrl: fields["Portfolio URL"] || null,
  };
}

export async function updateFounderPhone(
  userId: string,
  phone: string,
  sharePhone: boolean
): Promise<void> {
  const founder = await getFounderByAuthUserId(userId);

  if (!founder) {
    throw new Error("Founder profile not found.");
  }

  const response = await fetch(
    `${AIRTABLE_URL}/${encodeURIComponent(
      FOUNDERS_TABLE
    )}/${encodeURIComponent(founder.id)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          "Phone Number": phone,
          "Share Phone With Connections":
            Boolean(phone) && sharePhone,
        },
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Could not save phone preferences.");
  }
}

export async function getFounderPhonePreferences(
  userId: string
): Promise<{
  phone: string;
  sharePhone: boolean;
}> {
  const founder = await getFounderByAuthUserId(userId);

  if (!founder) {
    return { phone: "", sharePhone: false };
  }

  const response = await fetch(
    `${AIRTABLE_URL}/${encodeURIComponent(
      FOUNDERS_TABLE
    )}/${encodeURIComponent(founder.id)}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_ACCESS_TOKEN}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Could not load phone preferences.");
  }

  const record = await response.json();

  return {
    phone: record.fields?.["Phone Number"] || "",
    sharePhone:
      record.fields?.["Share Phone With Connections"] === true,
  };
}