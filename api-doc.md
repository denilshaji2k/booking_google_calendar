# Appointment Booking API Documentation

## Base URL
`http://localhost:3000`

## Authentication
All appointment-related endpoints require Google OAuth2 authentication.

## Endpoints

### Health Check
- **GET** `/api/health`
- **Description**: Check if the API is running
- **Response**: `{ "status": "ok" }`

### Authentication
- **GET** `/auth/google/callback`
- **Description**: OAuth2 callback endpoint for Google authentication
- **Query Parameters**:
  - `code`: Authorization code from Google
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Authentication successful! You can now use the calendar API."
  }
  ```

### Appointments

#### 1. Book Appointment
- **POST** `/api/appointments/book`
- **Body**:
  ```json
  {
    "client_name": "string",
    "client_phone": "string",
    "timezone": "string (e.g., 'Asia/Kolkata')",
    "date": "YYYY-MM-DD",
    "time": "hh:mm A"
  }
  ```
- **Response**:
  ```json
  {
    "appointmentId": "string",
    "meetLink": "string",
    "startTime": "ISO datetime",
    "endTime": "ISO datetime"
  }
  ```

#### 2. View Appointments
- **GET** `/api/appointments`
- **Query Parameters**:
  - `client_id`: string
  - `start_date`: YYYY-MM-DD
  - `end_date`: YYYY-MM-DD (optional)
  - `timezone`: string (default: 'Asia/Kolkata')
- **Response**:
  ```json
  [
    {
      "appointmentId": "string",
      "summary": "string",
      "startTime": "ISO datetime",
      "endTime": "ISO datetime",
      "meetLink": "string"
    }
  ]
  ```

#### 3. Reschedule Appointment
- **POST** `/api/appointments/reschedule`
- **Body**:
  ```json
  {
    "appointment_id": "string",
    "date": "YYYY-MM-DD",
    "time": "hh:mm A",
    "timezone": "string"
  }
  ```
- **Response**:
  ```json
  {
    "appointmentId": "string",
    "meetLink": "string",
    "startTime": "ISO datetime",
    "endTime": "ISO datetime"
  }
  ```

#### 4. Cancel Appointment
- **POST** `/api/appointments/cancel`
- **Body**:
  ```json
  {
    "appointment_id": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true
  }
  ```

#### 5. Get Available Slots
- **GET** `/api/appointments/slots`
- **Query Parameters**:
  - `date`: YYYY-MM-DD
  - `timezone`: string (default: 'Asia/Kolkata')
- **Response**:
  ```json
  [
    {
      "time": "hh:mm A",
      "date": "YYYY-MM-DD"
    }
  ]
  ```

## Function Definitions

### Calendar Service Functions

#### 1. createAppointment
```javascript
async function createAppointment({
  client_name,
  client_phone,
  timezone,
  date,
  time,
  duration = 60
})
```

#### 2. getAvailableSlots
```javascript
async function getAvailableSlots({
  date,
  timezone,
  duration = 60
})
```

#### 3. rescheduleAppointment
```javascript
async function rescheduleAppointment({
  appointment_id,
  date,
  time,
  timezone
})
```

#### 4. cancelAppointment
```javascript
async function cancelAppointment({
  appointment_id
})
```

#### 5. getAppointments
```javascript
async function getAppointments({
  client_id,
  start_date,
  end_date,
  timezone
})
```

### Google Auth Functions

#### 1. setupGoogleAuth
```javascript
async function setupGoogleAuth()
```

#### 2. getTokenFromCode
```javascript
async function getTokenFromCode(code)
```

#### 3. refreshAccessToken
```javascript
async function refreshAccessToken()
```

#### 4. getCalendarClient
```javascript
function getCalendarClient()
```

## Environment Variables Required

```env
PORT=3000
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
CALENDAR_ID=primary  # Optional, defaults to 'primary'
```

## Business Rules

1. Business Hours: 9 AM to 5 PM
2. Default appointment duration: 60 minutes
3. Timezone: Default is Asia/Kolkata
4. All appointments include Google Meet links automatically
5. Appointments can only be booked during available slots
6. Slots are considered available if there are no overlapping appointments

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 400: Bad Request (invalid parameters)
- 401: Unauthorized (authentication required)
- 404: Not Found
- 500: Internal Server Error

Error responses follow the format:
```json
{
  "error": "Error message description"
}
```
```

Would you like me to save this as a file in your project directory? Or would you like any modifications to this documentation?