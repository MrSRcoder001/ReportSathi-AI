const Report = require('../models/Report');
const { extractText } = require('../services/ocrService');
const { extractParameters } = require('../agents/parserAgent');
const { analyzeParameters } = require('../agents/analysisAgent');
const { generateSummary } = require('../agents/summaryAgent');
const { generateInsights } = require('../agents/insightAgent');
const { generateRecommendations } = require('../agents/recommendationAgent');

const uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const { language, patientProfileId } = req.body;

    if (!patientProfileId) {
      return res.status(400).json({ message: 'Patient Profile ID is required' });
    }

    // 1. Create Initial Report Record
    const report = await Report.create({
      userId: req.user._id,
      patientProfileId: patientProfileId,
      reportName: req.file.originalname,
      fileUrl: req.file.path,
      language: language || 'English',
      status: 'processing'
    });

    // 2. Process OCR (In background)
    processReport(report._id, req.file, language);

    res.status(201).json({ 
      message: 'Report uploaded successfully, processing started',
      reportId: report._id 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const processReport = async (reportId, file, language = 'English') => {
  try {
    // 1. OCR Extraction
    const extractedText = await extractText(file);
    await Report.findByIdAndUpdate(reportId, { extractedText });

    // 2. Parser Agent: Extract JSON parameters and validate document type
    const parsedData = await extractParameters(extractedText);

    // Save Patient Details
    if (parsedData.patientDetails) {
      await Report.findByIdAndUpdate(reportId, { patientDetails: parsedData.patientDetails });
    }

    // Step 1: Document Validation
    if (parsedData.isMedicalReport === false) {
      await Report.findByIdAndUpdate(reportId, { 
        aiSummary: parsedData.explanation || "I couldn't detect a valid medical report in the uploaded image. Please upload a clear photo or PDF of your medical report.",
        status: 'completed',
        healthScore: null,
        'confidenceMetrics.documentDetection': 'Invalid'
      });
      return;
    }

    // Step 2: OCR Confidence Check
    if (parsedData.ocrQuality === 'Low') {
      await Report.findByIdAndUpdate(reportId, { 
        aiSummary: "The uploaded report is unclear. Some important text could not be read accurately. Please upload a clearer image or PDF.",
        status: 'completed',
        healthScore: null,
        'confidenceMetrics.documentDetection': 'Valid',
        'confidenceMetrics.ocrQuality': 'Low'
      });
      return;
    }

    const parsedParams = parsedData.parameters;
    
    if (!parsedParams || parsedParams.length === 0) {
      await Report.findByIdAndUpdate(reportId, { 
        aiSummary: "We couldn't extract any recognizable medical parameters from this document. Please ensure the image is clear and contains measurable lab results.",
        status: 'completed',
        healthScore: null,
        'confidenceMetrics.documentDetection': 'Valid',
        'confidenceMetrics.ocrQuality': parsedData.ocrQuality
      });
      return;
    }

    // 3. Analysis Agent: Compare with RAG & mark LOW/NORMAL/HIGH
    const { analyzedParams, healthScore, analysisConfidence } = await analyzeParameters(parsedParams);

    // 4. Insight Agent: Generate simple explanations for each parameter
    const paramsWithInsights = await generateInsights(analyzedParams, language);

    // 5. Recommendation Agent: Generate precautions and action plan
    const recommendations = await generateRecommendations(paramsWithInsights, language);

    // 6. Summary Agent: Multi-lingual patient-friendly summary
    const summary = await generateSummary(paramsWithInsights, language);

    const reportObj = await Report.findById(reportId);

    // Save individual HealthMetrics
    for (const param of paramsWithInsights) {
      await require('../models/HealthMetric').create({
        patientProfileId: reportObj.patientProfileId,
        reportId: reportId,
        parameter: param.parameter,
        value: param.value,
        normalRange: param.normalRange,
        status: param.status,
        reportDate: reportObj.createdAt
      });
    }

    // Determine Evidence Used
    const evidenceUsed = paramsWithInsights.map(p => p.parameter);

    // 7. Update Report with all AI generated data
    await Report.findByIdAndUpdate(reportId, { 
      parameters: paramsWithInsights,
      healthScore: healthScore,
      aiSummary: summary,
      precautions: recommendations.precautions,
      actionPlan: recommendations.actionPlan,
      doctorQuestions: recommendations.doctorQuestions,
      lifestyleGuidance: recommendations.lifestyleGuidance,
      status: 'completed',
      confidenceMetrics: {
        documentDetection: 'Valid',
        ocrQuality: parsedData.ocrQuality || 'Unknown',
        analysisConfidence: analysisConfidence || 0,
        evidenceUsed: evidenceUsed
      }
    });
  } catch (error) {
    console.error('Processing Error:', error);
    await Report.findByIdAndUpdate(reportId, { status: 'failed' });
  }
};

const getReports = async (req, res) => {
  try {
    const { profileId } = req.query;
    const query = { userId: req.user._id };
    if (profileId) {
      query.patientProfileId = profileId;
    }
    const reports = await Report.find(query).sort({ createdAt: -1 }).populate('patientProfileId', 'profileName relation');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('patientProfileId', 'profileName relation age gender bloodGroup');
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if user owns the report
    if (report.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadReport, getReports, getReportById };
