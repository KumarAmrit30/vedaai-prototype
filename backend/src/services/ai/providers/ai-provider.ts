export interface ProviderGenerationResult {
  text: string;
  retryCount: number;
}

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generateAssignment(prompt: string): Promise<ProviderGenerationResult>;
}
