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

  skills: string[];
  areasOfInterest: string[];
  lookingToConnectWith: string[];

  workingOn?: string;
  availability?: string;
};