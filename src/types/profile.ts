export type Profile = {
  name: string;
  email: string;
  location: string;
  linkedin: string;
  github: string;
  headline: string;
  tagline: string;
  bioShort: string;
  bioLong: string;
};

export type Skill = { name: string };
export type SkillGroup = { id: string; label: string; skills: Skill[] };

export type EducationItem = {
  title: string;
  org: string;
  period: string;
  bullets: string[];
};
export type EmploymentItem = {
  title: string;
  org: string;
  period: string;
  bullets: string[];
};
export type MilitaryItem = {
  title: string;
  org: string;
  period: string;
  description: string;
};
