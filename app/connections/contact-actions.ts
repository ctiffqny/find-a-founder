"use server";

import { auth } from "@clerk/nextjs/server";

import {
  getFounderByAuthUserId,
  getFounderContactDetails,
} from "@/lib/airtable";

import { getConnectionStatusBetweenFounders } from "@/lib/connections";

export async function getConnectedFounderContact(
  otherFounderId: string
) {
  const { userId } = await auth.protect();

  const currentFounder =
    await getFounderByAuthUserId(userId);

  if (!currentFounder?.profileCompleted) {
    throw new Error("Complete your founder profile first.");
  }

  if (!/^rec[A-Za-z0-9]+$/.test(otherFounderId)) {
    throw new Error("Invalid founder.");
  }

  if (currentFounder.id !== otherFounderId) {
    const status =
      await getConnectionStatusBetweenFounders(
        currentFounder.id,
        otherFounderId
      );

    if (status !== "Accepted") {
      throw new Error(
        "Contact details are available after a connection is accepted."
      );
    }
  }

  return getFounderContactDetails(otherFounderId);
}