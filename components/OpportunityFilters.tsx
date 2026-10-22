"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { Opportunity } from "@/lib/opportunities";
import { OPPORTUNITY_TYPES } from "@/lib/opportunity-options";

export default function OpportunityFilters({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [showClosed, setShowClosed] = useState(false);

  const filtered = useMemo(
    () =>
      opportunities.filter((item) => {
        if (!showClosed && item.status === "Closed") {
          return false;
        }

        if (type && item.type !== type) {
          return false;
        }

        const text = [
          item.title,
          item.description,
          item.skills,
          item.founderName,
          item.location,
        ]
          .join(" ")
          .toLowerCase();

        return text.includes(
          query.toLowerCase().trim()
        );
      }),
    [opportunities, query, type, showClosed]
  );

  return (
    <>
      <div className="opportunity-filters">
        <input
          aria-label="Search opportunities"
          placeholder="Search projects, skills, founders..."
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
        />

        <select
          aria-label="Filter opportunity type"
          value={type}
          onChange={(event) =>
            setType(event.target.value)
          }
        >
          <option value="">
            All opportunity types
          </option>

          {OPPORTUNITY_TYPES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <label className="opportunity-closed-toggle">
          <input
            type="checkbox"
            checked={showClosed}
            onChange={(event) =>
              setShowClosed(event.target.checked)
            }
          />
          Show closed
        </label>
      </div>

      <p className="opportunity-count">
        {filtered.length}{" "}
        {filtered.length === 1
          ? "opportunity"
          : "opportunities"}
      </p>

      {filtered.length > 0 ? (
        <div className="opportunity-grid">
          {filtered.map((item) => (
            <article
              className="opportunity-card"
              key={item.id}
            >
              <div className="opportunity-card-top">
                <span className="opportunity-type">
                  {item.type}
                </span>

                <span
                  className={
                    item.status === "Open"
                      ? "opportunity-open"
                      : "opportunity-closed"
                  }
                >
                  {item.status}
                </span>
              </div>

              <h2>
                <Link
                  href={`/opportunities/${item.id}`}
                >
                  {item.title}
                </Link>
              </h2>

              <p className="opportunity-description">
                {item.description}
              </p>

              {item.skills && (
                <p className="opportunity-meta">
                  <strong>Skills:</strong>{" "}
                  {item.skills}
                </p>
              )}

              {item.location && (
                <p className="opportunity-meta">
                  <strong>Location:</strong>{" "}
                  {item.location}
                </p>
              )}

              <div className="opportunity-card-footer">
                <span>
                  Posted by {item.founderName}
                </span>

                <Link
                  href={`/opportunities/${item.id}`}
                >
                  View details →
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="opportunity-empty">
          No matching opportunities yet. Try
          adjusting your filters.
        </div>
      )}
    </>
  );
}