
"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import {
  getFounderByAuthUserId,
  updateFounderProfile,
} from "@/lib/airtable";

export type EditProfileState = {
  error: string | null;
  success: boolean;
};

function validUrl(value: string) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export async function saveFounderProfile(
  _previousState: EditProfileState,
  formData: FormData
): Promise<EditProfileState> {
  const { userId } = await auth.protect();

  const text = (name: string) =>
    String(formData.get(name) || "").trim();

  const multiple = (name: string) =>
    formData
      .getAll(name)
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);

  const firstName = text("firstName");
  const lastName = text("lastName");
  const bio = text("bio");
  const status = text("status");
  const linkedinUrl = text("linkedinUrl");
  const portfolioUrl = text("portfolioUrl");

  if (!firstName || !lastName || !bio || !status) {
    return {
      error: "Please complete your name, bio, and status.",
      success: false,
    };
  }

  if (!validUrl(linkedinUrl) || !validUrl(portfolioUrl)) {
    return {
      error: "Professional links must be valid HTTPS URLs.",
      success: false,
    };
  }

  const photoValue = formData.get("profilePhoto");
  const photo =
    photoValue instanceof File && photoValue.size > 0
      ? photoValue
      : null;

  if (photo) {
    if (
      !["image/jpeg", "image/png"].includes(photo.type) ||
      photo.size > 2 * 1024 * 1024
    ) {
      return {
        error: "Choose a JPG or PNG photo under 2 MB.",
        success: false,
      };
    }

    const header = new Uint8Array(
      await photo.slice(0, 8).arrayBuffer()
    );

    const validJpeg =
      header[0] === 0xff &&
      header[1] === 0xd8 &&
      header[2] === 0xff;

    const validPng =
      header.length >= 8 &&
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
        (byte, index) => header[index] === byte
      );

    if (
      (photo.type === "image/jpeg" && !validJpeg) ||
      (photo.type === "image/png" && !validPng)
    ) {
      return {
        error: "The selected photo is not a valid image.",
        success: false,
      };
    }
  }

  const founder = await getFounderByAuthUserId(userId);

  if (!founder) {
    return {
      error: "Please create your founder profile first.",
      success: false,
    };
  }

  const customInterests = text("customInterests")
    .split(",")
    .map((interest) => interest.trim())
    .filter(Boolean);

  try {
    await updateFounderProfile(userId, {
      firstName,
      lastName,
      bio,
      hometown: text("hometown"),
      currentLocation: text("currentLocation"),
      degreeProgram: text("degreeProgram"),
      workingOn: text("workingOn"),
      status,
      memberTypes: multiple("memberTypes"),
      whatICanHelpWith: multiple("whatICanHelpWith"),
      areasOfInterest: multiple("areasOfInterest"),
      customInterests,
      lookingToConnectWith: multiple("lookingToConnectWith"),
      linkedinUrl,
      portfolioUrl,
    });
  } catch (error) {
    console.error("Profile update failed:", error);
    return {
      error: "Could not save your changes. Please try again.",
      success: false,
    };
  }

  if (photo) {
    try {
      const client = await clerkClient();
      await client.users.updateUserProfileImage(userId, {
        file: photo,
      });
    } catch (error) {
      console.error("Clerk photo update failed:", error);

      revalidatePath("/profile");
      revalidatePath("/founders");

      return {
        error:
          "Your profile details were saved, but the photo could not be updated. Please try uploading the photo again.",
        success: false,
      };
    }
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/founders");
  revalidatePath(`/founders/${founder.id}`);

  return {
    error: null,
    success: true,
  };
}
