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
 * Call Groq Cloud API for intelligent case analysis using the 7-Vector Judicial Matrix
 */
async function callGroqAI(caseDetails) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const systemPrompt = `You are an expert AI Judicial Case Prioritization Assistant for the High Court of Judicature at Madras & Tamil Nadu District Courts. Evaluate legal case parameters against the 7-Vector Judicial Matrix:
Vector 1 (Vulnerability): Age >= 60/75, Terminally Ill, PwD, Minors, Indigent Suits.
Vector 2 (Detention/Liberty): Judicial Custody, Undertrial Detention Days (BNSS Sec 479 half-sentence rule), Jail Medical Emergency.
Vector 3 (Offense Gravity): POCSO, Domestic Violence, IPC 302/376, SC/ST Act, Capital/Life offenses.
Vector 4 (Irreparable Harm): Emergency Injunction, Demolition/Eviction Stay, Habeas Corpus, Urgent Bail.
Vector 5 (Pendency Arrears): Case Age > 1yr / 5yr / 10yr backlog reduction targets.
Vector 6 (Trial Stage): Final Arguments stage (prioritize disposal) vs Prosecution Evidence.
Vector 7 (Commercial Valuation): High stake commercial suits.

Output ONLY a raw JSON object without markdown formatting or extra text.

Target JSON schema:
{
  "priority": "High" | "Medium" | "Low",
  "priority_score": integer between 0 and 100,
  "predicted_delay": integer estimated days of delay until next hearing,
  "reasons": ["Concise Judicial Reason 1 (prefix with Vector code e.g. V1, V2, V3)", "Concise Reason 2"]
}`;

  const userPrompt = `Evaluate this court case for scheduling priority and hearing delay:
- Bench / Court: ${caseDetails.bench || 'Madras High Court'}
- Case Title: ${caseDetails.title || 'N/A'}
- Case Type & Filing Type: ${caseDetails.case_type || 'N/A'} (${caseDetails.filing_type || 'Main Case'})
- Legal Act & Section: ${caseDetails.legal_act || 'N/A'} - Sec ${caseDetails.legal_section || 'N/A'}
- Petitioner Details: ${caseDetails.petitioner_name || 'N/A'} (Age: ${caseDetails.petitioner_age || 'N/A'}, Senior Citizen: ${caseDetails.is_senior_citizen ? 'YES' : 'NO'}, PwD: ${caseDetails.is_differently_abled ? 'YES' : 'NO'}, Terminally Ill: ${caseDetails.is_terminally_ill ? 'YES' : 'NO'})
- Respondent Details: ${caseDetails.respondent_name || 'N/A'}
- Custody / Liberty Status: ${caseDetails.custody_status || 'N/A'} (Detention Duration: ${caseDetails.detention_days || 0} Days)
- Police Station & FIR: ${caseDetails.police_station || 'N/A'} - FIR No: ${caseDetails.fir_number || 'N/A'}/${caseDetails.fir_year || 'N/A'}
- Trial Stage: ${caseDetails.trial_stage || 'Filing & Scrutiny'}
- Subject Matter Valuation: ₹${caseDetails.valuation_amount || 0}
- Filing Date: ${caseDetails.filing_date || 'N/A'}
- Case Summary & Facts: ${caseDetails.description || 'N/A'}`;

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
    console.warn(`[Groq AI Warning] Request failed: ${err.message}. Falling back to 7-Vector local heuristic engine.`);
    return null;
  }
}

/**
 * Local 7-Vector Heuristic Fallback Engine
 */
