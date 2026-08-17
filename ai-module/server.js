const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Helper function to predict based on case fields
function runMockAI(caseDetails) {
  const title = (caseDetails.title || '').toLowerCase();
  const description = (caseDetails.description || '').toLowerCase();
  const caseType = (caseDetails.case_type || '').toLowerCase();
  const filingDateStr = caseDetails.filing_date;

  let priority = 'Medium';
  let priorityScore = 55;
  let predictedDelay = 90; // Default baseline delay of 90 days
  const reasons = [];

  // Check age of case if filing date is provided
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

  // Check case type
  if (caseType === 'criminal') {
    priorityScore += 15;
    predictedDelay -= 20; // Criminal cases prioritized slightly faster but higher priority
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

  // Check text flags
  if (description.includes('senior') || description.includes('elderly') || title.includes('senior')) {
    priorityScore += 25;
    predictedDelay -= 25;
    reasons.push('Senior Citizen');
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

  // Cap score
  if (priorityScore > 100) priorityScore = 100;
  if (priorityScore < 0) priorityScore = 0;

  // Determine priority category
  if (priorityScore >= 75) {
    priority = 'High';
  } else if (priorityScore <= 35) {
    priority = 'Low';
  } else {
    priority = 'Medium';
  }

  // Ensure predicted delay is non-negative
  if (predictedDelay < 0) predictedDelay = 15;

  // Default reasons if none matched
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

app.post('/predictPriority', (req, res) => {
  console.log('Received priority prediction request for case:', req.body);
  const result = runMockAI(req.body);
  res.json({
    priority: result.priority,
    priority_score: result.priority_score,
    predicted_delay: result.predicted_delay,
    reason: result.reasons
  });
});

app.post('/predictDelay', (req, res) => {
  console.log('Received delay prediction request for case:', req.body);
  const result = runMockAI(req.body);
  res.json({
    priority: result.priority,
    priority_score: result.priority_score,
    predicted_delay: result.predicted_delay,
    reason: result.reasons
  });
});

app.listen(PORT, () => {
  console.log(`Mock AI Agent API running on port ${PORT}`);
});
