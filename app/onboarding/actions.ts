
"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createFounder } from "@/lib/airtable";

export type CreateProfileState = {
  error: string | null;
};

export async function createFounderProfile(
  _previousState: CreateProfileState,
  formData: FormData
): Promise<CreateProfileState> {
  const { userId } = await auth.protect();

  const getText = (name: string) =>
    String(formData.get(name) || "").trim();

  const firstName = getText("firstName");
  const lastName = getText("lastName");
  const uscEmail = getText("uscEmail").toLowerCase();

  if (!firstName || !lastName) {
    return {
      error: "Please enter your first and last name.",
    };
  }

  if (!/^[^\s@]+@usc\.edu$/i.test(uscEmail)) {
    return {
      error: "Please use your USC email address ending in @usc.edu.",
    };
  }

  if (!getText("graduationYear") || !getText("school")) {
    return {
      error: "Please select your graduation year and USC school.",
    };
  }

  if (!getText("bio") || !getText("availability")) {
    return {
      error: "Please complete your bio and availability.",
    };
  }

  try {
    await createFounder(userId, {
      firstName,
      lastName,
      uscEmail,
      graduationYear: getText("graduationYear"),
      otherGraduationYear: getText("otherGraduationYear"),
      school: getText("school"),
      degreeProgram: getText("degreeProgram"),
      hometown: getText("hometown"),
      currentLocation: getText("currentLocation"),
      bio: getText("bio"),
      skills: formData.getAll("skills").map(String),
      areasOfInterest: formData
        .getAll("areasOfInterest")
        .map(String),
      otherAreaOfInterest: getText("otherAreaOfInterest"),
      lookingToConnectWith: formData
        .getAll("lookingToConnectWith")
        .map(String),
      workingOn: getText("workingOn"),
      availability: getText("availability"),
    });
  } catch (error) {
    console.error("Profile creation failed:", error);

    return {
      error:
        "We couldn't save your profile. Please try again. If the problem continues, contact the site administrator.",
    };
  }

  redirect("/founders");
}