function runMockAI(caseDetails) {
  const title = (caseDetails.title || '').toLowerCase();
  const description = (caseDetails.description || '').toLowerCase();
  const caseType = (caseDetails.case_type || '').toLowerCase();
  const filingType = (caseDetails.filing_type || '').toLowerCase();
  const legalAct = (caseDetails.legal_act || '').toLowerCase();
  const legalSection = (caseDetails.legal_section || '').toLowerCase();
  const custodyStatus = caseDetails.custody_status || 'N/A';
  const detentionDays = parseInt(caseDetails.detention_days || 0, 10);
  const petitionerAge = parseInt(caseDetails.petitioner_age || 35, 10);
  const isSeniorCitizen = Boolean(caseDetails.is_senior_citizen || petitionerAge >= 60);
  const isDifferentlyAbled = Boolean(caseDetails.is_differently_abled);
  const isTerminallyIll = Boolean(caseDetails.is_terminally_ill);
  const trialStage = caseDetails.trial_stage || 'Filing & Scrutiny';
  const valuation = parseFloat(caseDetails.valuation_amount || 0);

  let priorityScore = 40;
  let predictedDelay = 90;
  const reasons = [];

  // V1 Litigant Vulnerability
  if (isTerminallyIll || description.includes('terminal') || description.includes('cancer')) {
    priorityScore += 35;
    predictedDelay -= 45;
    reasons.push('V1: Terminally Ill Litigant / Severe Health Condition');
  } else if (petitionerAge >= 75) {
    priorityScore += 30;
    predictedDelay -= 35;
    reasons.push(`V1: Super Senior Citizen Litigant (Age ${petitionerAge})`);
  } else if (isSeniorCitizen) {
    priorityScore += 20;
    predictedDelay -= 25;
    reasons.push(`V1: Senior Citizen Litigant (Age ${petitionerAge})`);
  }

  if (isDifferentlyAbled) {
    priorityScore += 20;
    predictedDelay -= 20;
    reasons.push('V1: Differently Abled Person (PwD Protection)');
  }

  // V2 Detention / Liberty
  if (custodyStatus === 'In Judicial Custody') {
    priorityScore += 30;
    predictedDelay -= 40;
    reasons.push(`V2: Accused in Judicial Custody (${detentionDays} Days in Jail)`);
    if (detentionDays > 180) {
      priorityScore += 10;
      reasons.push('V2: BNSS Sec 479 Extended Undertrial Custody Flag');
    }
  }

  // V3 Offense Gravity
  if (legalAct.includes('pocso') || description.includes('pocso') || description.includes('minor')) {
    priorityScore += 30;
    predictedDelay -= 30;
    reasons.push('V3: POCSO Act / Protection of Children Special Fast-Track');
  } else if (legalAct.includes('domestic violence') || description.includes('domestic violence') || legalSection.includes('125')) {
    priorityScore += 25;
    predictedDelay -= 25;
    reasons.push('V3: Domestic Violence / Spousal Maintenance Fast-Track');
  } else if (legalSection.includes('302') || legalSection.includes('307') || legalSection.includes('376')) {
    priorityScore += 20;
    predictedDelay -= 20;
    reasons.push(`V3: Serious Offense Charged (Section ${legalSection})`);
  }

  // V4 Irreparable Harm
  if (filingType.includes('bail') || title.includes('bail')) {
    priorityScore += 25;
    predictedDelay -= 35;
    reasons.push('V4: Urgent Liberty / Bail Application');
  } else if (description.includes('demolition') || description.includes('eviction') || description.includes('stay')) {
    priorityScore += 25;
    predictedDelay -= 30;
    reasons.push('V4: Emergency Injunction / Threat of Irreparable Harm');
  }

  // V5 Case Age
  if (caseDetails.filing_date) {
    const filingDate = new Date(caseDetails.filing_date);
    const diffDays = Math.ceil(Math.abs(new Date() - filingDate) / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      priorityScore += 25;
      reasons.push(`V5: Pendency Arrears Priority (${diffDays} Days Pending)`);
    }
  }

  // V6 Trial Stage
  if (trialStage === 'Final Arguments') {
    priorityScore += 25;
    predictedDelay -= 40;
    reasons.push('V6: Final Arguments Stage (Targeted for Immediate Disposal)');
  }

  // V7 Commercial Valuation
  if (valuation >= 10000000) {
    priorityScore += 15;
    reasons.push(`V7: Commercial Court High Stake Claim (₹${(valuation/100000).toFixed(1)} Lakhs)`);
  }

  priorityScore = Math.min(100, Math.max(0, priorityScore));
  predictedDelay = Math.max(7, Math.round(predictedDelay));

  let priority = 'Medium';
  if (priorityScore >= 75) priority = 'High';
  else if (priorityScore <= 35) priority = 'Low';

  if (reasons.length === 0) {
    reasons.push('Standard procedural queue priority');
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
