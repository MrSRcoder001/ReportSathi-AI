const axios = require('axios');

const generateRecommendations = async (parameters, language = 'English') => {
  const defaultRecommendations = {
    precautions: ["Maintain a balanced diet", "Stay hydrated", "Follow healthcare professional advice"],
    actionPlan: ["Review report carefully", "Save report for future comparison", "Discuss concerns with your doctor", "Continue regular checkups"],
    doctorQuestions: ["What do these results mean for my overall health?", "Should I make any lifestyle changes?", "When should I repeat these tests?"],
    lifestyleGuidance: ["Stay physically active", "Maintain healthy sleep habits", "Reduce stress"]
  };

  if (!parameters || parameters.length === 0) return defaultRecommendations;

  const abnormalParams = parameters.filter(p => p.status === 'LOW' || p.status === 'HIGH');
  
  // If everything is normal, provide general wellness guidance
  if (abnormalParams.length === 0) {
    return {
      ...defaultRecommendations,
      lifestyleGuidance: ["Keep up the good work! All tested parameters look normal.", ...defaultRecommendations.lifestyleGuidance]
    };
  }

  try {
    const prompt = `
      You are MedExplain AI, an intelligent medical report interpreter.
      Your primary mission is to help ordinary people understand their health report truthfully.
      The user has the following ABNORMAL parameters:
      ${JSON.stringify(abnormalParams.map(p => ({ parameter: p.parameter, status: p.status, value: p.value })))}

      Step 6 - User Language:
      Always explain in the user's preferred language (${language}). Avoid medical jargon.

      Step 10 - Trust First:
      Choose honesty over speculation. If evidence is insufficient, say so. Do not create fake confidence.

      CRITICAL SAFETY RULES:
      1. NEVER prescribe medication.
      2. NEVER recommend specific medical treatments or stopping treatments.
      3. NEVER diagnose diseases.
      4. Provide general precautions and lifestyle guidance only.
      
      Output MUST be a JSON object containing:
      - "precautions": Array of 3-5 strings (General precautions)
      - "actionPlan": Array of 3-5 strings (Simple next steps, e.g., "Discuss with your doctor")
      - "doctorQuestions": Array of 3-4 strings (Specific questions the user should ask their doctor based on these results)
      - "lifestyleGuidance": Array of 3-5 strings (General wellness tips related to these abnormalities)
      
      ONLY OUTPUT VALID JSON.
      {
        "precautions": ["..."],
        "actionPlan": ["..."],
        "doctorQuestions": ["..."],
        "lifestyleGuidance": ["..."]
      }
    `;

    const response = await axios.post(`${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/generate`, {
      model: process.env.AI_MODEL || 'llama3',
      prompt: prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.3 }
    });

    try {
      const result = JSON.parse(response.data.response);
      return {
        precautions: result.precautions || defaultRecommendations.precautions,
        actionPlan: result.actionPlan || defaultRecommendations.actionPlan,
        doctorQuestions: result.doctorQuestions || defaultRecommendations.doctorQuestions,
        lifestyleGuidance: result.lifestyleGuidance || defaultRecommendations.lifestyleGuidance,
      };
    } catch (parseError) {
      console.warn("Failed to parse recommendations JSON. Raw:", response.data.response);
      return defaultRecommendations;
    }

  } catch (error) {
    console.error('Recommendation Agent Error:', error.message);
    return defaultRecommendations;
  }
};

module.exports = { generateRecommendations };
