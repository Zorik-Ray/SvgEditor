export interface LineResult {
  readonly output: readonly string[];
  readonly warnings?: readonly string[];
  readonly error?: string;
}

export interface LineExecutor {
  execute(line: string): Promise<LineResult>;
}
