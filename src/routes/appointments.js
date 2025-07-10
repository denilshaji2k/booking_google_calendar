const express = require('express');
const router = express.Router();
const appointmentService = require('../services/functions');

// Book appointment
router.post('/book', async (req, res) => {
  try {
    const appointment = await appointmentService.bookAppointment(req.body);
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// View appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await appointmentService.viewAppointments(req.query);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reschedule appointment
router.post('/reschedule', async (req, res) => {
  try {
    const appointment = await appointmentService.rescheduleAppointment(req.body);
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel appointment
router.post('/cancel', async (req, res) => {
  try {
    const result = await appointmentService.cancelAppointment(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available slots
router.get('/slots', async (req, res) => {
  try {
    const slots = await appointmentService.getAvailableSlots(req.query);
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 