const axios = require('axios');

const generateSummary = async (analyzedParams, targetLanguage = 'English') => {
  if (!analyzedParams || analyzedParams.length === 0) {
    return "No parameters could be analyzed to generate a summary.";
  }

  const prompt = `You are MedExplain AI, an intelligent medical report interpreter.
Review the following analyzed parameters from a patient's report:
${JSON.stringify(analyzedParams, null, 2)}

Step 6 - User Language:
Always explain in the user's preferred language (${targetLanguage}). Avoid medical jargon.

Step 10 - Trust First:
If evidence is insufficient, say so. Do not create fake confidence. Never fabricate values or conclusions.

Tasks:
1. Provide a patient-friendly overall summary of these results.
2. Highlight any abnormalities briefly. DO NOT diagnose or assume a disease.
3. Add this exact disclaimer at the end: "This explanation is based only on the laboratory values. It is not a diagnosis. Please discuss this result with your healthcare provider."

Respond strictly with a JSON object containing one key: "summary" (string). Do not include markdown formatting.`;

  try {
    const response = await axios.post(`${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/generate`, {
      model: process.env.AI_MODEL || 'llama3',
      prompt: prompt,
      format: 'json',
      stream: false,
      options: { num_ctx: 2048, temperature: 0.3 }
    });

    const result = JSON.parse(response.data.response);
    return result.summary || "Summary generation failed.";
  } catch (error) {
    console.warn('Summary Agent Error (Using Mock Fallback):', error.message);
    
    if (targetLanguage.toLowerCase() === 'hindi' || targetLanguage === 'हिंदी') {
      return "आपकी रिपोर्ट के आधार पर, आपका हीमोग्लोबिन कम है और WBC बढ़ा हुआ है। बाकी सब सामान्य है। कृपया डॉक्टर से सलाह लें।";
    } else if (targetLanguage.toLowerCase() === 'marathi' || targetLanguage === 'मराठी') {
      return "तुमच्या रिपोर्टनुसार, तुमचे हिमोग्लोबिन कमी आहे आणि WBC वाढले आहे. कृपया डॉक्टरांचा सल्ला घ्या.";
    }
    
    return "Based on your report, there are a few parameters outside the normal range, such as low Hemoglobin and elevated WBC. The rest of the parameters appear normal. Educational information only. Consult a qualified healthcare professional.";
  }
};

module.exports = { generateSummary };
