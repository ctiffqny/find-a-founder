
"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  createFounder,
  uploadFounderProfilePhoto,
} from "@/lib/airtable";

export type CreateProfileState = {
  error: string | null;
};

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

function isValidOptionalUrl(value: string): boolean {
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

export async function createFounderProfile(
  _previousState: CreateProfileState,
  formData: FormData
): Promise<CreateProfileState> {
  const { userId } = await auth.protect();

  const getText = (name: string) =>
    String(formData.get(name) || "").trim();

  const getMultiple = (name: string) =>
    formData
      .getAll(name)
      .filter(
        (value): value is string =>
          typeof value === "string"
      )
      .map((value) => value.trim())
      .filter(Boolean);

  const firstName = getText("firstName");
  const lastName = getText("lastName");
  const uscEmail = getText("uscEmail").toLowerCase();

  const memberTypes = getMultiple("memberTypes");
  const whatICanHelpWith = getMultiple("whatICanHelpWith");
  const areasOfInterest = getMultiple("areasOfInterest");
  const lookingToConnectWith =
    getMultiple("lookingToConnectWith");

  const graduationYear = getText("graduationYear");
  const otherGraduationYear =
    getText("otherGraduationYear");
  const school = getText("school");

  const bio = getText("bio");
  const status = getText("status");

  const linkedinUrl = getText("linkedinUrl");
  const portfolioUrl = getText("portfolioUrl");

  const photoValue = formData.get("profilePhoto");

  const profilePhoto =
    photoValue instanceof File && photoValue.size > 0
      ? photoValue
      : null;

  if (!firstName || !lastName) {
    return {
      error: "Please enter your first and last name.",
    };
  }

  if (!/^[^\s@]+@usc\.edu$/i.test(uscEmail)) {
    return {
      error:
        "Please use your USC email address ending in @usc.edu.",
    };
  }

  if (memberTypes.length === 0) {
    return {
      error:
        "Please select at least one option under 'I am a...'.",
    };
  }

  if (!graduationYear || !school) {
    return {
      error:
        "Please select your graduation year and USC school.",
    };
  }

  if (graduationYear === "Other" && !otherGraduationYear) {
    return {
      error: "Please enter your graduation year.",
    };
  }

  if (!bio || !status) {
    return {
      error:
        "Please complete your bio and current status.",
    };
  }

  if (!isValidOptionalUrl(linkedinUrl)) {
    return {
      error:
        "Please enter a valid LinkedIn URL beginning with https://.",
    };
  }

  if (!isValidOptionalUrl(portfolioUrl)) {
    return {
      error:
        "Please enter a valid portfolio URL beginning with https://.",
    };
  }

  // Validate the optional photo before creating a profile.
  if (profilePhoto) {
    if (
      !["image/jpeg", "image/png"].includes(profilePhoto.type)
    ) {
      return {
        error: "Please upload a JPEG or PNG photo.",
      };
    }

    if (profilePhoto.size > MAX_PHOTO_SIZE) {
      return {
        error:
          "Your profile photo is too large. Please choose an image under 2 MB.",
      };
    }
  }

  let founderId: string;

  try {
    const founder = await createFounder(userId, {
      firstName,
      lastName,
      uscEmail,
      memberTypes,

      graduationYear,
      otherGraduationYear,
      school,

      degreeProgram: getText("degreeProgram"),
      hometown: getText("hometown"),
      currentLocation: getText("currentLocation"),

      bio,
      whatICanHelpWith,
      areasOfInterest,
      otherAreaOfInterest:
        getText("otherAreaOfInterest"),
      lookingToConnectWith,
      workingOn: getText("workingOn"),

      status,
      linkedinUrl,
      portfolioUrl,
    });

    founderId = founder.id;
  } catch (error) {
    console.error("Profile creation failed:", error);

    return {
      error:
        "We couldn't save your profile. Please try again.",
    };
  }

  // Photo upload is optional. If it fails, keep the
  // successfully created profile instead of asking
  // the user to submit and create it again.
  
if (profilePhoto) {
  // Save the photo to Airtable.
  try {
    await uploadFounderProfilePhoto(
      founderId,
      profilePhoto
    );
  } catch (error) {
    console.error(
      "Airtable profile photo upload failed:",
      error
    );
  }

  // Save the same photo to Clerk.
  try {
    const client = await clerkClient();

    await client.users.updateUserProfileImage(userId, {
      file: profilePhoto,
    });
  } catch (error) {
    console.error(
      "Clerk profile photo upload failed:",
      error
    );
  }
}

redirect("/founders");

}
