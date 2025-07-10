# Appointment Booking System

A Node.js-based appointment booking system that integrates with WhatsAutomate, Google Calendar, and OpenAI for natural language processing.

## Features

- Natural language appointment booking via WhatsApp
- Google Calendar integration for appointment management
- Google Meet integration for virtual meetings
- Automatic time slot suggestions
- Multi-timezone support
- Conversation context management
- WhatsApp notifications

## Prerequisites

- Node.js 16 or higher
- Google Cloud Platform account with Calendar API enabled
- WhatsAutomate API key
- OpenAI API key

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   # Server Configuration
   PORT=3000

   # WhatsAutomate API Configuration
   WHAUTOMATE_API_KEY=your_whautomate_api_key_here
   DEFAULT_LOCATION_ID=your_business_id_here

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # Google OAuth2 Configuration
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   CALENDAR_ID=primary
   ```

4. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `GET /auth/google/callback` - Google OAuth callback

### Appointments
- `POST /api/appointments/book` - Book a new appointment
- `GET /api/appointments` - View appointments
- `POST /api/appointments/reschedule` - Reschedule an appointment
- `POST /api/appointments/cancel` - Cancel an appointment
- `GET /api/appointments/slots` - Get available time slots

### Chat
- `POST /api/chat/message` - Process chat messages
- `DELETE /api/chat/conversation/:conversationId` - Clear conversation history

### Functions
- `GET /api/functions` - List available functions
- `POST /api/functions/execute` - Execute a function

## WhatsAutomate Integration

The system integrates with WhatsAutomate for handling WhatsApp messages. Each API call requires:

- `x-api-key` header with your WhatsAutomate API key
- `x-business-id` header with your business ID
- Content-Type: application/json

## Error Handling

The system includes comprehensive error handling:
- Input validation
- API error responses
- Graceful fallbacks
- User-friendly error messages

## Development

To run in development mode with auto-reload:
```bash
npm run dev
```

## Testing

```bash
npm test
```

## License

MIT 