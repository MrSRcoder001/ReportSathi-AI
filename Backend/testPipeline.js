require('dotenv').config();
const { extractParameters } = require('./agents/parserAgent');
const { analyzeParameters } = require('./agents/analysisAgent');
const { generateSummary } = require('./agents/summaryAgent');
const { askQuestion } = require('./agents/chatAgent');
const { initVectorStore } = require('./rag/vectorStore');

async function runTests() {
  console.log('--- Starting Pipeline Test ---');

  // Initialize Vector Store
  await initVectorStore();

  const mockExtractedText = `
    Patient Name: John Doe
    Hemoglobin: 9.8 g/dL
    WBC: 12000 cells/mcL
    Platelets: 180000 cells/mcL
  `;

  try {
    console.log('\n1. Testing Parser Agent...');
    const parsed = await extractParameters(mockExtractedText);
    console.log('Parsed:', parsed);

    console.log('\n2. Testing Analysis Agent...');
    const analysis = await analyzeParameters(parsed.parameters);
    console.log('Analysis:', JSON.stringify(analysis, null, 2));

    console.log('\n3. Testing Summary Agent (Marathi)...');
    const summary = await generateSummary(analysis.analyzedParams, 'Marathi');
    console.log('Summary (Marathi):', summary);

    console.log('\n4. Testing Chat Agent...');
    const mockReport = { parameters: analysis.analyzedParams };
    const answer = await askQuestion('Why is my hemoglobin low?', mockReport);
    console.log('Chat Answer:', answer);

    console.log('\n--- Pipeline Test Complete ---');
  } catch (error) {
    console.error('\nPipeline Test Failed:', error);
  }
}

runTests();
