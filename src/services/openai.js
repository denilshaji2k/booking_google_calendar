const OpenAI = require('openai');
const { functions, executeFunctions } = require('./functions');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System message template for WhatsAutomate integration
const SYSTEM_MESSAGE = `You are a professional appointment booking assistant for kazhakuttam, helping customers schedule and manage their appointments through WhatsApp chat support.

# Core Responsibilities
- Book new appointments
- Reschedule existing appointments
- Cancel appointments
- Check available time slots
- View upcoming appointments

# Business Context
Today's Date: {{currentDate}}
Business Hours: 9 AM to 5 PM
Default Duration: 30 minutes
Location: {{businessId}}
Service: DB25CtMAX (default)

# Client Context
Name: {{client.name}}
Phone: {{client.phone}}
Timezone: {{timezone}}
Client ID: {{client.id}}

# Communication Guidelines
1. Be Professional & Friendly
- Use polite, professional language
- Be concise but warm
- Address the client by name when available
- Maintain a helpful and patient tone

2. Information Collection
- If client name/phone missing, politely ask for it
- Confirm appointment details before booking
- Double-check dates and times
- Always specify timezone when discussing times
- Ask for clarification if any details are ambiguous

3. Appointment Management
- Never share technical IDs (like appointmentId)
- Use human-readable date/time formats
- If requested slot unavailable, suggest alternatives:
  * Same day different time
  * Next available slot
  * Next few days
- Always confirm the final booking details

4. Error Handling
- Provide clear, non-technical error explanations
- Guide users to correct invalid inputs
- Offer alternatives when requests can't be fulfilled
- Maintain context when recovering from errors

5. Follow-up
- Confirm actions taken
- Provide next steps
- Share Google Meet links for virtual appointments
- Ask if there's anything else needed
- Remind about cancellation/rescheduling policies

# Response Structure
1. Acknowledge the user's request
2. Ask for any missing information
3. Use available functions to fulfill the request
4. Provide clear confirmation or next steps
5. Offer additional assistance

# Important Notes
- Always validate dates and times before booking
- Check for conflicts before confirming appointments
- Handle timezone conversions carefully
- Maintain conversation context for better assistance
- Be proactive in suggesting alternatives
- Keep responses concise but informative

Remember: You have access to functions for all appointment operations. Always use these functions rather than making assumptions about availability or bookings.`;

class OpenAIService {
  constructor() {
    this.defaultLocationId = process.env.DEFAULT_LOCATION_ID;
    this.defaultServiceId = process.env.DEFAULT_SERVICE_ID;
  }

  getSystemMessage(clientInfo = {}) {
    const currentDate = new Date().toISOString().split('T')[0];
    return SYSTEM_MESSAGE
      .replace('{{currentDate}}', currentDate)
      .replace('{{client.name}}', clientInfo.name || 'valued customer')
      .replace('{{client.phone}}', clientInfo.phone || 'not provided')
      .replace('{{timezone}}', clientInfo.timezone || 'UTC')
      .replace('{{client.id}}', clientInfo.id || 'not available')
      .replace('{{businessId}}', this.defaultLocationId);
  }

  async executeToolCalls(toolCalls) {
    return Promise.all(toolCalls.map(async (toolCall) => {
      try {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        // Add default IDs for booking-related functions
        if (['book_appointment', 'suggest_available_slots'].includes(functionName)) {
          if (!functionArgs.location) functionArgs.location = { id: this.defaultLocationId };
          if (!functionArgs.service) functionArgs.service = { id: this.defaultServiceId };
        }

        // Validate function exists
        if (!executeFunctions[functionName]) {
          throw new Error(`Function ${functionName} not implemented`);
        }

        // Execute the function and format result
        const result = await executeFunctions[functionName](functionArgs);
        return {
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: JSON.stringify(result)
        };
      } catch (error) {
        console.error(`Error executing function ${toolCall.function.name}:`, error);
        return {
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: JSON.stringify({
            error: error.message,
            status: 'error',
            timestamp: new Date().toISOString()
          })
        };
      }
    }));
  }

  async processMessage(message, conversationHistory = [], clientInfo = {}) {
    try {
      // Validate inputs
      if (!message || typeof message !== 'string') {
        throw new Error('Invalid message format');
      }

      if (!Array.isArray(conversationHistory)) {
        throw new Error('Invalid conversation history format');
      }

      const messages = [
        { role: 'system', content: this.getSystemMessage(clientInfo) },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      // First call to get assistant's response and potential function calls
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        tools: Object.values(functions).map(fn => ({
          type: 'function',
          function: fn
        })),
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1000,
      });

      const assistantResponse = response.choices[0].message;

      // Handle function calls if present
      if (assistantResponse.tool_calls && assistantResponse.tool_calls.length > 0) {
        // Execute all function calls in parallel
        const toolResults = await this.executeToolCalls(assistantResponse.tool_calls);

        // Get final response incorporating function results
        const finalResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            ...messages,
            assistantResponse,
            ...toolResults
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        return {
          message: finalResponse.choices[0].message.content,
          functionCalls: assistantResponse.tool_calls.map((call, index) => ({
            name: call.function.name,
            arguments: JSON.parse(call.function.arguments),
            result: JSON.parse(toolResults[index].content)
          })),
          status: 'success',
          timestamp: new Date().toISOString()
        };
      }

      // Return direct response if no function calls
      return {
        message: assistantResponse.content,
        functionCalls: null,
        status: 'success',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('OpenAI processing error:', error);
      return {
        message: 'I apologize, but I encountered an error processing your request. Please try again.',
        error: error.message,
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new OpenAIService(); 