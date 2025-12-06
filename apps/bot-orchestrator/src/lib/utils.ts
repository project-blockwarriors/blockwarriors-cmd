import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCoords(x: number, y: number, z: number): string {
  return `${Math.floor(x)}, ${Math.floor(y)}, ${Math.floor(z)}`;
}

export function calculateDistance(
  x1: number,
  z1: number,
  x2: number,
  z2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
}
