/**
 * Formats a Pokemon id as a zero-padded Pokédex number, e.g. 4 -> "#004".
 * Ids past three digits are left intact rather than truncated.
 */
export const getDexNumber = (id: string | number): string => `#${String(id).padStart(3, "0")}`;

/** Formats height in feet (from the API) as Pokemon-style feet and inches, e.g. 2.30 -> 2'04". */
export const formatHeight = (feet: number): string => {
  const totalInches = Math.round(feet * 12);
  const ft = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${ft}'${String(inches).padStart(2, "0")}"`;
};

/** Formats weight in pounds (from the API) with one decimal, e.g. 15.2 lbs. */
export const formatWeight = (pounds: number): string => `${pounds.toFixed(1)} lbs`;
