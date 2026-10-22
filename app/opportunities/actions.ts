"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getFounderByAuthUserId } from "@/lib/airtable";
import { OPPORTUNITY_TYPES } from "@/lib/opportunity-options";

import {
  createOpportunity,
  closeOpportunity,
  getOpportunity,
} from "@/lib/opportunities";

export type OpportunityFormState = {
  error: string | null;
};

export async function submitOpportunity(
  _previous: OpportunityFormState,
  formData: FormData
): Promise<OpportunityFormState> {
  const { userId } = await auth.protect();

  const founder = await getFounderByAuthUserId(userId);

  if (!founder || !founder.profileCompleted) {
    return {
      error:
        "Complete your founder profile before posting an opportunity.",
    };
  }

  const read = (name: string) =>
    String(formData.get(name) ?? "").trim();

  const title = read("title");
  const type = read("type");
  const description = read("description");
  const skills = read("skills");
  const location = read("location");
  const commitment = read("commitment");

  if (title.length < 5 || title.length > 100) {
    return {
      error: "Title must be 5–100 characters.",
    };
  }

  if (
    !OPPORTUNITY_TYPES.some(
      (option) => option === type
    )
  ) {
    return {
      error: "Select an opportunity type.",
    };
  }

  if (
    description.length < 30 ||
    description.length > 3000
  ) {
    return {
      error:
        "Description must be 30–3000 characters.",
    };
  }

  if (
    skills.length > 300 ||
    location.length > 100 ||
    commitment.length > 100
  ) {
    return {
      error: "One of the optional fields is too long.",
    };
  }

  let createdId: string;

  try {
    const created = await createOpportunity({
      title,
      type,
      description,
      skills,
      location,
      commitment,
      founderId: founder.id,
      founderName: founder.name,
      status: "Open",
    });

    createdId = created.id;
  } catch {
    return {
      error:
        "Could not publish the opportunity. Check your Airtable setup and try again.",
    };
  }

  revalidatePath("/opportunities");

  redirect(`/opportunities/${createdId}`);
}

export async function closeMyOpportunity(
  formData: FormData
) {
  const { userId } = await auth.protect();

  const founder = await getFounderByAuthUserId(userId);

  const id = String(formData.get("id") ?? "");

  const opportunity = await getOpportunity(id);

  if (
    !founder ||
    !opportunity ||
    opportunity.founderId !== founder.id
  ) {
    throw new Error(
      "You cannot edit this opportunity."
    );
  }

  if (opportunity.status !== "Closed") {
    await closeOpportunity(id);
  }

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${id}`);

  redirect(`/opportunities/${id}`);
}