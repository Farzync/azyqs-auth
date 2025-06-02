import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to combine class names with Tailwind merge and clsx.
 *
 * @param inputs {ClassValue[]} - List of class values (string, array, object)
 * @returns {string} The merged class name string
 *
 * Example usage:
 * const className = cn('btn', isActive && 'active');
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
