const calendarService = require('./calendar');

// Function definitions with improved schemas
const functions = {
  book_appointment: {
    name: "book_appointment",
    description: "Book a new appointment for a client. Validates availability and client information before booking. Returns appointment details and confirmation.",
    parameters: {
      type: "object",
      properties: {
        client_name: {
          type: "string",
          description: "Full name of the client (2-50 characters)",
          minLength: 2,
          maxLength: 50
        },
        client_phone: {
          type: "string",
          description: "Client's phone number in international format (e.g., +91XXXXXXXXXX)",
          pattern: "^\\+[1-9]\\d{1,14}$"
        },
        timezone: {
          type: "string",
          description: "Client's timezone (e.g., 'Asia/Kolkata', 'UTC')",
          pattern: "^[A-Za-z]+/[A-Za-z_]+$|^UTC$"
        },
        date: {
          type: "string",
          description: "Appointment date in YYYY-MM-DD format",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$"
        },
        time: {
          type: "string",
          description: "Appointment time in 12-hour format (e.g., '10:00 AM')",
          pattern: "^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$"
        },
        duration: {
          type: "integer",
          description: "Duration in minutes (15-120)",
          minimum: 15,
          maximum: 120,
          default: 30
        },
        notes: {
          type: "string",
          description: "Optional notes or special requests for the appointment",
          maxLength: 500
        },
        service_type: {
          type: "string",
          description: "Type of service (e.g., 'consultation', 'follow_up')",
          enum: ["consultation", "follow_up", "regular"]
        }
      },
      required: ["client_name", "client_phone", "timezone", "date", "time"]
    }
  },

  view_appointments: {
    name: "view_appointments",
    description: "Retrieve upcoming appointments for a client. Returns a list of scheduled appointments with details.",
    parameters: {
      type: "object",
      properties: {
        client_id: {
          type: "string",
          description: "Unique identifier for the client",
          pattern: "^[A-Za-z0-9-_]+$"
        },
        start_date: {
          type: "string",
          description: "Start date in YYYY-MM-DD format",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$"
        },
        end_date: {
          type: "string",
          description: "End date in YYYY-MM-DD format (optional)",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$"
        },
        timezone: {
          type: "string",
          description: "Client's timezone (e.g., 'Asia/Kolkata', 'UTC')",
          pattern: "^[A-Za-z]+/[A-Za-z_]+$|^UTC$",
          default: "Asia/Kolkata"
        },
        status: {
          type: "string",
          description: "Filter appointments by status",
          enum: ["upcoming", "completed", "cancelled"],
          default: "upcoming"
        }
      },
      required: ["client_id", "start_date"]
    }
  },

  reschedule_appointment: {
    name: "reschedule_appointment",
    description: "Reschedule an existing appointment to a new date/time. Validates availability for the new slot before rescheduling.",
    parameters: {
      type: "object",
      properties: {
        appointment_id: {
          type: "string",
          description: "Unique identifier of the existing appointment",
          pattern: "^[A-Za-z0-9-_]+$"
        },
        date: {
          type: "string",
          description: "New appointment date in YYYY-MM-DD format",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$"
        },
        time: {
          type: "string",
          description: "New appointment time in 12-hour format (e.g., '10:00 AM')",
          pattern: "^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$"
        },
        timezone: {
          type: "string",
          description: "Client's timezone (e.g., 'Asia/Kolkata', 'UTC')",
          pattern: "^[A-Za-z]+/[A-Za-z_]+$|^UTC$"
        },
        reason: {
          type: "string",
          description: "Reason for rescheduling (optional)",
          maxLength: 200
        }
      },
      required: ["appointment_id", "date", "time", "timezone"]
    }
  },

  cancel_appointment: {
    name: "cancel_appointment",
    description: "Cancel an existing appointment. Returns confirmation and cancellation details.",
    parameters: {
      type: "object",
      properties: {
        appointment_id: {
          type: "string",
          description: "Unique identifier of the appointment to cancel",
          pattern: "^[A-Za-z0-9-_]+$"
        },
        reason: {
          type: "string",
          description: "Reason for cancellation (optional)",
          maxLength: 200
        },
        notify_client: {
          type: "boolean",
          description: "Whether to send a cancellation notification to the client",
          default: true
        }
      },
      required: ["appointment_id"]
    }
  },

  get_available_slots: {
    name: "get_available_slots",
    description: "Get available appointment slots for a specific date. Returns a list of available time slots considering existing appointments and business hours.",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date to check in YYYY-MM-DD format",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$"
        },
        timezone: {
          type: "string",
          description: "Client's timezone (e.g., 'Asia/Kolkata', 'UTC')",
          pattern: "^[A-Za-z]+/[A-Za-z_]+$|^UTC$",
          default: "Asia/Kolkata"
        },
        duration: {
          type: "integer",
          description: "Slot duration in minutes (15-120)",
          minimum: 15,
          maximum: 120,
          default: 30
        },
        service_type: {
          type: "string",
          description: "Type of service to check availability for",
          enum: ["consultation", "follow_up", "regular"],
          default: "regular"
        }
      },
      required: ["date"]
    }
  }
};

// Function implementations with improved error handling and validation
const executeFunctions = {
  async book_appointment(params) {
    try {
      // Validate date is not in the past
      const appointmentDate = new Date(params.date + 'T' + this.convertTo24Hour(params.time));
      if (appointmentDate < new Date()) {
        throw new Error('Cannot book appointments in the past');
      }

      return await calendarService.createAppointment(params);
    } catch (error) {
      throw new Error(`Failed to book appointment: ${error.message}`);
    }
  },

  async view_appointments(params) {
    try {
      // Validate date range
      if (params.end_date && params.end_date < params.start_date) {
        throw new Error('End date cannot be before start date');
      }

      return await calendarService.getAppointments(params);
    } catch (error) {
      throw new Error(`Failed to view appointments: ${error.message}`);
    }
  },

  async reschedule_appointment(params) {
    try {
      // Validate new date is not in the past
      const newDate = new Date(params.date + 'T' + this.convertTo24Hour(params.time));
      if (newDate < new Date()) {
        throw new Error('Cannot reschedule to a past date/time');
      }

      return await calendarService.rescheduleAppointment(params);
    } catch (error) {
      throw new Error(`Failed to reschedule appointment: ${error.message}`);
    }
  },

  async cancel_appointment(params) {
    try {
      return await calendarService.cancelAppointment(params);
    } catch (error) {
      throw new Error(`Failed to cancel appointment: ${error.message}`);
    }
  },

  async get_available_slots(params) {
    try {
      // Validate date is not in the past
      const checkDate = new Date(params.date);
      if (checkDate < new Date().setHours(0, 0, 0, 0)) {
        throw new Error('Cannot check availability for past dates');
      }

      return await calendarService.getAvailableSlots(params);
    } catch (error) {
      throw new Error(`Failed to get available slots: ${error.message}`);
    }
  },

  // Utility function to convert 12-hour time to 24-hour format
  convertTo24Hour(time12h) {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    
    return `${hours}:${minutes}:00`;
  }
};

module.exports = {
  functions,
  executeFunctions
}; 