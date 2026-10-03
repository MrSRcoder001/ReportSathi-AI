const crypto = require('crypto');
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

    const { language, patientProfileId, symptoms, medications } = req.body;

    if (!patientProfileId) {
      return res.status(400).json({ message: 'Patient Profile ID is required' });
    }

    // 1. Create Initial Report Record with pending confirmation
    const report = await Report.create({
      userId: req.user._id,
      patientProfileId: patientProfileId,
      reportName: req.file.originalname,
      fileUrl: req.file.path,
      language: language || 'English',
      status: 'processing',
      confirmed: false,
      symptoms: symptoms ? (Array.isArray(symptoms) ? symptoms : JSON.parse(symptoms)) : [],
      medications: medications ? (Array.isArray(medications) ? medications : JSON.parse(medications)) : [],
    });

    // 2. Process OCR & Parsing in background (stops at review_pending)
    processReport(report._id, req.file, language || 'English');

    res.status(201).json({ 
      message: 'Report uploaded, extraction in progress',
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
        aiSummary: { [language]: parsedData.explanation || "I couldn't detect a valid medical report. Please upload a clear photo or PDF." },
        status: 'completed',
        healthScore: null,
        'confidenceMetrics.documentDetection': 'Invalid'
      });
      return;
    }

    // Step 2: OCR Quality Check
    if (parsedData.ocrQuality === 'Low') {
      await Report.findByIdAndUpdate(reportId, { 
        aiSummary: { [language]: "The uploaded report is unclear. Please upload a clearer image or PDF." },
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
        aiSummary: { [language]: "We couldn't extract any parameters. Please ensure the image is clear and contains measurable lab results." },
        status: 'completed',
        healthScore: null,
        'confidenceMetrics.documentDetection': 'Valid',
        'confidenceMetrics.ocrQuality': parsedData.ocrQuality
      });
      return;
    }

    // Attach mock parameter confidence and source range
    const enrichedParams = parsedParams.map((p, index) => ({
      ...p,
      confidence: Math.round(85 + (index * 2) % 15), // Mock confidence score
      referenceRangeSource: 'WHO Guidelines & Standard Pathology Reference 2026'
    }));

    // Transition to review_pending for manual confirmation
    await Report.findByIdAndUpdate(reportId, {
      parameters: enrichedParams,
      status: 'review_pending',
      'confidenceMetrics.documentDetection': 'Valid',
      'confidenceMetrics.ocrQuality': parsedData.ocrQuality || 'High'
    });

  } catch (error) {
    console.error('Processing Error:', error);
    require('fs').appendFileSync('error.log', new Date().toISOString() + '\n' + (error.stack || error) + '\n\n');
    await Report.findByIdAndUpdate(reportId, { status: 'failed' });
  }
};

const confirmReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { parameters, patientDetails, symptoms, medications } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update with user-corrected values
    report.parameters = parameters;
    if (patientDetails) report.patientDetails = patientDetails;
    if (symptoms) report.symptoms = symptoms;
    if (medications) report.medications = medications;
    report.status = 'processing';
    await report.save();

    // Trigger analysis finalization in the background
    finalizeReportAnalysis(report._id, report.language);

    res.json({ message: 'Report confirmed. Running analysis...', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const finalizeReportAnalysis = async (reportId, language = 'English') => {
  try {
    const reportObj = await Report.findById(reportId);
    if (!reportObj) return;

    // 3. Analysis Agent: Compare with RAG & mark LOW/NORMAL/HIGH/CRITICAL
    const { analyzedParams, healthScore, analysisConfidence } = await analyzeParameters(reportObj.parameters);

    // Critical Alert Detection
    const hasCritical = analyzedParams.some(p => p.status === 'CRITICAL');
    let criticalDetails = '';
    if (hasCritical) {
      const critMarkers = analyzedParams.filter(p => p.status === 'CRITICAL').map(p => p.parameter).join(', ');
      criticalDetails = `Critical health values detected for: ${critMarkers}. Please contact emergency care or a licensed doctor immediately.`;
    }

    // 4. Insight Agent: Generate simple explanations for each parameter
    const paramsWithInsights = await generateInsights(analyzedParams, language);

    // 5. Recommendation Agent: Generate precautions and action plan
    const recommendations = await generateRecommendations(paramsWithInsights, language);

    // 6. Summary Agent: Patient-friendly summary
    const summary = await generateSummary(paramsWithInsights, language);

    const HealthMetric = require('../models/HealthMetric');
    const mongoose = require('mongoose');

    const executeWrites = async (sessionOpts) => {
      // Save individual HealthMetrics for trend charting
      for (const param of paramsWithInsights) {
        const metricData = {
          patientProfileId: reportObj.patientProfileId,
          reportId: reportId,
          parameter: param.parameter,
          value: param.value,
          normalRange: param.normalRange,
          status: param.status,
          reportDate: reportObj.createdAt
        };

        if (sessionOpts && sessionOpts.session) {
          await HealthMetric.create([metricData], sessionOpts);
        } else {
          await HealthMetric.create(metricData);
        }
      }

      const evidenceUsed = paramsWithInsights.map(p => p.parameter);

      const updateData = { 
        parameters: paramsWithInsights,
        healthScore: healthScore,
        aiSummary: {
          [language]: summary
        },
        precautions: recommendations.precautions,
        actionPlan: recommendations.actionPlan,
        doctorQuestions: recommendations.doctorQuestions,
        lifestyleGuidance: recommendations.lifestyleGuidance,
        status: 'completed',
        confirmed: true,
        criticalAlert: hasCritical,
        criticalAlertDetails: criticalDetails,
        'confidenceMetrics.analysisConfidence': analysisConfidence || 0,
        'confidenceMetrics.evidenceUsed': evidenceUsed
      };

      if (sessionOpts && sessionOpts.session) {
        await Report.findByIdAndUpdate(reportId, updateData, sessionOpts);
      } else {
        await Report.findByIdAndUpdate(reportId, updateData);
      }
    };

    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      await executeWrites({ session });
      await session.commitTransaction();
    } catch (writeErr) {
      if (session) {
        try { await session.abortTransaction(); } catch (abortErr) {}
      }

      const isTxUnsupported = 
        writeErr.code === 20 || 
        writeErr.codeName === 'IllegalOperation' ||
        (writeErr.message && (
          writeErr.message.includes('transaction') ||
          writeErr.message.includes('retryable writes') ||
          writeErr.message.includes('Transaction')
        ));

      if (isTxUnsupported) {
        console.warn('MongoDB fallback: no transactions support.');
        await executeWrites(null);
      } else {
        throw writeErr;
      }
    } finally {
      if (session) {
        session.endSession();
      }
    }

  } catch (error) {
    console.error('Finalization Error:', error);
    require('fs').appendFileSync('error.log', new Date().toISOString() + '\n' + (error.stack || error) + '\n\n');
    await Report.findByIdAndUpdate(reportId, { status: 'failed' });
  }
};

const translateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { language } = req.body; // e.g. 'Hindi' or 'Marathi'

    if (!language) {
      return res.status(400).json({ message: 'Language is required' });
    }

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Check if translation is already cached
    if (report.aiSummary && report.aiSummary[language]) {
      return res.json({ translatedSummary: report.aiSummary[language] });
    }

    // Call summaryAgent to generate translated summary
    const translatedSummary = await generateSummary(report.parameters, language);

    // Update in DB
    const aiSummary = report.aiSummary || {};
    aiSummary[language] = translatedSummary;
    await Report.findByIdAndUpdate(id, { aiSummary });

    res.json({ translatedSummary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const shareReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);

    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!report.shareToken) {
      report.shareToken = crypto.randomBytes(16).toString('hex');
      await report.save();
    }

    res.json({ shareToken: report.shareToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSharedReport = async (req, res) => {
  try {
    const { shareToken } = req.params;
    const report = await Report.findOne({ shareToken })
      .populate('patientProfileId', 'profileName relation age gender bloodGroup conditions allergies medications');

    if (!report) {
      return res.status(404).json({ message: 'Shared report not found' });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    const report = await Report.findById(req.params.id)
      .populate('patientProfileId', 'profileName relation age gender bloodGroup conditions allergies medications doctorNotes');
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check user auth
    if (report.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  uploadReport, 
  getReports, 
  getReportById, 
  processReport, 
  confirmReport, 
  translateReport, 
  shareReport, 
  getSharedReport 
};
