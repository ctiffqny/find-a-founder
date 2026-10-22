
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  getEditableFounderProfile,
  getFounderPhonePreferences,
} from "@/lib/airtable";

import EditProfileForm from "@/components/EditProfileForm";

export default async function EditProfilePage() {
  const { userId } = await auth.protect();

  const founder = await getEditableFounderProfile(userId);

  const phonePreferences =
  await getFounderPhonePreferences(userId);

  if (!founder) {
    redirect("/onboarding");
  }

  const clerkUser = await currentUser();

  return (
    <main className="profile-page edit-profile-page">
      <Link href="/profile" className="back-link">
        ← Back to My Profile
      </Link>

      <h1>Edit My Profile</h1>

      <p>
        Update your information so other USC founders can
        learn more about you.
      </p>

      <EditProfileForm
        founder={founder}
        profilePhoto={clerkUser?.imageUrl || null}
        phonePreferences={phonePreferences}
      />
    </main>
  );
}
