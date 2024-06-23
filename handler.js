const serverless = require('serverless-http');
const express = require('express');
const { translateToBraille } = require('./src/translateToBraille');
const { print } = require('./src/print');

const app = express();

app.post('/translate', async (req, res) => {
  const { text } = req.body;

  try {
    const brailleText = await translateToBraille(text);
    return res.status(200).json({
      result: brailleText,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
    });
  }
});

app.post('/print', async (req, res) => {
  const { text, fileName } = req.body;

  try {
    await print(text, fileName);
    return res.status(200).json({
      message: 'Print job executed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
    });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: 'Not Found',
  });
});

exports.handler = serverless(app);
