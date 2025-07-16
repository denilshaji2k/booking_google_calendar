const express = require('express');
const router = express.Router();
const calendarService = require('../services/calendar');

// Get available slots
router.get('/slots', async (req, res) => {
  try {
    const { date, timezone = 'Asia/Kolkata', duration = 30 } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const slots = await calendarService.getAvailableSlots({
      date,
      timezone,
      duration: parseInt(duration)
    });

    res.json(slots);
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ error: error.message });
  }
});

// Book appointment
router.post('/book', async (req, res) => {
  try {
    // Get parameters from either query or body
    const params = req.method === 'POST' ? req.body : req.query;
    const { client_name, client_phone, timezone, date, time, duration } = params;
    
    // Convert 24-hour time format to 12-hour format if needed
    let formattedTime = time;
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      formattedTime = `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
    }
    
    const appointment = await calendarService.createAppointment({
      client_name,
      client_phone,
      timezone,
      date,
      time: formattedTime,
      duration
    });

    res.json(appointment);
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel appointment
router.post('/cancel', async (req, res) => {
  try {
    const { appointment_id } = req.body;
    const result = await calendarService.cancelAppointment({ appointment_id });
    res.json(result);
  } catch (error) {
    console.error('Error canceling appointment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reschedule appointment
router.post('/reschedule', async (req, res) => {
  try {
    const { appointment_id, date, time, timezone } = req.body;
    const appointment = await calendarService.rescheduleAppointment({
      appointment_id,
      date,
      time,
      timezone
    });
    res.json(appointment);
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get appointments
router.get('/', async (req, res) => {
  try {
    const { client_id, start_date, end_date, timezone } = req.query;
    const appointments = await calendarService.getAppointments({
      client_id,
      start_date,
      end_date,
      timezone
    });
    res.json(appointments);
  } catch (error) {
    console.error('Error getting appointments:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 