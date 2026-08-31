require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

/**
 * Call Groq Cloud API for intelligent case analysis
 */
async function callGroqAI(caseDetails) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const systemPrompt = `You are an AI Judicial Case Prioritization Assistant for Indian District Courts (SIH1280). Analyze legal case parameters and output ONLY a raw JSON object without markdown formatting or extra text.

Target JSON schema:
{
  "priority": "High" | "Medium" | "Low",
  "priority_score": integer between 0 and 100,
  "predicted_delay": integer estimated days of delay until next hearing,
  "reasons": ["Concise reason 1", "Concise reason 2"]
}`;

  const userPrompt = `Evaluate the following court case for scheduling priority and hearing delay:
- Case Title: ${caseDetails.title || 'N/A'}
- Case Type: ${caseDetails.case_type || 'N/A'}
- Filing Date: ${caseDetails.filing_date || 'N/A'}
- Description: ${caseDetails.description || 'N/A'}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API returned HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!rawContent) throw new Error('Empty response content from Groq');

    let textToParse = rawContent.trim();
    if (textToParse.includes('</think>')) {
      textToParse = textToParse.split('</think>').pop().trim();
    }
    if (textToParse.startsWith('```json')) {
      textToParse = textToParse.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    } else if (textToParse.startsWith('```')) {
      textToParse = textToParse.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    }

    const parsed = JSON.parse(textToParse);
    
    // Normalize priority category string
    let normalizedPriority = 'Medium';
    if (parsed.priority) {
      const p = String(parsed.priority).toLowerCase();
      if (p.includes('high') || p.includes('urgent')) normalizedPriority = 'High';
      else if (p.includes('low')) normalizedPriority = 'Low';
      else normalizedPriority = 'Medium';
    }

    return {
      priority: normalizedPriority,
      priority_score: typeof parsed.priority_score === 'number' ? Math.min(100, Math.max(0, Math.round(parsed.priority_score))) : 50,
      predicted_delay: typeof parsed.predicted_delay === 'number' ? Math.max(0, Math.round(parsed.predicted_delay)) : 90,
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : (parsed.reason ? [parsed.reason] : ['Evaluated by Groq LLM'])
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[Groq AI Warning] Request failed: ${err.message}. Falling back to local heuristic engine.`);
    return null;
  }
}

/**
 * Local Heuristic Fallback Engine
 */
function runMockAI(caseDetails) {
  const title = (caseDetails.title || '').toLowerCase();
  const description = (caseDetails.description || '').toLowerCase();
  const caseType = (caseDetails.case_type || '').toLowerCase();
  const filingDateStr = caseDetails.filing_date;

  let priority = 'Medium';
  let priorityScore = 55;
  let predictedDelay = 90;
  const reasons = [];

  if (filingDateStr) {
    const filingDate = new Date(filingDateStr);
    const today = new Date();
    const diffTime = Math.abs(today - filingDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      priorityScore += 20;
      predictedDelay += 60;
      reasons.push(`Pending for ${diffDays} Days`);
    } else if (diffDays > 180) {
      priorityScore += 10;
      predictedDelay += 30;
      reasons.push(`Pending for ${diffDays} Days`);
    }
  }

  if (caseType === 'criminal') {
    priorityScore += 15;
    predictedDelay -= 20;
    reasons.push('Serious Criminal Case');
  } else if (caseType === 'family') {
    priorityScore += 10;
    predictedDelay -= 15;
    reasons.push('Family Court Dispute');
  } else if (caseType === 'commercial') {
    priorityScore += 5;
    predictedDelay += 10;
    reasons.push('Commercial Contract Dispute');
  }

  if (description.includes('senior') || description.includes('elderly') || title.includes('senior')) {
    priorityScore += 25;
    predictedDelay -= 25;
    reasons.push('Senior Citizen Involved');
  }

  if (description.includes('child') || description.includes('minor') || description.includes('custody')) {
    priorityScore += 15;
    predictedDelay -= 10;
    reasons.push('Minor / Custody Dispute');
  }

  if (description.includes('urgent') || title.includes('interim') || description.includes('interim')) {
    priorityScore += 15;
    reasons.push('Urgent Interim Relief Request');
  }

  if (priorityScore > 100) priorityScore = 100;
  if (priorityScore < 0) priorityScore = 0;

  if (priorityScore >= 75) {
    priority = 'High';
  } else if (priorityScore <= 35) {
    priority = 'Low';
  } else {
    priority = 'Medium';
  }

  if (predictedDelay < 0) predictedDelay = 15;

  if (reasons.length === 0) {
    reasons.push('Standard procedural backlog');
    reasons.push('Normal queue priority');
  }

  return {
    priority,
    priority_score: priorityScore,
    predicted_delay: predictedDelay,
    reasons
  };
}

async function getCasePrediction(caseDetails) {
  const groqResult = await callGroqAI(caseDetails);
  if (groqResult) {
    return groqResult;
  }
  return runMockAI(caseDetails);
}

app.post('/predictPriority', async (req, res) => {
  console.log('Received priority prediction request for case:', req.body.title || req.body.case_number);
  const result = await getCasePrediction(req.body);
  res.json({
    priority: result.priority,
    priority_score: result.priority_score,
    predicted_delay: result.predicted_delay,
    reason: result.reasons
  });
});

app.post('/predictDelay', async (req, res) => {
  console.log('Received delay prediction request for case:', req.body.title || req.body.case_number);
  const result = await getCasePrediction(req.body.body || req.body);
  res.json({
    priority: result.priority,
    priority_score: result.priority_score,
    predicted_delay: result.predicted_delay,
    reason: result.reasons
  });
});

app.listen(PORT, () => {
  console.log(`AI Agent API running on port ${PORT} (Groq LLM + Local Heuristic Fallback Enabled)`);
});
