/**
 * Type declaration for tailwind-merge
 * This file helps TypeScript recognize the tailwind-merge module
 */
declare module 'tailwind-merge' {
  export function twMerge(...classLists: (string | undefined | null | false)[]): string
  export default twMerge
}

