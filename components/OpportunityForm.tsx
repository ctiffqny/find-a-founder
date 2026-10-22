"use client";

import { useActionState } from "react";

import {
  submitOpportunity,
  type OpportunityFormState,
} from "@/app/opportunities/actions";

import { OPPORTUNITY_TYPES } from "@/lib/opportunity-options";

const initialState: OpportunityFormState = {
  error: null,
};

export default function OpportunityForm() {
  const [state, action, pending] = useActionState(
    submitOpportunity,
    initialState
  );

  return (
    <form action={action} className="opportunity-form">
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <label>
        Opportunity title *
        <input
          name="title"
          required
          minLength={5}
          maxLength={100}
          placeholder="Looking for a technical cofounder"
        />
      </label>

      <label>
        Opportunity type *
        <select
          name="type"
          required
          defaultValue=""
        >
          <option value="" disabled>
            Select type
          </option>

          {OPPORTUNITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label>
        Describe the opportunity *
        <textarea
          name="description"
          required
          minLength={30}
          maxLength={3000}
          rows={8}
          placeholder="What are you building? Who are you looking for? What would they work on?"
        />
      </label>

      <label>
        Skills needed
        <input
          name="skills"
          maxLength={300}
          placeholder="e.g. React, product design, marketing"
        />
      </label>

      <div className="opportunity-form-row">
        <label>
          Location
          <input
            name="location"
            maxLength={100}
            placeholder="e.g. Los Angeles / Remote"
          />
        </label>

        <label>
          Time commitment
          <input
            name="commitment"
            maxLength={100}
            placeholder="e.g. 5–10 hours/week"
          />
        </label>
      </div>

      <p className="opportunity-note">
        Your name and a link to your founder profile
        will appear with this post. Your private contact
        details will not be shared.
      </p>

      <button type="submit" disabled={pending}>
        {pending
          ? "Publishing..."
          : "Publish Opportunity"}
      </button>
    </form>
  );
}