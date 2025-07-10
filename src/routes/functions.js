const express = require('express');
const router = express.Router();
const { functions, executeFunctions } = require('../services/functions');

// Get available functions
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: Object.values(functions)
  });
});

// Execute a function
router.post('/execute', async (req, res) => {
  try {
    const { name, parameters } = req.body;

    // Validate function exists
    if (!functions[name]) {
      return res.status(400).json({
        success: false,
        error: `Function '${name}' not found`
      });
    }

    // Validate parameters against schema
    const functionDef = functions[name];
    const requiredParams = functionDef.parameters.required;
    
    // Check required parameters
    for (const param of requiredParams) {
      if (!parameters[param]) {
        return res.status(400).json({
          success: false,
          error: `Missing required parameter: ${param}`
        });
      }
    }

    // Execute the function
    const result = await executeFunctions[name](parameters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Function execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 