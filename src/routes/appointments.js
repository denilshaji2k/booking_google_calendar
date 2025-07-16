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
    // Log incoming request
    console.log('Incoming appointment request:');
    console.log('Query parameters:', req.query);
    console.log('Request body:', req.body);

    // Get parameters from query since we're using URL parameters
    const { client_name, client_phone, timezone, date, time } = req.query;
    
    // Log parsed parameters
    console.log('Parsed parameters:', {
      client_name,
      client_phone,
      timezone,
      date,
      time
    });

    // Validate required parameters
    if (!client_name || !client_phone || !timezone || !date || !time) {
      console.log('Missing required parameters');
      return res.status(400).json({ 
        error: 'Missing required parameters',
        received: { client_name, client_phone, timezone, date, time }
      });
    }

    // Convert 24-hour time format to 12-hour format
    let formattedTime = time;
    if (time && time.length > 0) {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      console.log('Time conversion:', {
        original: time,
        parsedHour: hour,
        parsedMinutes: minutes
      });
      
      if (!isNaN(hour)) {
        formattedTime = `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
        console.log('Formatted time:', formattedTime);
      }
    }
    
    console.log('Attempting to create appointment with:', {
      client_name,
      client_phone,
      timezone,
      date,
      time: formattedTime,
      duration: 30
    });

    const appointment = await calendarService.createAppointment({
      client_name,
      client_phone,
      timezone,
      date,
      time: formattedTime,
      duration: 30 // Default duration in minutes
    });

    console.log('Appointment created successfully:', appointment);
    res.json(appointment);
  } catch (error) {
    console.error('Error booking appointment:', error);
    console.error('Error stack:', error.stack);
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