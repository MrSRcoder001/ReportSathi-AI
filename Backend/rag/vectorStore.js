const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Custom Ollama Embeddings to avoid Langchain v0.3 export issues
class CustomOllamaEmbeddings {
  constructor({ model, baseUrl }) {
    this.model = model || 'nomic-embed-text';
    this.baseUrl = baseUrl || 'http://localhost:11434';
  }
  
  async embedQuery(text) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/embeddings`, {
        model: this.model,
        prompt: text
      });
      return response.data.embedding;
    } catch (err) {
      console.error(`Embedding failed for text: ${text.substring(0,20)}...`);
      // Return a dummy zero vector if it fails
      return new Array(768).fill(0);
    }
  }
  
  async embedDocuments(texts) {
    return Promise.all(texts.map(text => this.embedQuery(text)));
  }
}

// Custom In-Memory Vector Store to avoid Langchain v0.3 export issues
class SimpleMemoryVectorStore {
  constructor(embeddings) {
    this.embeddings = embeddings;
    this.docs = [];
  }

  async addDocuments(documents) {
    const texts = documents.map(d => d.pageContent);
    const vectors = await this.embeddings.embedDocuments(texts);
    
    for (let i = 0; i < documents.length; i++) {
      this.docs.push({
        ...documents[i],
        vector: vectors[i]
      });
    }
  }

  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async similaritySearch(query, k = 2) {
    const queryVector = await this.embeddings.embedQuery(query);
    
    const scoredDocs = this.docs.map(doc => ({
      ...doc,
      score: this.cosineSimilarity(queryVector, doc.vector)
    }));

    // Sort descending by score
    scoredDocs.sort((a, b) => b.score - a.score);
    
    return scoredDocs.slice(0, k);
  }
}

let vectorStoreInstance = null;

const initVectorStore = async () => {
  if (vectorStoreInstance) return vectorStoreInstance;

  console.log('Initializing Vector Store from medicalData.json...');
  
  // Define embeddings (using custom Ollama embeddings)
  const embeddings = new CustomOllamaEmbeddings({
    model: 'nomic-embed-text', // Or 'llama3' depending on what is installed
    baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  });

  try {
    const dataPath = path.join(__dirname, '../knowledgeBase/medicalData.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    const docs = data.map(item => ({
      pageContent: `Parameter: ${item.parameter}\nCategory: ${item.category}\nNormal Range: ${item.normalRange} ${item.unit}\nExplanation: ${item.explanation}\nLow Meaning: ${item.lowMeaning}\nHigh Meaning: ${item.highMeaning}`,
      metadata: { parameter: item.parameter, category: item.category }
    }));

    const store = new SimpleMemoryVectorStore(embeddings);
    await store.addDocuments(docs);
    
    vectorStoreInstance = store;
    console.log(`Vector Store initialized with ${docs.length} medical parameters.`);
    return vectorStoreInstance;
  } catch (error) {
    console.error('Failed to initialize Vector Store:', error);
    return new SimpleMemoryVectorStore(embeddings); 
  }
};

const getVectorStore = async () => {
  if (!vectorStoreInstance) {
    return await initVectorStore();
  }
  return vectorStoreInstance;
};

module.exports = { getVectorStore, initVectorStore };
