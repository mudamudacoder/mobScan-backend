// server.js

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const { error } = require('console');
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/api/order/:orderNum', async (req, res) => {
  const { orderNum } = req.params;

  try {
    // Fetch order details
    const orderDetails = await prisma.orderHeader.findFirst({
      where: { orderNr: parseInt(orderNum, 10) },
    });

    if (!orderDetails) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Fetch items in the order
    const orderItems = await prisma.orderRows.findMany({
      where: { orderNr: parseInt(orderNum, 10) },
    });

    if (!orderItems || orderItems.length === 0) {
      return res.status(404).json({ error: 'No items found in this order' });
    }

    // Fetch item descriptions and build response array
    const itemDetailsPromises = orderItems.map(async (item) => {
      const itemDetails = await prisma.itemAll.findFirst({
        where: { itemNumber: item.itemNumber },
      });

      const pickAreaInfo = itemDetails ? await prisma.pickAreas.findFirst({
        where: {pickAreaNr: itemDetails.pickAreaNr},
      }) : null;

      return {
        itemNumber: item.itemNumber,
        quantity: item.quantity,
        itemDescription: itemDetails?.itemDescription || 'Description not available',
        smallText: itemDetails?.smallText || '',
        pickAreaName: pickAreaInfo?.pickAreaName || 'Unknown',
      };
    });

    const itemsWithDetails = await Promise.all(itemDetailsPromises);

    // Combine order and item details for response
    const response = {
      orderNr: orderDetails.orderNr,
      plantDate: orderDetails.plantDate,
      items: itemsWithDetails,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Route to get order and item details by combined orderNr|itemNumber
app.get('/api/orders/:orderItemCombo', async (req, res) => {
  const { orderItemCombo } = req.params;
  
  try {
    // Split the combined orderItemCombo into orderNr and itemNumber
    const [orderNr, itemNumber] = orderItemCombo.split('|');
    
    // Validate parsed values
    if (!orderNr || !itemNumber) {
      return res.status(400).json({ error: 'Invalid order and item combination format.' });
    }
    
    // Query order header and order rows
    const orderHeader = await prisma.orderHeader.findFirst({
      where: { orderNr: parseInt(orderNr, 10) },
    });

    if (!orderHeader) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderRow = await prisma.orderRows.findFirst({
      where: {
        orderNr: parseInt(orderNr, 10),
        itemNumber: itemNumber,
      },
    });

    if (!orderRow) {
      return res.status(404).json({ error: 'Item not found in this order' });
    }

    // Retrieve item details from itemAll and pickAreaName from pickAreas
    const itemDetails = await prisma.itemAll.findFirst({
      where: { itemNumber: itemNumber },
    });

    if (!itemDetails) {
      return res.status(404).json({ error: 'Item details not found' });
    }

    const pickAreaDetails = await prisma.pickAreas.findFirst({
      where: { pickAreaNr: itemDetails.pickAreaNr },
    });

    // Construct the response data
    const responseData = {
      orderNr: orderHeader.orderNr,
      plantDate: orderHeader.plantDate,
      itemNumber: orderRow.itemNumber,
      quantity: orderRow.quantity,
      itemDescription: itemDetails.itemDescription,
      smallText: itemDetails.smallText,
      pickAreaName: pickAreaDetails ? pickAreaDetails.pickAreaName : 'Unknown',
    };

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(5000, () => console.log("Server ready on port 5000"));
module.exports = app;
