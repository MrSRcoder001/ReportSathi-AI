const axios = require('axios');
const { getVectorStore } = require('../rag/vectorStore');

const askQuestion = async (question, report) => {
  const vectorStore = await getVectorStore();

  // Retrieve relevant medical knowledge based on the user's question
  const results = await vectorStore.similaritySearch(question, 2);
  const ragContext = results.map(r => r.pageContent).join('\n\n');

  // Stringify report parameters for context
  const reportData = JSON.stringify(report.parameters, null, 2);

  const prompt = `You are MedExplain AI, an intelligent medical assistant answering questions about a user's uploaded medical report.
Use ONLY the provided report data and retrieved medical knowledge.

Step 7 - User Questions:
If the answer cannot be supported by the report or medical knowledge, respond EXACTLY with: "The uploaded report does not contain enough information to answer that question."
NEVER speculate. NEVER guess.

Rules:
* Never diagnose.
* Never prescribe treatment.
* Never claim certainty.
* Explain in simple language.
* End with "Consult a healthcare professional."

User Question: ${question}

Patient Report Data:
${reportData}

Retrieved Medical Knowledge:
${ragContext}

Respond strictly with a JSON object containing a single key "answer" (string). Do not include markdown formatting.`;

  try {
    const response = await axios.post(`${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/generate`, {
      model: process.env.AI_MODEL || 'llama3',
      prompt: prompt,
      format: 'json',
      stream: false,
      options: { num_ctx: 2048, temperature: 0.2 }
    });

    const result = JSON.parse(response.data.response);
    return result.answer || "I could not generate an answer.";
  } catch (error) {
    console.warn('Chat Agent Error (Using Mock Fallback):', error.message);
    return "I am currently running in offline mock mode. Based on your mock report, your Hemoglobin is low (9.8 g/dL) and WBC is elevated (12500). Please consult a healthcare professional for an accurate diagnosis.";
  }
};

module.exports = { askQuestion };
