
import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import type { Founder } from "@/lib/types";

/**
 * Attach current Clerk profile photos to founder records.
 * Airtable photos remain the fallback.
 */
export async function withClerkAvatars(
  founders: Founder[]
): Promise<Founder[]> {
  if (founders.length === 0) return founders;

  const client = await clerkClient();

  // Retrieve the Clerk users in batches rather than
  // making one API request per founder.
  const clerkUsers = new Map<string, string>();

  let offset = 0;
  const limit = 100;

  while (true) {
    const result = await client.users.getUserList({
      limit,
      offset,
    });

    for (const user of result.data) {
      if (user.imageUrl) {
        clerkUsers.set(user.id, user.imageUrl);
      }
    }

    offset += result.data.length;

    if (result.data.length < limit) break;
  }

  return founders.map((founder) => {
    const clerkImage = clerkUsers.get(
      (founder as Founder & { authUserId?: string }).authUserId || ""
    );

    return {
      ...founder,
      profilePhoto: clerkImage || founder.profilePhoto,
    };
  });
}
