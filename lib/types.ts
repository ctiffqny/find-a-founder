export type Founder = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;

  profilePhoto?: string;

  graduationYear?: string;
  school?: string;
  degreeProgram?: string;

  hometown?: string;
  currentLocation?: string;

  bio?: string;

  whatICanHelpWith: string[];
  areasOfInterest: string[];
  lookingToConnectWith: string[];

  workingOn?: string;
  status: string;

  profileCompleted?: boolean;

  memberTypes: string[];
  linkedinUrl?: string;
  portfolioUrl?: string;
};