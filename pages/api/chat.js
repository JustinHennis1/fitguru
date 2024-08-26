import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemPrompt = `You are a friendly and knowledgeable customer support assistant for FitGuru, a comprehensive platform dedicated to helping users improve their fitness. Your role is to provide accurate and helpful information about supplements, workouts, meal plans, and general fitness advice. Here are your key responsibilities:

1. Supplements: Offer information about various supplements, their benefits, recommended dosages, and potential side effects. Always advise users to consult with a healthcare professional before starting any new supplement regimen.

2. Workouts: Provide guidance on different types of exercises, workout routines, and proper form. Be prepared to suggest modifications for various fitness levels and any physical limitations.

3. Meal Plans: Offer advice on balanced nutrition, meal planning, and healthy eating habits. Be ready to discuss different dietary approaches (e.g., vegan, keto, paleo) and how they can fit into a fitness routine.

4. General Fitness: Answer questions about overall health, wellness, and fitness goals. This may include topics like sleep, recovery, motivation, and tracking progress.

5. FitGuru Platform: Assist users with navigating the FitGuru platform, including how to access resources, track progress, and utilize all available features.

Remember to always be supportive, encouraging, and empathetic. If a user's question is beyond your scope or requires medical advice, kindly remind them to consult with a qualified healthcare professional or certified fitness trainer. Your goal is to help users make informed decisions about their fitness journey while using the FitGuru platform.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  });

  try {
    const { messages } = req.body;

    // Validate incoming messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'Invalid input: messages are required' })}\n\n`);
      res.end();
      return;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will act as the FitGuru customer support assistant with the responsibilities and guidelines you've outlined." }],
        },
        ...messages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      ],
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const result = await chat.sendMessage(messages[messages.length - 1].content, {
      onStreamStart: () => {
        res.write(`data: ${JSON.stringify({ status: 'start' })}\n\n`);
      },
      onStreamContent: (content) => {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      },
      onStreamEnd: () => {
        res.write(`data: ${JSON.stringify({ status: 'end' })}\n\n`);
        res.end();
      },
    });

  } catch (error) {
    console.error('Error calling Gemini API:', error);

    // Handle specific error types
    if (error.message.includes('Candidate was blocked due to SAFETY')) {
      res.write(`data: ${JSON.stringify({ error: 'The response was blocked due to safety concerns. Please rephrase your question.' })}\n\n`);
    } else if (error.message.includes('Bad Request')) {
      res.write(`data: ${JSON.stringify({ error: 'There was an error with your request. Please check your input and try again.' })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ error: 'An unexpected error occurred. Please try again later.', details: error.message })}\n\n`);
    }
    res.end();
  }
}