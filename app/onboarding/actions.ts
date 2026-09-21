"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { createFounder } from "@/lib/airtable";

export async function createFounderProfile(
  formData: FormData
) {
  const { userId } = await auth.protect();

  const getText = (name: string) =>
    String(formData.get(name) || "").trim();

  const firstName = getText("firstName");
  const lastName = getText("lastName");
  const uscEmail = getText("uscEmail").toLowerCase();

  // Basic server-side validation.
  if (!firstName || !lastName) {
    throw new Error(
      "First name and last name are required."
    );
  }

  if (!uscEmail.endsWith("@usc.edu")) {
    throw new Error(
      "Please use your USC email address."
    );
  }

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

    skills: formData
      .getAll("skills")
      .map(String),

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

  redirect("/profile");
}