const axios = require('axios');

const generateInsights = async (parameters, language = 'English') => {
  if (!parameters || parameters.length === 0) return parameters;

  try {
    const prompt = `
      You are MedExplain AI, an intelligent medical report interpreter.
      Your primary mission is to help ordinary people understand their medical reports in simple language while remaining truthful and evidence-based.
      
      Step 5 - Explanation:
      Explain every finding in plain, non-medical language. Explain difficult medical words using everyday examples. 
      DO NOT diagnose. DO NOT assume a disease.
      Example: "Your hemoglobin is below the laboratory's reference range. Hemoglobin helps carry oxygen throughout the body. Lower levels may contribute to tiredness or weakness. This explanation is based only on the laboratory value and does not confirm the cause. Please discuss this result with your healthcare provider."

      Step 9 - Safety Rules:
      Never diagnose (e.g., Never say "You definitely have diabetes.").
      Never prescribe medicines. Never change prescribed medicines.
      
      Parameters: ${JSON.stringify(parameters.map(p => ({
        parameter: p.parameter,
        value: p.value,
        status: p.status
      })))}
      
      Output MUST be a JSON array of objects, with each object containing:
      - "parameter": The exact name of the parameter.
      - "insight": A simple explanation answering: What is it? Why is it important? What does the current value indicate? Write this as a short paragraph in simple language translated into ${language}. End with a non-diagnostic disclaimer if abnormal.
      
      ONLY OUTPUT VALID JSON. No markdown, no pre-text, no post-text.
      [
        {
          "parameter": "Hemoglobin",
          "insight": "Hemoglobin is a protein in red blood cells that carries oxygen. Your level is low... Please discuss this result with your healthcare provider."
        }
      ]
    `;

    const response = await axios.post(`${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/generate`, {
      model: process.env.AI_MODEL || 'llama3',
      prompt: prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.2 }
    });

    let insightsArray = [];
    try {
      insightsArray = JSON.parse(response.data.response);
    } catch (parseError) {
      console.warn("Failed to parse insight JSON. Raw response:", response.data.response);
      return parameters;
    }

    // Merge insights back into the parameters array
    const insightMap = {};
    insightsArray.forEach(item => {
      insightMap[item.parameter] = item.insight;
    });

    return parameters.map(p => ({
      ...p,
      insight: insightMap[p.parameter] || 'Explanation not available.'
    }));

  } catch (error) {
    console.error('Insight Agent Error:', error.message);
    return parameters.map(p => ({ ...p, insight: 'Explanation not available due to an error.' }));
  }
};

module.exports = { generateInsights };
