
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getFounderByAuthUserId } from "@/lib/airtable";

export async function requireCompletedProfile() {
  const { userId } = await auth();

  // User must be signed in.
  if (!userId) {
    redirect("/sign-in");
  }

  // Find the user's profile in Airtable.
  const profile = await getFounderByAuthUserId(userId);

  // User must have completed onboarding.
  if (!profile || !profile.profileCompleted) {
    redirect("/onboarding");
  }

  return profile;
}

