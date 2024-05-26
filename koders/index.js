

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
app.use(bodyParser.json());

const STRAPI_URL = 'http://strapi.koders.in/expenses';

// Helper function to update an expense
const updateExpense = async (id, data) => {
  try {
    await axios.put(${STRAPI_URL}/${id}, data);
  } catch (error) {
    console.error(Failed to update expense: ${error.message});
  }
};

// Schedule task to update recurring expenses
cron.schedule('0 0 * * *', async () => {
  try {
    const response = await axios.get(STRAPI_URL);
    const expenses = response.data;

    for (const expense of expenses) {
      if (expense.frequency !== 'One-Time') {
        const now = new Date();
        let increment = 0;

        switch (expense.frequency) {
          case 'Daily':
            increment = expense.base;
            break;
          case 'Weekly':
            if (now.getDay() === 0) increment = expense.base; // Weekly increment on Sundays
            break;
          case 'Monthly':
            if (now.getDate() === 1) increment = expense.base; // Monthly increment on the 1st
            break;
          case 'Quarterly':
            if (now.getDate() === 1 && [0, 3, 6, 9].includes(now.getMonth())) increment = expense.base; // Quarterly increment on the 1st of Jan, Apr, Jul, Oct
            break;
          case 'Yearly':
            if (now.getMonth() === 0 && now.getDate() === 1) increment = expense.base; // Yearly increment on Jan 1st
            break;
        }

        if (increment > 0) {
          const updatedAmount = expense.amount + increment;
          await updateExpense(expense.id, { amount: updatedAmount });
        }
      }
    }
  } catch (error) {
    console.error(Failed to update recurring expenses: ${error.message});
  }
});

// CRUD Routes
app.post('/expenses', async (req, res) => {
  try {
    const response = await axios.post(STRAPI_URL, req.body);
    res.status(201).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/expenses', async (req, res) => {
  try {
    const response = await axios.get(STRAPI_URL);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/expenses/:id', async (req, res) => {
  try {
    const response = await axios.put(${STRAPI_URL}/${req.params.id}, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/expenses/:id', async (req, res) => {
  try {
    await axios.delete(${STRAPI_URL}/${req.params.id});
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

