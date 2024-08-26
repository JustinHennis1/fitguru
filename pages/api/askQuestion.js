import { ChatGoogleGenerativeAI} from "@langchain/google-genai";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { GoogleGenerativeAIResponseError,HarmBlockThreshold, HarmCategory  } from "@google/generative-ai";
import { PineconeStore } from "@langchain/pinecone"; // Import PineconeStore
import { Pinecone } from "@pinecone-database/pinecone";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '../../.env.local' });

// Initialize Gemini model
const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  modelName: "gemini-pro",
  temperature: 0.9,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ],
});

// Initialize Gemini embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  modelName: "embedding-001", // Use the appropriate embedding model
});

// Initialize Pinecone client
const pc = new Pinecone({
  apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY,
 });


async function chainretriever(){
    try{
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        namespace: "HealthAndFitness",
        pineconeIndex: pc.Index(process.env.NEXT_PUBLIC_PINECONE_INDEX_NAME), // Specify your Pinecone index
      });
      //console.log("Vector store created successfully."); // Confirm vector store creation
  
      // Create a retriever and log retrieved documents
      const retriever = vectorStore.asRetriever({k: 5});
      //console.log("Retriever configuration:", JSON.stringify(retriever, null, 2));

      // Before invoking the chain
      //console.log("Querying with namespace:", vectorStore.namespace);

  
      // Create a prompt template
      const prompt = ChatPromptTemplate.fromTemplate(`
        You are a FitGuru AI agent. You are here to answer Questions about fitness and health. Only answer questions related
        to fitness, health and the context of the youtube videos you are given. You are supportive and encouraging towards
        your users.

        Format your responses. Do not include whitespace before or after your response.

        Here is your markdown cheat sheet: 
              Heading	# H1
                      ## H2
                      ### H3
              Bold	**bold text**
              Italic	*italicized text*
              Blockquote	> blockquote
              Ordered List	1. First item
              2. Second item
              3. Third item
              Unordered List	- First item
              - Second item
              - Third item
              Horizontal Rule	---
              Link	[title](https://www.example.com)
              Image	![alt text](image.jpg)

        Answer the following question based on the context provided:
        Context: {context}
        Question: {input}

        Please provide a detailed and comprehensive answer. Include relevant facts, explanations, and examples if applicable. Elaborate on key points and consider multiple aspects of the question. Your response should be thorough and informative.
        Style your response using the markdown elements listed above.

        Answer:
      `);
  
      // Create a combine documents chain
      const combineDocsChain = await createStuffDocumentsChain({
        llm: model,
        prompt,
      });
  
      // Create a retrieval chain
      const retrievalChain = await createRetrievalChain({
        combineDocsChain,
        retriever,
      });
  
      return retrievalChain;
    } catch (error) {
      console.error("Error processing video:", error);
      throw error;
    }
}

// Function to ask questions about the video
async function askQuestion(chain, question) {
    try {
      const response = await chain.invoke({ input: question });
      //console.log(`Question: ${question}`);
      //console.log('Full response:', JSON.stringify(response, null, 2));

      return response;
    } catch (error) {
      if (error instanceof GoogleGenerativeAIResponseError && error.message.includes('SAFETY')) {
        console.error('Safety filter triggered:', error.message);
        return { error: 'Your input triggered a safety filter. Please modify your question and try again.' };
      
    } else if (error.response && error.response.status === 429) {
      console.error('API usage limit reached:', error.message);
      return { error: 'API usage limit reached. Please try again later.' };
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      console.error('Quota exceeded:', error.message);
      return { error: 'Quota exceeded. Please wait before making more requests.' };
    } else {
      console.error("Error asking question:", error);
      console.error(error.stack);  
      return { error: 'Please modify your question and try again.' };
     
    }
  }
}

// Main execution
export default async function main(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { question } = req.body;

  try {
    //console.log("Querying Index Namespace ...");
    const chain = await chainretriever();
    //console.log("Ready for questions.");

    let result = await askQuestion(chain, question);
    
    // Check if there's an error in the result
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Format the response
    const formattedResponse = `
${question}

Answer:
${result.answer || result.output || 'No answer provided.'}
    `.trim();

    res.status(200).json({ 
      message: formattedResponse
    });

  } catch (error) {
    console.error("Main execution error:", error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
}