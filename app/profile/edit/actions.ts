
"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import {
  getFounderByAuthUserId,
  updateFounderProfile,
  uploadFounderProfilePhoto,
  keepLatestFounderPhoto,
  updateFounderPhone,
} from "@/lib/airtable";

export type EditProfileState = {
  error: string | null;
  success: boolean;
};

function validUrl(value: string): boolean {
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
  // 1. Authenticate the user
  const { userId } = await auth.protect();

  const text = (name: string) =>
    String(formData.get(name) || "").trim();

  const multiple = (name: string) =>
    formData
      .getAll(name)
      .filter(
        (value): value is string => typeof value === "string"
      )
      .map((value) => value.trim())
      .filter(Boolean);

  // 2. Read form fields
  const firstName = text("firstName");
  const lastName = text("lastName");
  const bio = text("bio");
  const status = text("status");
  const linkedinUrl = text("linkedinUrl");
  const portfolioUrl = text("portfolioUrl");
  const phone = text("phone");
  const sharePhone =
  formData.get("sharePhone") === "on";

  if (
  phone &&
  !/^\+?[0-9().\-\s]{7,25}$/.test(phone)
  ) {
  return {
      error: "Please enter a valid phone number.",
      success: false,
  };
  }

  // 3. Validate required fields
  if (!firstName || !lastName || !bio || !status) {
    return {
      error: "Please complete your name, bio, and status.",
      success: false,
    };
  }

  // 4. Validate professional links
  if (
    !validUrl(linkedinUrl) ||
    !validUrl(portfolioUrl)
  ) {
    return {
      error: "Professional links must be valid HTTPS URLs.",
      success: false,
    };
  }

  // 5. Read and validate the profile photo
  const photoValue = formData.get("profilePhoto");

  const photo =
    photoValue instanceof File && photoValue.size > 0
      ? photoValue
      : null;

  if (photo) {
    const allowedTypes = ["image/jpeg", "image/png"];

    if (
      !allowedTypes.includes(photo.type) ||
      photo.size > 2 * 1024 * 1024
    ) {
      return {
        error: "Choose a JPG or PNG photo under 2 MB.",
        success: false,
      };
    }

    // Verify actual file contents, not just its MIME type.
    const header = new Uint8Array(
      await photo.slice(0, 8).arrayBuffer()
    );

    const validJpeg =
      header[0] === 0xff &&
      header[1] === 0xd8 &&
      header[2] === 0xff;

    const pngSignature = [
      0x89, 0x50, 0x4e, 0x47,
      0x0d, 0x0a, 0x1a, 0x0a,
    ];

    const validPng =
      header.length >= 8 &&
      pngSignature.every(
        (byte, index) => header[index] === byte
      );

    if (
      (photo.type === "image/jpeg" && !validJpeg) ||
      (photo.type === "image/png" && !validPng)
    ) {
      return {
        error: "The selected file is not a valid JPG or PNG.",
        success: false,
      };
    }
  }

  // 6. Find the existing Airtable founder record
  const founder = await getFounderByAuthUserId(userId);

  if (!founder) {
    return {
      error: "Please create your founder profile first.",
      success: false,
    };
  }

  // 7. Prepare custom interests
  const customInterests = text("customInterests")
    .split(",")
    .map((interest) => interest.trim())
    .filter(Boolean);

  // 8. Save edited profile information to Airtable
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
      lookingToConnectWith: multiple(
        "lookingToConnectWith"
      ),
      linkedinUrl,
      portfolioUrl,
    });
  } catch (error) {
    console.error("Profile update failed:", error);

    return {
      error:
        "Could not save your profile changes. Please try again.",
      success: false,
    };
  }

  try {
    await updateFounderPhone(
        userId,
        phone,
        sharePhone
    );
    } catch (error) {
    console.error("Phone update failed:", error);

    return {
        error:
        "Your other profile changes were saved, but the phone number could not be updated.",
        success: false,
    };
    }

  // 9. Upload the new photo to Clerk and Airtable
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
          "Your profile details were saved, but the Clerk photo update failed. Please try again.",
        success: false,
      };
    }

    try {
      await uploadFounderProfilePhoto(founder.id, photo);
      await keepLatestFounderPhoto(founder.id);
    } catch (error) {
      console.error("Airtable photo upload failed:", error);

      revalidatePath("/profile");
      revalidatePath("/founders");
      revalidatePath(`/founders/${founder.id}`);

      return {
        error:
          "Your profile details and Clerk photo were saved, but the Airtable photo upload failed. Please try again.",
        success: false,
      };
    }
  }

  // 10. Refresh pages to display the updated information
  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/founders");
  revalidatePath(`/founders/${founder.id}`);

  return {
    error: null,
    success: true,
  };
}
