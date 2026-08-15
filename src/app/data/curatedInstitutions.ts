export const curatedInstitutionIds: Record<string, string> = {
  "1": "https://ror.org/03dbr7087",
  "2": "https://ror.org/02kkvpp62",
  "3": "https://ror.org/027m9bs27",
  "4": "https://ror.org/04dkp9463",
  "5": "https://ror.org/039bjqg32",
  "6": "https://ror.org/04gyf1771",
  "7": "https://ror.org/01nffqt88",
  "8": "https://ror.org/03rmrcq20",
  "9": "https://ror.org/012a77v79",
  "10": "https://ror.org/00hj54h04",
};

export function resolveApplicationInstitutionId(applicationUniversityId: string) {
  if (applicationUniversityId.startsWith("ror-")) {
    const code = applicationUniversityId.slice(4);
    return code ? `https://ror.org/${code}` : "";
  }

  return curatedInstitutionIds[applicationUniversityId] ?? "";
}
