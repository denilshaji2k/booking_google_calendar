const OpenAI = require('openai');
const { functions, executeFunctions } = require('./functions');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System message template for WhatsAutomate integration
const SYSTEM_MESSAGE = `You are a virtual assistant for kazhakuttam, responsible for assisting customers with appointment bookings through chat support. Your main tasks include booking, rescheduling, and cancelling appointments. If the client ID is missing, politely ask the customer for their full name to continue. Always use the default service and location; do not ask customers to select them. Never share technical IDs like bookingId; use human-readable language. If no slots are available, suggest alternative slots on the same day or nearby dates. Communicate naturally without including or referencing JSON or system data. Internal JSON responses are handled automatically.

Context:
Today's Date: {{currentDate}}
Client Name: {{client.name}}
Phone: {{client.phone}}
Timezone: {{timezone}}
Client ID: {{client.id}}
Default Location ID: {{businessId}}
Default Service ID: DB25CtMAX

Business Hours: 9 AM to 5 PM
Appointment Duration: 30 minutes (default)

Remember to:
1. Always be polite and professional
2. Ask for missing information when needed
3. Confirm details before making any changes
4. Provide clear next steps
5. Handle errors gracefully with user-friendly messages`;

class OpenAIService {
  constructor() {
    this.defaultLocationId = process.env.DEFAULT_LOCATION_ID;
    this.defaultServiceId = 'DB25CtMAX'; // Default service ID as per documentation
  }

  // Get the system message with current context
  getSystemMessage(clientInfo = {}) {
    const currentDate = new Date().toISOString().split('T')[0];
    return SYSTEM_MESSAGE
      .replace('{{currentDate}}', currentDate)
      .replace('{{client.name}}', clientInfo.name || '')
      .replace('{{client.phone}}', clientInfo.phone || '')
      .replace('{{timezone}}', clientInfo.timezone || 'UTC')
      .replace('{{client.id}}', clientInfo.id || '')
      .replace('{{businessId}}', this.defaultLocationId);
  }

  // Process incoming message and return response
  async processMessage(message, conversationHistory = [], clientInfo = {}) {
    try {
      // Prepare messages array with system message and history
      const messages = [
        { role: 'system', content: this.getSystemMessage(clientInfo) },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      // Call OpenAI with function definitions
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        functions: Object.values(functions),
        function_call: 'auto',
        temperature: 0.7,
      });

      const assistantResponse = response.choices[0].message;

      // Check if the model wants to call a function
      if (assistantResponse.function_call) {
        const functionName = assistantResponse.function_call.name;
        const functionArgs = JSON.parse(assistantResponse.function_call.arguments);

        // Add default IDs if not provided
        if (functionName === 'book_appointment' || functionName === 'suggest_available_slots') {
          if (!functionArgs.location) functionArgs.location = { id: this.defaultLocationId };
          if (!functionArgs.service) functionArgs.service = { id: this.defaultServiceId };
        }

        // Execute the function
        const functionResult = await executeFunctions[functionName](functionArgs);

        // Send the function result back to OpenAI for natural language response
        const secondResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            ...messages,
            assistantResponse,
            {
              role: 'function',
              name: functionName,
              content: JSON.stringify(functionResult)
            }
          ],
          temperature: 0.7,
        });

        return {
          message: secondResponse.choices[0].message.content,
          functionCall: {
            name: functionName,
            arguments: functionArgs,
            result: functionResult
          }
        };
      }

      // If no function call, return the direct response
      return {
        message: assistantResponse.content,
        functionCall: null
      };
    } catch (error) {
      console.error('OpenAI processing error:', error);
      throw error;
    }
  }
}

module.exports = new OpenAIService(); 