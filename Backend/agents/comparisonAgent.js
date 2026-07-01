const axios = require('axios');

const generateComparisonInsight = async (diffData) => {
  try {
    const prompt = `
      You are an expert AI medical assistant. I have two medical reports for the same patient.
      Below is the difference between the two reports.
      
      Diff Data: ${JSON.stringify(diffData, null, 2)}
      
      Write a highly encouraging and clinical comparison summary (max 3 sentences). 
      If parameters moved from HIGH/LOW to NORMAL, praise the improvement.
      If parameters moved from NORMAL to HIGH/LOW, politely warn the patient.
      Do not list every parameter. Just summarize the overall health trajectory.
    `;

    const response = await axios.post(`${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/generate`, {
      model: process.env.AI_MODEL || 'llama3',
      prompt: prompt,
      stream: false,
      options: { temperature: 0.3 }
    });

    return response.data.response;
  } catch (error) {
    console.warn('Comparison Agent Error (Using Mock Fallback):', error.message);
    
    // Check if there are improvements
    const improved = diffData.filter(d => d.statusChange && d.statusChange.includes('→ NORMAL'));
    if (improved.length > 0) {
      return `Great news! Several parameters like ${improved.map(i => i.parameter).join(', ')} have improved since your last report and are now back in the normal range. Keep up the good work!`;
    }
    return 'Your health parameters show some changes compared to the previous report. Please consult your healthcare provider to discuss these trends in detail.';
  }
};

module.exports = { generateComparisonInsight };
