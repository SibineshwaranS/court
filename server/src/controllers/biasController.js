const biasMonitorService = require('../services/biasMonitorService');

// Get continuous bias & disparate impact audit
const getBiasAudit = async (req, res, next) => {
  try {
    const auditReport = await biasMonitorService.auditAlgorithmicBias();
    res.json(auditReport);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBiasAudit
};

