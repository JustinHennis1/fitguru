import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone"; // Import PineconeStore
import { Pinecone } from "@pinecone-database/pinecone";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";
import readline from 'readline';

// Load environment variables
dotenv.config({ path: '../.env.local' });


// Initialize Gemini model
const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "gemini-pro",
  temperature: 0.7,
});

// Initialize Gemini embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001", // Use the appropriate embedding model
});

// Initialize Pinecone client
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
 });


// Function to load and process YouTube video transcript
async function loadAndProcessVideo(videoUrl) {
  try {
    // Load YouTube transcript
    const loader = YoutubeLoader.createFromUrl(videoUrl, { addVideoInfo: true });
    const videoData = await loader.load();

    // Split the transcript into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(videoData);
    console.log("Split Documents: ", splitDocs); // Log split documents

    // Create a vector store from the split documents using Pinecone
    console.log("Creating vector store in Pinecone...");
    const vectorStore = await PineconeStore.fromDocuments(splitDocs, embeddings, {
      namespace: "Lex Fridman",
      pineconeIndex: pc.Index(process.env.PINECONE_INDEX_NAME), // Specify your Pinecone index
    });
    console.log("Vector store created successfully."); // Confirm vector store creation

    // Create a retriever and log retrieved documents
    const retriever = vectorStore.asRetriever();
    // const retrievedDocs = await retriever.getRelevantDocuments({
    //   query: "What are the key points?", // Use an object with the query
    // });
    // console.log("Retrieved Documents:", retrievedDocs); // Log retrieved documents
    console.log("Retriever:", retriever);

    // Create a prompt template
    const prompt = ChatPromptTemplate.fromTemplate(`
      Answer the following question based on the context provided:
      Context: {context}
      Question: {input}
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
      console.log(`Question: ${question}`);
      //console.log('Full response:', JSON.stringify(response, null, 2));
      
      if (response.answer) {
        console.log(`Answer: ${response.answer}`);
      } else if (response.output) {
        console.log(`Answer: ${response.output}`);
      } else if (typeof response === 'string') {
        console.log(`Answer: ${response}`);
      } else {
        console.log('Unexpected response structure. Please check the logged full response.');
      }
    } catch (error) {
      console.error("Error asking question:", error);
      console.error(error.stack);
    }
  }

// Main execution
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askUserInput = (query) => new Promise((resolve) => rl.question(query, resolve));

  const url = await askUserInput('What is the video URL? ');
  const question = await askUserInput('What is your question? ');
  rl.close();

  // YouTube video URL
  const videoUrl = url;

  try {
    console.log("Loading and processing video...");
    const chain = await loadAndProcessVideo(videoUrl);
    console.log("Video processed. Ready for questions.");

    // Use the askQuestion function to query the chain
    await askQuestion(chain, question);

  } catch (error) {
    console.error("Main execution error:", error);
  }
}

main();