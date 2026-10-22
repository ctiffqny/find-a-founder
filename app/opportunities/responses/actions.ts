
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getFounderByAuthUserId } from "@/lib/airtable";
import { getOpportunity } from "@/lib/opportunities";

import {
  createOpportunityResponse,
  getOpportunityResponses,
  getResponseById,
  updateOpportunityResponseStatus,
} from "@/lib/opportunity-responses";

export type InterestFormState = {
  error: string | null;
};

export async function expressInterest(
  _previousState: InterestFormState,
  formData: FormData
): Promise<InterestFormState> {
  const { userId } = await auth.protect();

  const founder = await getFounderByAuthUserId(userId);

  if (!founder) {
    return {
      error: "Create your founder profile first.",
    };
  }

  const opportunityId = String(
    formData.get("opportunityId") ?? ""
  );

  const message = String(
    formData.get("message") ?? ""
  ).trim();

  if (message.length < 10 || message.length > 1000) {
    return {
      error: "Your message must be 10–1000 characters.",
    };
  }

  const opportunity = await getOpportunity(opportunityId);

  if (!opportunity || opportunity.status !== "Open") {
    return {
      error: "This opportunity is no longer open.",
    };
  }

  if (opportunity.founderId === founder.id) {
    return {
      error: "You cannot respond to your own opportunity.",
    };
  }

  try {
    const responses = await getOpportunityResponses();

    const existing = responses.find(
      (response) =>
        response.opportunityId === opportunity.id &&
        response.applicantId === founder.id
    );

    if (existing) {
      return {
        error: "You've already expressed interest in this opportunity.",
      };
    }

    await createOpportunityResponse({
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      opportunityOwnerId: opportunity.founderId,
      applicantId: founder.id,
      applicantName: founder.name,
      message,
    });
  } catch {
    return {
      error: "Unable to submit your interest. Please try again.",
    };
  }

  revalidatePath("/opportunities/responses");
  revalidatePath(`/opportunities/${opportunity.id}`);

  redirect("/opportunities/responses");
}

export async function reviewOpportunityResponse(
  formData: FormData
) {
  const { userId } = await auth.protect();

  const founder = await getFounderByAuthUserId(userId);

  if (!founder) {
    throw new Error("Founder profile required.");
  }

  const responseId = String(
    formData.get("responseId") ?? ""
  );

  const decision = String(
    formData.get("decision") ?? ""
  );

  if (
    decision !== "Accepted" &&
    decision !== "Declined"
  ) {
    throw new Error("Invalid response decision.");
  }

  const response = await getResponseById(responseId);

  if (
    !response ||
    response.opportunityOwnerId !== founder.id
  ) {
    throw new Error("You cannot review this response.");
  }

  // Verify ownership against the current opportunity,
  // not only the copied owner ID in the response.
  const opportunity = await getOpportunity(
    response.opportunityId
  );

  if (
    !opportunity ||
    opportunity.founderId !== founder.id
  ) {
    throw new Error("Opportunity ownership could not be verified.");
  }

  if (response.status !== "Pending") {
    redirect("/opportunities/responses");
  }

  await updateOpportunityResponseStatus(
    response.id,
    decision
  );

  revalidatePath("/opportunities/responses");
  revalidatePath(
    `/opportunities/${response.opportunityId}`
  );

  redirect("/opportunities/responses");
}
