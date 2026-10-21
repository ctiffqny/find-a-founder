
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondToConnectionRequest } from "@/app/connections/actions";

type Props = {
  requestId: string;
};

export default function ConnectionRequestActions({
  requestId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");

  function handleDecision(decision: "Accepted" | "Declined") {
    setFeedback("");

    startTransition(async () => {
      try {
        const result = await respondToConnectionRequest(
          requestId,
          decision
        );

        setFeedback(result.message);

        if (result.success) {
          router.refresh();
        }
      } catch {
        setFeedback("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="connection-request-actions">
      <div className="connection-request-buttons">
        <button
          type="button"
          className="connection-accept-button"
          disabled={isPending}
          onClick={() => handleDecision("Accepted")}
        >
          {isPending ? "Saving..." : "Accept"}
        </button>

        <button
          type="button"
          className="connection-decline-button"
          disabled={isPending}
          onClick={() => handleDecision("Declined")}
        >
          Decline
        </button>
      </div>

      {feedback && (
        <p role="status" className="connection-feedback">
          {feedback}
        </p>
      )}
    </div>
  );
}
