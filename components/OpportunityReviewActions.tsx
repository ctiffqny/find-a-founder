"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  reviewOpportunityResponse,
  closeMyOpportunityAfterAccept,
} from "@/app/opportunities/responses/actions";

import ContactPopup from "@/components/ContactPopup";

type Props = {
  responseId: string;
};

export default function OpportunityReviewActions({
  responseId,
}: Props) {
  const router = useRouter();

  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");

  const [accepted, setAccepted] = useState<{
    applicantId: string;
    opportunityId: string;
    acceptedCount: number;
    opportunityOpen: boolean;
  } | null>(null);

  const [showContact, setShowContact] =
    useState(false);

  const [showClosePrompt, setShowClosePrompt] =
    useState(false);

  function review(decision: "Accepted" | "Declined") {
    setFeedback("");

    startTransition(async () => {
      const result = await reviewOpportunityResponse(
        responseId,
        decision
      );

      setFeedback(result.message);

      if (!result.success) return;

      if (
        decision === "Accepted" &&
        result.applicantId &&
        result.opportunityId
      ) {
        setAccepted({
          applicantId: result.applicantId,
          opportunityId: result.opportunityId,
          acceptedCount: result.acceptedCount ?? 1,
          opportunityOpen: result.opportunityOpen ?? false,
        });

        setShowContact(true);
      }

      router.refresh();
    });
  }

  function closeOpportunity() {
    if (!accepted) return;

    startTransition(async () => {
      const result =
        await closeMyOpportunityAfterAccept(
          accepted.opportunityId
        );

      setFeedback(result.message);

      if (result.success) {
        setShowClosePrompt(false);
        setAccepted(null);
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="opportunity-review-actions">
        <button
          type="button"
          className="opportunity-accept-button"
          disabled={pending}
          onClick={() => review("Accepted")}
        >
          {pending ? "Saving..." : "Accept Interest"}
        </button>

        <button
          type="button"
          className="opportunity-decline-button"
          disabled={pending}
          onClick={() => review("Declined")}
        >
          Decline
        </button>
      </div>

      {feedback && (
        <p role="status" className="connection-feedback">
          {feedback}
        </p>
      )}

      {showContact && accepted && (
        <ContactPopup
          founderId={accepted.applicantId}
          onClose={() => {
            setShowContact(false);

            if (accepted.opportunityOpen) {
              setShowClosePrompt(true);
            }
          }}
        />
      )}

      {showClosePrompt && accepted && (
        <div className="founder-modal-backdrop">
          <div
            className="founder-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="close-opportunity-title"
          >
            <h2 id="close-opportunity-title">
              🎉 Interest accepted!
            </h2>

            <p>
              You've now accepted{" "}
              <strong>{accepted.acceptedCount}</strong>{" "}
              {accepted.acceptedCount === 1
                ? "founder"
                : "founders"}{" "}
              for this opportunity.
            </p>

            <h3>
              Are you still looking for collaborators?
            </h3>

            <p>
              Keep the opportunity open to receive
              more interest, or close it to stop
              new applications.
            </p>

            <div className="founder-modal-actions">
              <button
                type="button"
                disabled={pending}
                className="opportunity-close-button"
                onClick={() => {
                  setShowClosePrompt(false);
                  setAccepted(null);
                  router.refresh();
                }}
              >
                Keep Open
              </button>

              <button
                type="button"
                disabled={pending}
                className="opportunity-primary-link"
                onClick={closeOpportunity}
              >
                {pending
                  ? "Closing..."
                  : "Close Opportunity"}
              </button>
            </div>

            {feedback && (
              <p role="status">{feedback}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}