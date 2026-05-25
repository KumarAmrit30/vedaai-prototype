export function buildTestPrompt(): string {
  return `You are an academic assessment generator.

Generate a test assignment as a single JSON object with this exact structure:
{
  "sections": [
    {
      "title": "",
      "instruction": "",
      "questions": [
        {
          "question": "",
          "difficulty": "easy | medium | hard",
          "marks": 2
        }
      ]
    }
  ]
}

Requirements:
- Topic: DBMS (Database Management Systems)
- Create 2 sections with clear titles and instructions
- Each section must contain 3 questions
- Assign difficulty as one of: easy, medium, hard
- Assign marks between 1 and 5 for each question

Output rules:
- Return ONLY valid JSON
- Do NOT use markdown or code fences
- Do NOT include explanations or any text outside the JSON object`;
}
