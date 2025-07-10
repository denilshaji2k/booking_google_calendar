const express = require('express');
const router = express.Router();
const openaiService = require('../services/openai');

// Store conversation history (in production, use a proper database)
const conversations = new Map();

// Process chat message
router.post('/message', async (req, res) => {
  try {
    const { message, conversationId, clientInfo } = req.body;

    // Get or initialize conversation history
    let history = conversations.get(conversationId) || [];

    // Process message with client context
    const response = await openaiService.processMessage(message, history, clientInfo);

    // Update conversation history
    history = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: response.message }
    ];
    conversations.set(conversationId, history);

    // Format response for WhatsAutomate
    const whatsappResponse = {
      success: true,
      data: {
        messages: [{
          role: 'assistant',
          content: response.message
        }]
      }
    };

    // If there was a function call, include it in the response
    if (response.functionCall) {
      whatsappResponse.data.function = {
        name: response.functionCall.name,
        parameters: response.functionCall.arguments,
        result: response.functionCall.result
      };
    }

    res.json(whatsappResponse);
  } catch (error) {
    console.error('Chat processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: {
        messages: [{
          role: 'assistant',
          content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."
        }]
      }
    });
  }
});

// Clear conversation history
router.delete('/conversation/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  conversations.delete(conversationId);
  res.json({
    success: true,
    message: 'Conversation history cleared'
  });
});

module.exports = router; 