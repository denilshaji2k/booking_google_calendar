const moment = require('moment-timezone');
const { getCalendarClient } = require('./googleAuth');

class CalendarService {
  constructor() {
    this.calendar = getCalendarClient();
    this.calendarId = process.env.CALENDAR_ID || 'primary';
  }

  async createAppointment({ client_name, client_phone, timezone, date, time, duration = 30 }) {
    const startTime = moment.tz(`${date} ${time}`, 'YYYY-MM-DD hh:mm A', timezone);
    const endTime = startTime.clone().add(duration, 'minutes');

    const event = {
      summary: `Appointment with ${client_name}`,
      description: `Phone: ${client_phone}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: timezone,
      },
      attendees: [],
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    const response = await this.calendar.events.insert({
      calendarId: this.calendarId,
      resource: event,
      conferenceDataVersion: 1
    });

    return {
      appointmentId: response.data.id,
      meetLink: response.data.hangoutLink,
      startTime: startTime.format(),
      endTime: endTime.format()
    };
  }

  async getAvailableSlots({ date, timezone, duration = 30 }) {
    const startDate = moment.tz(date, timezone).startOf('day');
    const endDate = startDate.clone().endOf('day');

    const response = await this.calendar.events.list({
      calendarId: this.calendarId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const busySlots = response.data.items.map(event => ({
      start: moment(event.start.dateTime || event.start.date),
      end: moment(event.end.dateTime || event.end.date),
    }));

    // Business hours (9 AM to 5 PM)
    const workStart = startDate.clone().set({ hour: 10, minute: 0 });
    const workEnd = startDate.clone().set({ hour: 23, minute: 0 });

    const availableSlots = [];
    let currentSlot = workStart.clone();

    while (currentSlot.isBefore(workEnd)) {
      const slotEnd = currentSlot.clone().add(duration, 'minutes');
      
      const isSlotAvailable = !busySlots.some(busy => 
        (currentSlot.isBetween(busy.start, busy.end, null, '[)') ||
        slotEnd.isBetween(busy.start, busy.end, null, '(]'))
      );

      if (isSlotAvailable) {
        availableSlots.push({
          time: currentSlot.format('hh:mm A'),
          date: currentSlot.format('YYYY-MM-DD'),
        });
      }

      currentSlot.add(duration, 'minutes');
    }

    return availableSlots;
  }

  async rescheduleAppointment({ appointment_id, date, time, timezone }) {
    const event = await this.calendar.events.get({
      calendarId: this.calendarId,
      eventId: appointment_id
    });

    const oldEvent = event.data;
    const duration = moment(oldEvent.end.dateTime).diff(moment(oldEvent.start.dateTime), 'minutes');

    const startTime = moment.tz(`${date} ${time}`, 'YYYY-MM-DD hh:mm A', timezone);
    const endTime = startTime.clone().add(duration, 'minutes');

    const updatedEvent = {
      ...oldEvent,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: timezone,
      },
    };

    const response = await this.calendar.events.update({
      calendarId: this.calendarId,
      eventId: appointment_id,
      resource: updatedEvent,
    });

    return {
      appointmentId: response.data.id,
      meetLink: response.data.hangoutLink,
      startTime: startTime.format(),
      endTime: endTime.format()
    };
  }

  async cancelAppointment({ appointment_id }) {
    await this.calendar.events.delete({
      calendarId: this.calendarId,
      eventId: appointment_id,
    });

    return { success: true };
  }

  async getAppointments({ client_id, start_date, end_date, timezone }) {
    const response = await this.calendar.events.list({
      calendarId: this.calendarId,
      timeMin: moment.tz(start_date, timezone).toISOString(),
      timeMax: moment.tz(end_date || start_date, timezone).endOf('day').toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items.map(event => ({
      appointmentId: event.id,
      summary: event.summary,
      startTime: moment(event.start.dateTime).format(),
      endTime: moment(event.end.dateTime).format(),
      meetLink: event.hangoutLink,
    }));
  }
}

module.exports = new CalendarService(); 