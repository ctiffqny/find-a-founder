export const OPPORTUNITY_TYPES = [
  "Cofounder",
  "Team Member",
  "Project Collaboration",
  "Internship",
  "Other",
] as const;

export type OpportunityType =
  (typeof OPPORTUNITY_TYPES)[number];