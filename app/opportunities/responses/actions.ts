
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getFounderByAuthUserId } from "@/lib/airtable";
import {
  getOpportunity,
  closeOpportunity,
} from "@/lib/opportunities";

import {
  createOpportunityResponse,
  getOpportunityResponses,
  getResponseById,
  updateOpportunityResponseStatus,
} from "@/lib/opportunity-responses";

import {
  ensureAcceptedConnection,
} from "@/lib/connections";

export type InterestFormState = {
  error: string | null;
};

export async function expressInterest(
  _previousState: InterestFormState,
  formData: FormData
): Promise<InterestFormState> {
  const { userId } = await auth.protect();

  const founder = await getFounderByAuthUserId(userId);

  if (!founder?.profileCompleted) {
    return {
      error: "Complete your founder profile first.",
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
        error:
          "You've already expressed interest in this opportunity.",
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
      error:
        "Unable to submit your interest. Please try again.",
    };
  }

  revalidatePath("/opportunities/responses");
  revalidatePath(`/opportunities/${opportunity.id}`);

  redirect("/opportunities/responses");
}

export type ReviewResult = {
  success: boolean;
  message: string;
  applicantId?: string;
  opportunityId?: string;
  acceptedCount?: number;
  opportunityOpen?: boolean;
};

export async function reviewOpportunityResponse(
  responseId: string,
  decision: "Accepted" | "Declined"
): Promise<ReviewResult> {
  try {
    const { userId } = await auth.protect();

    const founder = await getFounderByAuthUserId(userId);

    if (!founder?.profileCompleted) {
      return {
        success: false,
        message: "Complete your founder profile first.",
      };
    }

    if (
      decision !== "Accepted" &&
      decision !== "Declined"
    ) {
      return {
        success: false,
        message: "Invalid decision.",
      };
    }

    const response = await getResponseById(responseId);

    if (
      !response ||
      response.opportunityOwnerId !== founder.id
    ) {
      return {
        success: false,
        message: "You cannot review this response.",
      };
    }

    const opportunity = await getOpportunity(
      response.opportunityId
    );

    if (
      !opportunity ||
      opportunity.founderId !== founder.id
    ) {
      return {
        success: false,
        message: "Opportunity ownership could not be verified.",
      };
    }

    if (response.status !== "Pending") {
      return {
        success: false,
        message: "This response has already been reviewed.",
      };
    }

    if (decision === "Accepted") {
      // Both founders consented to collaborate:
      // applicant expressed interest; owner accepted.
      // Establish contact access before marking
      // the response accepted.
      await ensureAcceptedConnection(
        founder.id,
        response.applicantId
      );
    }

    await updateOpportunityResponseStatus(
      response.id,
      decision
    );

    revalidatePath("/connections");
    revalidatePath("/opportunities/responses");
    revalidatePath(`/opportunities/${opportunity.id}`);
    revalidatePath(`/founders/${founder.id}`);
    revalidatePath(`/founders/${response.applicantId}`);

    if (decision === "Declined") {
      return {
        success: true,
        message: "Interest declined.",
      };
    }

    const allResponses = await getOpportunityResponses();

    const acceptedCount = allResponses.filter(
      (item) =>
        item.opportunityId === opportunity.id &&
        item.status === "Accepted"
    ).length;

    return {
      success: true,
      message: "Interest accepted! You're now connected.",
      applicantId: response.applicantId,
      opportunityId: opportunity.id,
      acceptedCount,
      opportunityOpen: opportunity.status === "Open",
    };
  } catch (error) {
    console.error(
      "Opportunity review failed:",
      error
    );

    return {
      success: false,
      message:
        "Unable to review interest. Please try again.",
    };
  }
}

export async function closeMyOpportunityAfterAccept(
  opportunityId: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { userId } = await auth.protect();

    const founder = await getFounderByAuthUserId(userId);

    if (!founder?.profileCompleted) {
      return {
        success: false,
        message: "Founder profile required.",
      };
    }

    const opportunity =
      await getOpportunity(opportunityId);

    if (
      !opportunity ||
      opportunity.founderId !== founder.id
    ) {
      return {
        success: false,
        message: "You cannot close this opportunity.",
      };
    }

    if (opportunity.status !== "Closed") {
      await closeOpportunity(opportunity.id);
    }

    revalidatePath("/opportunities");
    revalidatePath("/opportunities/responses");
    revalidatePath(`/opportunities/${opportunity.id}`);

    return {
      success: true,
      message: "Opportunity closed successfully.",
    };
  } catch (error) {
    console.error(
      "Close opportunity failed:",
      error
    );

    return {
      success: false,
      message: "Unable to close this opportunity.",
    };
  }
}