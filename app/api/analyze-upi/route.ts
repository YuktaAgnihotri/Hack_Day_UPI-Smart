import { geminiModel } from '@/lib/gemini';
import { generateObject } from 'ai';
import { z } from 'zod';

const TransactionSchema = z.object({
  date: z.string(),
  amount: z.number(),
  merchant: z.string(),
  category: z.string(),
  notes: z.string().optional(),
});

const ResponseSchema = z.object({
  transactions: z.array(TransactionSchema),
  summary: z.object({
    totalSpent: z.number(),
    topCategories: z.record(z.string() , z.number()),
  }),
  insights: z.string(),
  suggestions: z.array(z.string()),
});

export async function POST(request: Request) {
  try {
    const { imageBase64, notes = '' } = await request.json();

    const prompt = `
You are an expert UPI spending analyst.
Analyze the attached UPI transaction screenshot.

${notes ? `Additional user notes: ${notes}` : ''}

Extract ALL transactions you can see.
Categorize them intelligently (Food, Transport, Shopping, Bills, Groceries, Entertainment, Health, etc.).
Even if the name is just "Rahul" or "Aunty", still extract it and put your best guess in 'notes'.

Return ONLY valid JSON in this exact structure. No markdown, no extra text.
`;

    const { object } = await generateObject({
      model: geminiModel,
      schema: ResponseSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              image: imageBase64.split(',')[1], // remove data:image/... base64,
            },
          ],
        },
      ],
    });

    return Response.json(object);   // ← This must be clean JSON

  } catch (error) {
    console.error("Analyze UPI error:", error);
    return Response.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}