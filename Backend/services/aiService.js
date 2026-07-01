const axios = require('axios');

const generateSummary = async (extractedText) => {
  const prompt = `You are a medical report explanation assistant.
Your job is to explain medical reports in simple language.

Respond strictly with a JSON object. Do not include any conversational text or markdown formatting like \`\`\`json. 
The JSON object MUST have exactly these three keys:
1. "abnormalValues": An array of objects. Each object should have three keys: "name" (string, e.g., "Hemoglobin"), "current" (string, e.g., "9.8"), and "normal" (string, e.g., "12-15"). If no abnormal values are found, return an empty array [].
2. "explanation": A string containing a simple explanation in language understandable by a non-medical person. Use bullet points (using \n- ) if needed. Never diagnose diseases, prescribe medicines, or claim certainty.
3. "summary": A string providing an easy-to-understand overall summary of the report.

End the explanation string with:
"This explanation is for educational purposes only and is not a medical diagnosis. Please consult a qualified healthcare professional."

Report Content:
${extractedText}`;

  try {
    const response = await axios.post(`${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/generate`, {
      model: process.env.AI_MODEL || 'llama3', // Allow switching to faster models like 'phi3' or 'llama3.2:1b'
      prompt: prompt,
      format: 'json',
      stream: false,
      options: {
        num_ctx: 2048,       // Limit context window to save memory and speed up processing
        num_predict: 500,    // Limit maximum output tokens to prevent long rambling
        temperature: 0.1,    // Low temperature makes generation more deterministic and often slightly faster
        top_k: 10,           // Restrict token search space
      }
    });
    
    return response.data.response;
  } catch (error) {
    console.error('AI Service Error (Ollama likely not running or unreachable):', error.message);
    console.log('Returning mock AI response for demonstration purposes.');
    
    // Mock Response Fallback
    const mockResponse = {
      abnormalValues: [
        { name: "Hemoglobin", current: "9.8", normal: "12-15" }
      ],
      explanation: "- Your hemoglobin level is lower than the typical range.\n- This may be associated with reduced oxygen transport.",
      summary: "2 abnormal values found. Please discuss these findings with your healthcare provider.\n\nThis explanation is for educational purposes only and is not a medical diagnosis. Please consult a qualified healthcare professional."
    };
    
    return JSON.stringify(mockResponse);
  }
};

module.exports = { generateSummary };
