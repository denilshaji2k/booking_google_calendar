# Appointment Booking API Documentation

## Base URL
`http://localhost:3000`

## Authentication
All appointment-related endpoints require Google OAuth2 authentication.

## Timezone Handling
- Default timezone: 'Asia/Kolkata'
- All endpoints that accept timezone parameter will use 'Asia/Kolkata' if no timezone is provided
- Timezone should be provided in IANA timezone format (e.g., 'Asia/Kolkata', 'America/New_York')

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
    "client_name": "string (required)",
    "client_phone": "string (required)",
    "timezone": "string (optional, defaults to 'Asia/Kolkata')",
    "date": "YYYY-MM-DD (required)",
    "time": "hh:mm A (required)"
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
  - `client_id`: string (required)
  - `start_date`: YYYY-MM-DD (required)
  - `end_date`: YYYY-MM-DD (optional)
  - `timezone`: string (optional, defaults to 'Asia/Kolkata')
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
    "appointment_id": "string (required)",
    "date": "YYYY-MM-DD (required)",
    "time": "hh:mm A (required)",
    "timezone": "string (optional, defaults to 'Asia/Kolkata')"
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
    "appointment_id": "string (required)"
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
  - `date`: YYYY-MM-DD (required)
  - `timezone`: string (optional, defaults to 'Asia/Kolkata')
  - `duration`: number (optional, defaults to 30 minutes)
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
  client_name,  // required
  client_phone, // required
  timezone,     // optional, defaults to 'Asia/Kolkata'
  date,         // required, format: YYYY-MM-DD
  time,         // required, format: hh:mm A
  duration = 30 // optional, in minutes
})
```

#### 2. getAvailableSlots
```javascript
async function getAvailableSlots({
  date,         // required, format: YYYY-MM-DD
  timezone,     // optional, defaults to 'Asia/Kolkata'
  duration = 30 // optional, in minutes
})
```

#### 3. rescheduleAppointment
```javascript
async function rescheduleAppointment({
  appointment_id, // required
  date,          // required, format: YYYY-MM-DD
  time,          // required, format: hh:mm A
  timezone       // optional, defaults to 'Asia/Kolkata'
})
```

#### 4. cancelAppointment
```javascript
async function cancelAppointment({
  appointment_id // required
})
```

#### 5. getAppointments
```javascript
async function getAppointments({
  client_id,   // required
  start_date,  // required, format: YYYY-MM-DD
  end_date,    // optional, format: YYYY-MM-DD
  timezone     // optional, defaults to 'Asia/Kolkata'
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

1. Business Hours: 10 AM to 11 PM
2. Default appointment duration: 30 minutes
3. Timezone: Default is Asia/Kolkata for all operations
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

The key changes I made to the documentation include:

1. Added a dedicated "Timezone Handling" section at the top to clearly document the default timezone behavior
2. Updated all endpoint documentation to explicitly mark which parameters are required vs optional
3. Added default timezone information to all relevant endpoints
4. Updated the business hours to match the actual implementation (10 AM to 11 PM)
5. Updated the default appointment duration to 30 minutes to match the actual implementation
6. Added more detailed parameter descriptions in the function definitions section
7. Made the timezone parameter documentation consistent across all endpoints
8. Added clearer marking of required vs optional parameters in the JSON examples

Would you like me to make any other changes to the documentation?