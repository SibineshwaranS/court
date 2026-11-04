// Service to interact with the External AI Agent API
require('dotenv').config();

const AI_AGENT_URL = process.env.AI_AGENT_URL || 'http://localhost:5001';

// Local Fallback Algorithm using the 7-Vector Judicial Matrix
function localAIFallback(caseData) {
  console.log('[AI Service] Executing 7-Vector Judicial Matrix Fallback Engine');
  const title = (caseData.title || '').toLowerCase();
  const description = (caseData.description || '').toLowerCase();
  const caseType = (caseData.case_type || '').toLowerCase();
  const filingType = (caseData.filing_type || '').toLowerCase();
  const legalAct = (caseData.legal_act || '').toLowerCase();
  const legalSection = (caseData.legal_section || '').toLowerCase();
  const custodyStatus = caseData.custody_status || 'N/A';
  const detentionDays = parseInt(caseData.detention_days || 0, 10);
  const petitionerAge = parseInt(caseData.petitioner_age || 35, 10);
  const isSeniorCitizen = Boolean(caseData.is_senior_citizen || petitionerAge >= 60);
  const isDifferentlyAbled = Boolean(caseData.is_differently_abled);
  const isTerminallyIll = Boolean(caseData.is_terminally_ill);
  const trialStage = caseData.trial_stage || 'Filing & Scrutiny';
  const valuation = parseFloat(caseData.valuation_amount || 0);

  let priorityScore = 40; // Base score
  let predictedDelay = 90; // Default days
  const reasons = [];

  // Vector 1: Litigant Vulnerability & Health Factors
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

  // Vector 2: Detention, Liberty & BNSS Sec 479 Statutory Half-Sentence Rule
  if (custodyStatus === 'In Judicial Custody') {
    priorityScore += 30;
    predictedDelay -= 40;
    reasons.push(`V2: Accused in Judicial Custody (${detentionDays} Days in Jail)`);
    if (detentionDays > 180) {
      priorityScore += 10;
      reasons.push('V2: BNSS Sec 479 Extended Undertrial Custody Flag');
    }
  }

  // Vector 3: Offense Gravity & Special Protection Acts
  if (legalAct.includes('pocso') || description.includes('pocso') || description.includes('minor')) {
    priorityScore += 30;
    predictedDelay -= 30;
    reasons.push('V3: POCSO Act / Protection of Children Special Fast-Track');
  } else if (legalAct.includes('domestic violence') || description.includes('domestic violence') || legalSection.includes('125')) {
    priorityScore += 25;
    predictedDelay -= 25;
    reasons.push('V3: Domestic Violence / Spousal Maintenance Fast-Track');
  } else if (legalAct.includes('sc/st') || description.includes('atrocities')) {
    priorityScore += 20;
    predictedDelay -= 20;
    reasons.push('V3: SC/ST Prevention of Atrocities Statutory Priority');
  } else if (legalSection.includes('302') || legalSection.includes('307') || legalSection.includes('376')) {
    priorityScore += 20;
    predictedDelay -= 20;
    reasons.push(`V3: Serious Offense Charged (Section ${legalSection})`);
  }

  // Vector 4: Irreparable Loss & Emergency Relief Criteria
  if (filingType.includes('bail') || title.includes('bail')) {
    priorityScore += 25;
    predictedDelay -= 35;
    reasons.push('V4: Urgent Liberty / Bail Application');
  } else if (description.includes('demolition') || description.includes('eviction') || description.includes('stay')) {
    priorityScore += 25;
    predictedDelay -= 30;
    reasons.push('V4: Emergency Injunction / Threat of Irreparable Harm');
  }

  // Vector 5: Case Age & Systemic Pendency
  if (caseData.filing_date) {
    const filingDate = new Date(caseData.filing_date);
    const diffDays = Math.ceil(Math.abs(new Date() - filingDate) / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      priorityScore += 25;
      reasons.push(`V5: Pendency Arrears Priority (${diffDays} Days Pending)`);
    } else if (diffDays > 180) {
      priorityScore += 10;
      reasons.push(`V5: Backlog Monitoring (${diffDays} Days Pending)`);
    }
  }

  // Vector 6: Trial Stage & Disposal Potential
  if (trialStage === 'Final Arguments') {
    priorityScore += 25;
    predictedDelay -= 40;
    reasons.push('V6: Final Arguments Stage (Targeted for Immediate Disposal)');
  } else if (trialStage === 'Defense Evidence' || trialStage === 'Prosecution Evidence') {
    priorityScore += 15;
    predictedDelay -= 15;
    reasons.push(`V6: Active Trial Stage (${trialStage})`);
  }

  // Vector 7: Commercial Valuation Impact
  if (valuation >= 10000000) {
    priorityScore += 15;
    reasons.push(`V7: Commercial Court High Stake Claim (₹${(valuation/100000).toFixed(1)} Lakhs)`);
  }

  // Cap Score 0 to 100
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
    reason: reasons
  };
}

/**
 * Fetches priority and delay predictions for a case
 * @param {Object} caseData - Object containing title, description, case_type, filing_date, etc.
 * @returns {Promise<Object>} Object containing priority, priority_score, predicted_delay, reason
 */
const getPredictions = async (caseData) => {
  try {
    console.log(`[AI Service] Sending request to external AI at ${AI_AGENT_URL}/predictPriority`);
    
    // We use a short timeout to failover quickly to local fallback if the server is offline
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${AI_AGENT_URL}/predictPriority`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(caseData),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI API responded with status ${response.status}`);
    }

    const data = await response.json();
    return {
      priority: data.priority,
      priority_score: data.priority_score,
      predicted_delay: data.predicted_delay,
      reason: Array.isArray(data.reason) ? data.reason : [data.reason]
    };
  } catch (error) {
    console.warn(`[AI Service] External API call failed: ${error.message}. Triggering fallback.`);
    return localAIFallback(caseData);
  }
};

module.exports = {
  getPredictions
};
