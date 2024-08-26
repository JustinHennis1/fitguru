import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";;
import dotenv from "dotenv";


dotenv.config({ path: '../../.env.local' });

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  modelName: "embedding-001",
});

const pc = new Pinecone({
  apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    const { videoUrl } = req.body;
    //console.log("VideoUrl: ", videoUrl);
  
    try {
  
      // Check if the video is already in the vector store
      const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        namespace: "HealthAndFitness",
        pineconeIndex: pc.Index(process.env.NEXT_PUBLIC_PINECONE_INDEX_NAME),
      });
  
      // Load and process the video
      const loader = YoutubeLoader.createFromUrl(videoUrl, { addVideoInfo: true });
      const videoData = await loader.load();
      
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const splitDocs = await textSplitter.splitDocuments(videoData);
     
      // Add new documents to the vector store
      await vectorStore.addDocuments(splitDocs);
  
      console.log("Vector store updated successfully.");
     
      res.status(200).json({ 
        message: "Video processed successfully",
      });
    } catch (error) {
      console.error("Error processing video:", error);
      res.status(500).json({ error: 'Error processing video' });
    }
  }

