import { geminiModel } from '@/lib/gemini';
import { generateObject } from 'ai';
import { z } from 'zod';

const TransactionSchema = z.object({
  date: z.string(),
  amount: z.number(),
  merchant: z.string(),
  category: z.string(),
  notes: z.string().optional().default(''),
});

const ResponseSchema = z.object({
  transactions: z.array(TransactionSchema),
  summary: z.object({
    totalSpent: z.number(),
    topCategories: z.record(z.string(), z.number()),
  }),
  insights: z.string(),
  suggestions: z.array(z.string()),
});

export async function POST(request: Request) {
  try {
    const { imageBase64, notes = '' } = await request.json();

    if (!imageBase64) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    const prompt = `You are an expert UPI spending analyst.
Analyze the attached UPI transaction screenshot carefully.

${notes ? `User notes: ${notes}` : ''}

Extract every transaction visible. Even if merchant name is just a person's name, still include it.
Categorize intelligently (Food, junk food,  Groceries, Transport, Shopping, Bills, Entertainment, Health, Others, etc.).

Return clean JSON only.`;

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
              image: imageBase64.split(',')[1] || imageBase64 
            },
          ],
        },
      ],
    });

    // --- FIX: Accurate Math Calculation Override ---
    // LLMs are bad at math, so we calculate the exact totals here in JS
    const calculatedTotal = object.transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const calculatedCategories: Record<string, number> = {};
    
    object.transactions.forEach(t => {
      if (t.category && t.amount) {
        calculatedCategories[t.category] = (calculatedCategories[t.category] || 0) + t.amount;
      }
    });

    object.summary = {
      totalSpent: calculatedTotal,
      topCategories: calculatedCategories,
    };
    // ------------------------------------------------

    return Response.json(object);

  } catch (error: any) {
    console.error('Analyze UPI Error:', error);
    return Response.json(
      { error: 'Failed to analyze image. Please try again.' },
      { status: 500 }
    );
  }
}