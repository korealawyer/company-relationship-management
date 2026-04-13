import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-crawler-secret');
    if (!process.env.CRAWLER_SECRET_KEY || authHeader !== process.env.CRAWLER_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { base64Image } = await req.json();

    if (!base64Image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Call OpenAI GPT-4o Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "이 이미지에 있는 6자리 보안문자 숫자만 정확하게 출력해. 띄어쓰기나 다른 말 없이 오직 6개의 숫자만 반환해." },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 10,
      temperature: 0.1, // 낮춰서 환각 최소화
    });

    const captchaText = response.choices[0]?.message?.content?.trim() || "";
    // Clean up potential hallucination returning extra characters
    const cleanNumber = captchaText.replace(/[^0-9]/g, '').slice(0, 6);

    return NextResponse.json({ solved: cleanNumber });

  } catch (error: any) {
    console.error('solve-captcha API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
