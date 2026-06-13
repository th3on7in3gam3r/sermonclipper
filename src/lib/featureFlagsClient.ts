export function isFlagEnabled(flags: Record<string, boolean>, flagName: string): boolean {
  return flags[flagName] === true;
}
