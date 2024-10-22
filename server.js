// server.js

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
// Initialize environment variables
dotenv.config();



// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Express app
const app = express();
app.use(cors());
// Middleware to parse incoming JSON requests
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serve index.html
  });

// API Route to get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to get a single product by its ID
app.get('/api/products/:barcode', async (req, res) => {
  const { barcode } = req.params;
  try {
    const product = await prisma.product.findFirst({
      where: { barCode: barcode },
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found :(' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to create a new product
app.post('/api/products', async (req, res) => {
  const { productCode, name, barCode, description } = req.body;
  try {
    const newProduct = await prisma.product.create({
      data: {
        productCode,
        name,
        barCode,
        description,
      },
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to delete a product by its ID
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedProduct = await prisma.product.delete({
      where: { id },
    });
    res.json(deletedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server and listen on a port
module.exports = app;
