
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getFounderByAuthUserId } from "@/lib/airtable";

export default async function GetStartedPage() {
  const { userId } = await auth();

  // Not signed in: ask the visitor to create an account.
  if (!userId) {
    redirect("/sign-up");
  }

  // Signed in: check their Find-a-Founder profile.
  const founder = await getFounderByAuthUserId(userId);

  // Existing member with completed onboarding.
  if (founder?.profileCompleted) {
    redirect("/founders");
  }

  // Signed in but onboarding is not completed.
  redirect("/onboarding");
}
