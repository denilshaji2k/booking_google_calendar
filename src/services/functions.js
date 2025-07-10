const calendarService = require('./calendar');

const appointmentService = {
  async bookAppointment(params) {
    try {
      return await calendarService.createAppointment({
        client_name: params.client_name,
        client_phone: params.client_phone,
        timezone: params.timezone,
        date: params.date,
        time: params.time
      });
    } catch (error) {
      throw new Error(`Failed to book appointment: ${error.message}`);
    }
  },

  async viewAppointments(params) {
    try {
      return await calendarService.getAppointments({
        client_id: params.client_id,
        start_date: params.start_date,
        end_date: params.end_date,
        timezone: params.timezone || 'Asia/Kolkata'
      });
    } catch (error) {
      throw new Error(`Failed to view appointments: ${error.message}`);
    }
  },

  async rescheduleAppointment(params) {
    try {
      return await calendarService.rescheduleAppointment({
        appointment_id: params.appointment_id,
        date: params.date,
        time: params.time,
        timezone: params.timezone
      });
    } catch (error) {
      throw new Error(`Failed to reschedule appointment: ${error.message}`);
    }
  },

  async cancelAppointment(params) {
    try {
      return await calendarService.cancelAppointment({
        appointment_id: params.appointment_id
      });
    } catch (error) {
      throw new Error(`Failed to cancel appointment: ${error.message}`);
    }
  },

  async getAvailableSlots(params) {
    try {
      return await calendarService.getAvailableSlots({
        date: params.date,
        timezone: params.timezone || 'Asia/Kolkata'
      });
    } catch (error) {
      throw new Error(`Failed to get available slots: ${error.message}`);
    }
  }
};

module.exports = appointmentService; 