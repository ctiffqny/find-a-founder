
"use client";

import { useActionState } from "react";

import {
  expressInterest,
  type InterestFormState,
} from "@/app/opportunities/responses/actions";

const initialState: InterestFormState = {
  error: null,
};

export default function InterestForm({
  opportunityId,
}: {
  opportunityId: string;
}) {
  const [state, action, pending] = useActionState(
    expressInterest,
    initialState
  );

  return (
    <form action={action} className="interest-form">
      <input
        type="hidden"
        name="opportunityId"
        value={opportunityId}
      />

      <h2>Interested in this opportunity?</h2>

      <p>
        Introduce yourself and tell the founder why
        you'd like to collaborate.
      </p>

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <label htmlFor="interest-message">
        Your message
      </label>

      <textarea
        id="interest-message"
        name="message"
        required
        minLength={10}
        maxLength={1000}
        rows={5}
        placeholder="Hi! I'm interested in your project because..."
      />

      <button type="submit" disabled={pending}>
        {pending
          ? "Submitting..."
          : "I'm Interested →"}
      </button>
    </form>
  );
}
