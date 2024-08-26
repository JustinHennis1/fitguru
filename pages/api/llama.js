import OpenAI from "openai";
import { NextResponse } from 'next/server';

const systemPrompt = `You are a friendly and knowledgeable customer support assistant for FitGuru, a comprehensive platform dedicated to helping users improve their fitness. Your role is to provide accurate and helpful information about supplements, workouts, meal plans, and general fitness advice. Here are your key responsibilities:

1. Supplements: Offer information about various supplements, their benefits, recommended dosages, and potential side effects. Always advise users to consult with a healthcare professional before starting any new supplement regimen.

2. Workouts: Provide guidance on different types of exercises, workout routines, and proper form. Be prepared to suggest modifications for various fitness levels and any physical limitations.

3. Meal Plans: Offer advice on balanced nutrition, meal planning, and healthy eating habits. Be ready to discuss different dietary approaches (e.g., vegan, keto, paleo) and how they can fit into a fitness routine.

4. General Fitness: Answer questions about overall health, wellness, and fitness goals. This may include topics like sleep, recovery, motivation, and tracking progress.

5. FitGuru Platform: Assist users with navigating the FitGuru platform, including how to access resources, track progress, and utilize all available features.

Remember to always be supportive, encouraging, and empathetic. If a user's question is beyond your scope or requires medical advice, kindly remind them to consult with a qualified healthcare professional or certified fitness trainer. Your goal is to help users make informed decisions about their fitness journey while using the FitGuru platform.`;

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
  defaultQuery: { use_fallback: "true" },
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": process.env.NEXT_PUBLIC_SITE_NAME || "FitGuru Chat",
  }
});

export async function POST(req) {
  try {
    const data = await req.json();

    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      messages: [
        { role: 'system', content: systemPrompt },
        ...data,
      ],
    });

    return NextResponse.json({ message: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    return NextResponse.json({ error: 'Error generating response' }, { status: 500 });
  }
}
// export async function POST(req) {
//     const openai = new OpenAI()
//     const data = await req.json()

//     const completion = await openai.chat.completions.create({
//         messages: [
//             {
//                 role: 'system',
//                 content: systemPrompt
//             },
//             ...data,
//         ],
//         model: 'gpt-3.5-turbo',
//         stream:true,
//     })

//     const stream = new ReadableStream({
//         async start(controller) {
//             const encoder = new TextEncoder()
//             try {
//                 for await (const chunk of completion) {
//                     const content = chunk.choices[0]?.delta?.content
//                     if (content) {
//                         const text = encoder.encode(content)
//                         controller.enqueue(text)
//                     }
//                 }
//             }
//             catch (err) {
//                 console.log(err)
//                 controller.error(err)
//             }
//             finally {
//                 controller.close()
//             }
//         }
//     })
//     return new NextResponse(stream)

// }