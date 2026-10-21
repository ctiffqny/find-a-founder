
"use client";

import { useState, useTransition } from "react";
import { sendConnectionRequest } from "@/app/connections/actions";

type ConnectButtonProps = {
  founderId: string;
};

export default function ConnectButton({
  founderId,
}: ConnectButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    setFeedback("");

    startTransition(async () => {
      const result = await sendConnectionRequest(
        founderId,
        message
      );

      if (result.success) {
        setRequestSent(true);
        setIsOpen(false);
        setMessage("");
      }

      setFeedback(result.message);
    });
  }

  if (requestSent) {
    return (
      <div>
        <button
          type="button"
          disabled
          className="connect-button"
        >
          Request Sent
        </button>

        <p className="connection-feedback" role="status">
          {feedback}
        </p>
      </div>
    );
  }

  return (
    <div className="connect-widget">
      {!isOpen ? (
        <>
          <button
            type="button"
            className="connect-button"
            onClick={() => {
              setFeedback("");
              setIsOpen(true);
            }}
          >
            Connect
          </button>

          {feedback && (
            <p className="connection-feedback" role="status">
              {feedback}
            </p>
          )}
        </>
      ) : (
        <div className="connection-compose">
          <h3>Send a Connection Request</h3>

          <p>
            Introduce yourself and tell this founder why
            you would like to connect.
          </p>

          <label htmlFor={`connection-message-${founderId}`}>
            Your message (optional)
          </label>

          <textarea
            id={`connection-message-${founderId}`}
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            maxLength={1000}
            rows={5}
            placeholder="Hi! I'd love to connect because..."
            disabled={isPending}
          />

          <p className="connection-character-count">
            {message.length}/1000 characters
          </p>

          {feedback && (
            <p className="connection-feedback" role="alert">
              {feedback}
            </p>
          )}

          <div className="connection-compose-actions">
            <button
              type="button"
              className="connection-cancel-button"
              onClick={() => {
                setIsOpen(false);
                setFeedback("");
              }}
              disabled={isPending}
            >
              Cancel
            </button>

            <button
              type="button"
              className="connect-button"
              onClick={handleSend}
              disabled={isPending}
            >
              {isPending ? "Sending..." : "Send Request"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
