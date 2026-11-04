const witnessService = require('../services/witnessService');
const emailService = require('../services/emailService');

// 1. Get Witnesses
const getWitnesses = async (req, res, next) => {
  try {
    const filters = {
      department: req.query.department,
      station: req.query.station,
      search: req.query.search
    };
    const witnesses = await witnessService.getWitnesses(filters);
    res.json(witnesses);
  } catch (error) {
    next(error);
  }
};

// 2. Get Witness Availability
const getWitnessAvailability = async (req, res, next) => {
  try {
    const witnessId = req.params.id;
    const { start_date, end_date } = req.query;
    const schedule = await witnessService.getWitnessAvailability(witnessId, start_date, end_date);
    res.json(schedule);
  } catch (error) {
    next(error);
  }
};

// 3. Issue Smart Summons with VC link
const issueSummons = async (req, res, next) => {
  try {
    const {
      case_id,
      hearing_id,
      witness_id,
      scheduled_date,
      mode,
      delivery_channel,
      from_email,
      to_email,
      delivery_address,
      assigned_bailiff,
      notes
    } = req.body;

    if (!case_id || !witness_id || !scheduled_date) {
      res.status(400);
      return next(new Error('Please provide case_id, witness_id, and scheduled_date'));
    }

    const summons = await witnessService.issueSummons({
      caseId: parseInt(case_id, 10),
      hearingId: hearing_id ? parseInt(hearing_id, 10) : null,
      witnessId: parseInt(witness_id, 10),
      scheduledDate: scheduled_date,
      mode: mode || 'Virtual VC',
      deliveryChannel: delivery_channel || 'Email',
      fromEmail: from_email || 'court.registry.salem@tn.gov.in',
      toEmail: to_email || '',
      deliveryAddress: delivery_address || '',
      assignedBailiff: assigned_bailiff || 'Process Server R. Selvam',
      notes: notes || '',
      userId: req.user?.id
    });

    res.status(201).json(summons);
  } catch (error) {
    next(error);
  }
};

// 4. Get Summons List
const getSummons = async (req, res, next) => {
  try {
    const filters = {
      case_id: req.query.case_id,
      witness_id: req.query.witness_id,
      status: req.query.status
    };
    const summonsList = await witnessService.getSummons(filters);
    res.json(summonsList);
  } catch (error) {
    next(error);
  }
};

// 5. Update Summons Status
const updateSummonsStatus = async (req, res, next) => {
  try {
    const summonsId = req.params.id;
    const { status, notes } = req.body;

    if (!status) {
      res.status(400);
      return next(new Error('Please provide status'));
    }

    const updated = await witnessService.updateSummonsStatus(
      summonsId,
      status,
      notes,
      req.user?.id
    );

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// 6. Test Email Dispatch
const sendTestEmail = async (req, res, next) => {
  try {
    const targetEmail = req.body.email || emailService.DEFAULT_RECIPIENT;
    const result = await emailService.sendSummonsEmail({
      recipientEmail: targetEmail,
      summonsNumber: `TEST-SUMM-${Date.now().toString().slice(-4)}`,
      caseNumber: 'TN-CRL-2026-0101',
      caseTitle: 'State of Tamil Nadu vs. Vikram Singh & Ors.',
      witnessName: 'Inspector K. Sundaram',
      witnessDesignation: 'Investigating Officer (IO)',
      stationOrHospital: 'Salem Central PS',
      scheduledDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      mode: 'Virtual VC',
      vcLink: 'https://court-vc.tn.gov.in/room/TN-VC-DEMO-TEST',
      notes: 'Test dispatch triggered from judicial management portal to verify email connectivity.'
    });
    res.json({
      message: `Test summons email processed for ${targetEmail}`,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

// 7. Preview Summons Email HTML
const previewSummonsEmail = async (req, res, next) => {
  try {
    const summonsId = req.params.id;
    const list = await witnessService.getSummons({});
    const found = list.find(s => s.id === parseInt(summonsId, 10));
    if (!found) {
      return res.status(404).send('Summons record not found');
    }
    const html = emailService.generateSummonsHtml({
      recipientEmail: found.witness_email || 'sibineshwarans@gmail.com',
      summonsNumber: found.summons_number,
      caseNumber: found.case_number,
      caseTitle: found.case_title,
      witnessName: found.witness_name,
      witnessDesignation: found.witness_designation,
      stationOrHospital: found.station_or_hospital,
      scheduledDate: found.scheduled_date,
      mode: found.mode,
      vcLink: found.vc_link,
      notes: found.notes
    });
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWitnesses,
  getWitnessAvailability,
  issueSummons,
  getSummons,
  updateSummonsStatus,
  sendTestEmail,
  previewSummonsEmail
};

