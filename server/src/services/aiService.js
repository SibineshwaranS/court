// Service to interact with the External AI Agent API
require('dotenv').config();

const AI_AGENT_URL = process.env.AI_AGENT_URL || 'http://localhost:5001';

// Local Fallback Algorithm (Ensures the backend remains fully operational even if the AI server is offline)
function localAIFallback(caseData) {
  console.log('[AI Service] Using local fallback AI simulation (External API offline)');
  const title = (caseData.title || '').toLowerCase();
  const description = (caseData.description || '').toLowerCase();
  const caseType = (caseData.case_type || '').toLowerCase();
  const filingDateStr = caseData.filing_date;

  let priority = 'Medium';
  let priorityScore = 50;
  let predictedDelay = 90;
  const reasons = [];

  if (filingDateStr) {
    const filingDate = new Date(filingDateStr);
    const diffTime = Math.abs(new Date() - filingDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      priorityScore += 25;
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
    priorityScore += 15;
    predictedDelay -= 15;
    reasons.push('Family Court Dispute');
  }

  if (description.includes('senior') || title.includes('senior')) {
    priorityScore += 25;
    predictedDelay -= 20;
    reasons.push('Senior Citizen Involved');
  }

  if (priorityScore >= 75) priority = 'High';
  else if (priorityScore <= 35) priority = 'Low';

  if (reasons.length === 0) {
    reasons.push('Standard scheduling backlog');
  }

  return {
    priority,
    priority_score: priorityScore,
    predicted_delay: Math.max(15, predictedDelay),
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
