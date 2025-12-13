// src/lib/ai.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY || '';
const preferredModel = 'gemini-flash-latest'; // Use the free, fast model

const genAI = new GoogleGenerativeAI(apiKey);

export type MemoDraft = {
  title: string;
  department?: string;
  requesterName?: string;
  justification?: string;
  amount?: number;
  currency?: string;
  vendor?: string;
  quantity?: number;
};

export async function generateMemoLetter(draft: MemoDraft): Promise<string> {
  if (!apiKey) throw new Error('Missing VITE_GOOGLE_GENAI_API_KEY');

  const model = genAI.getGenerativeModel({ model: preferredModel });

  // improved prompt to force clean structure
  const prompt = `
Act as a professional procurement officer. Write a formal internal memo.

DETAILS:
- To: Procurement Department
- From: ${draft.requesterName ?? 'Staff Member'} (${draft.department ?? 'General Dept'})
- Date: ${new Date().toLocaleDateString()}
- Subject: ${draft.title}
- Item: ${draft.title} (Qty: ${draft.quantity || 1})
- Cost: ${draft.currency} ${draft.amount ? draft.amount.toLocaleString() : 'TBD'}
- Justification: ${draft.justification}

INSTRUCTIONS:
- Write this as a plain text letter.
- Do NOT use Markdown formatting like bold (**), italics (*), or headings (##).
- Do NOT use tables or pipes (|).
- Keep the tone professional, persuasive, and concise (under 300 words).
- End with a standard sign-off.
- the subject should be all uppercase.
- the justification content should be justified and aligned

  `.trim();

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("Failed to generate memo.");
  }
}