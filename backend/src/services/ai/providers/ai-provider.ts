export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generateAssignment(prompt: string): Promise<string>;
}
