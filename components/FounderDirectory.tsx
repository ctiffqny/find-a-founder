"use client";

import { useMemo, useState } from "react";

import FounderCard from "@/components/FounderCard";
import type { Founder } from "@/lib/types";

type FounderDirectoryProps = {
  founders: Founder[];
};

export default function FounderDirectory({
  founders,
}: FounderDirectoryProps) {
  const [search, setSearch] = useState("");
  const [school, setSchool] = useState("");
  const [skill, setSkill] = useState("");
  const [interest, setInterest] = useState("");
  const [lookingFor, setLookingFor] = useState("");

  const schools = useMemo(
    () =>
      [...new Set(founders.map((f) => f.school).filter(Boolean))]
        .sort() as string[],
    [founders]
  );

  const skills = useMemo(
    () =>
      [
        ...new Set(
          founders.flatMap((f) => f.skills)
        ),
      ].sort(),
    [founders]
  );

  const interests = useMemo(
    () =>
      [
        ...new Set(
          founders.flatMap((f) => f.areasOfInterest)
        ),
      ].sort(),
    [founders]
  );

  const lookingForOptions = useMemo(
    () =>
      [
        ...new Set(
          founders.flatMap(
            (f) => f.lookingToConnectWith
          )
        ),
      ].sort(),
    [founders]
  );

  const filteredFounders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return founders.filter((founder) => {
      const searchableText = [
        founder.name,
        founder.school,
        founder.degreeProgram,
        founder.hometown,
        founder.currentLocation,
        founder.bio,
        founder.workingOn,
        ...founder.skills,
        ...founder.areasOfInterest,
        ...founder.lookingToConnectWith,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesSchool =
        !school || founder.school === school;

      const matchesSkill =
        !skill || founder.skills.includes(skill);

      const matchesInterest =
        !interest ||
        founder.areasOfInterest.includes(interest);

      const matchesLookingFor =
        !lookingFor ||
        founder.lookingToConnectWith.includes(
          lookingFor
        );

      return (
        matchesSearch &&
        matchesSchool &&
        matchesSkill &&
        matchesInterest &&
        matchesLookingFor
      );
    });
  }, [
    founders,
    search,
    school,
    skill,
    interest,
    lookingFor,
  ]);

  const hasFilters =
    search ||
    school ||
    skill ||
    interest ||
    lookingFor;

  function clearFilters() {
    setSearch("");
    setSchool("");
    setSkill("");
    setInterest("");
    setLookingFor("");
  }

  return (
    <>
      <div className="directory-controls">
        <input
          type="search"
          placeholder="Search by name, skill, interest..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          className="founder-search"
        />

        <div className="founder-filters">
          <select
            value={school}
            onChange={(event) =>
              setSchool(event.target.value)
            }
          >
            <option value="">All schools</option>

            {schools.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={skill}
            onChange={(event) =>
              setSkill(event.target.value)
            }
          >
            <option value="">All skills</option>

            {skills.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={interest}
            onChange={(event) =>
              setInterest(event.target.value)
            }
          >
            <option value="">All interests</option>

            {interests.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={lookingFor}
            onChange={(event) =>
              setLookingFor(event.target.value)
            }
          >
            <option value="">
              Looking to connect with
            </option>

            {lookingForOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="directory-results-row">
          <p>
            <strong>{filteredFounders.length}</strong>{" "}
            {filteredFounders.length === 1
              ? "founder"
              : "founders"}
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="clear-filters"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filteredFounders.length > 0 ? (
        <div className="founders-grid">
          {filteredFounders.map((founder) => (
            <FounderCard
              key={founder.id}
              founder={founder}
            />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <h2>No founders found</h2>

          <p>
            Try changing your search or filters.
          </p>

          <button
            type="button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}