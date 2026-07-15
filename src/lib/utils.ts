import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Preserve unit/apartment prefixes (e.g., U20, Unit 20, 20/3) from the user's
 * input when applying a Geoapify address suggestion.
 */
export function combineAddressUnit(
  input: string,
  housenumber: string,
  addressLine: string
): string {
  if (!housenumber || !addressLine) return addressLine || '';
  const idx = input.toLowerCase().indexOf(housenumber.toLowerCase());
  if (idx <= 0) return addressLine;

  const unitPrefix = input.slice(0, idx).trim();
  if (!unitPrefix || addressLine.toLowerCase().startsWith(unitPrefix.toLowerCase())) {
    return addressLine;
  }

  const escaped = housenumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rest = addressLine.replace(new RegExp('^\\s*' + escaped + '\\s*'), '');
  const separator = unitPrefix.endsWith('/') ? '' : ' ';
  return unitPrefix + separator + housenumber + (rest ? ' ' + rest : '');
}
