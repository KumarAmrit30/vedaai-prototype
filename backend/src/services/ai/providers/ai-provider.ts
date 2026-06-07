export interface AIProvider {
  readonly name: string;
  generateAssignment(prompt: string): Promise<string>;
}
