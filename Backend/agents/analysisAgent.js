const axios = require('axios');
const { getVectorStore } = require('../rag/vectorStore');

const analyzeParameters = async (parsedParameters) => {
  if (!parsedParameters || parsedParameters.length === 0) return { analyzedParams: [], healthScore: null, analysisConfidence: 0 };

  const vectorStore = await getVectorStore();
  const analyzedParams = [];
  let interpretableCount = 0;
  let abnormalCount = 0;

  for (const param of parsedParameters) {
    try {
      // 1. Retrieve knowledge for this parameter
      const results = await vectorStore.similaritySearch(param.parameter, 1);
      const context = results.length > 0 ? results[0].pageContent : "No reference found.";

      // 2. Ask LLM to analyze
      const prompt = `You are MedExplain AI, an intelligent medical report interpreter.
Your primary mission is NOT to diagnose diseases. Your mission is to help ordinary people understand their medical reports truthfully.

Step 4 - Medical Validation:
For the laboratory parameter provided below, verify if the parameter and value exist.
If any required information is missing, or if it cannot be interpreted safely, set status to "UNINTERPRETABLE" and explain: "This value cannot be interpreted because important information is missing." NEVER estimate.

Patient Parameter: ${param.parameter}
Patient Value: ${param.value}
Patient Unit: ${param.unit || 'Not provided'}
Patient Reference Range: ${param.normalRange || 'Not provided'}

Reference Knowledge:
${context}

Tasks:
1. Identify the normal range from the reference knowledge or patient reference range.
2. Compare the patient value to the normal range.
3. Determine the status strictly as one of: "LOW", "NORMAL", "HIGH", "CRITICAL", "UNKNOWN", or "UNINTERPRETABLE". Mark it "CRITICAL" if the value is extremely high or low, representing a serious clinical anomaly that requires urgent attention.
4. Provide a brief 1-sentence explanation. Do not diagnose.

Respond strictly with a JSON object. Do not include markdown formatting.
Keys: "normalRange" (string), "status" (string: LOW/NORMAL/HIGH/CRITICAL/UNKNOWN/UNINTERPRETABLE), "explanation" (string).`;

      const response = await axios.post(`${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/generate`, {
        model: process.env.AI_MODEL || 'llama3',
        prompt: prompt,
        format: 'json',
        stream: false,
        options: { num_ctx: 1024, temperature: 0.1 }
      });

      const analysis = JSON.parse(response.data.response);
      
      if (analysis.status !== 'UNINTERPRETABLE') {
        interpretableCount++;
      }
      
      if (analysis.status === 'LOW' || analysis.status === 'HIGH') {
        abnormalCount++;
      }

      analyzedParams.push({
        parameter: param.parameter,
        value: param.value,
        unit: param.unit || '',
        normalRange: analysis.normalRange || 'Unknown',
        status: analysis.status || 'UNKNOWN',
        explanation: analysis.explanation || ''
      });

    } catch (err) {
      console.warn(`Analysis failed for parameter ${param.parameter} (Using Mock Fallback):`, err.message);
      
      analyzedParams.push({
        parameter: param.parameter,
        value: param.value,
        unit: param.unit || '',
        normalRange: param.normalRange || 'Unknown',
        status: 'UNINTERPRETABLE',
        explanation: 'Analysis offline.'
      });
    }
  }

  const total = analyzedParams.length || 1;
  const analysisConfidence = Math.round((interpretableCount / total) * 100);
  
  // Calculate health score only for interpretable parameters
  const normalCount = interpretableCount - abnormalCount;
  const healthScore = interpretableCount > 0 ? Math.max(0, Math.round((normalCount / interpretableCount) * 100)) : null;

  return { analyzedParams, healthScore, analysisConfidence };
};

module.exports = { analyzeParameters };
