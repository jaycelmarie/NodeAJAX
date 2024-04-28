const express = require("express");
const path = require("path");
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');
const fs = require('fs');

const app = express();
app.use(express.static(path.join(__dirname, '../my-app/build'))); // Serve your React app
app.use(express.static(path.join(__dirname, 'public'))); // Serve your HTML file

let client; // Declare a variable to hold the MongoDB client

async function connectToDb() {
    const mongoServer = await MongoMemoryServer.create();
    const uri = await mongoServer.getUri();
    client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB in memory!");
}

async function createCollection() {
    const db = client.db("myDatabase");
    await db.createCollection("products");
    console.log("Created collection 'products'");
}

async function readProductsFromJson() {
    try {
        const productsFilePath = path.join(__dirname, 'open-data-set', 'products.json');
        const productsData = fs.readFileSync(productsFilePath, 'utf8');
        const products = JSON.parse(productsData);
        console.log("Fetched products from JSON file:", products);
        return products;
    } catch (error) {
        console.error("Error reading products from JSON file:", error);
        return [];
    }
}

// HTML template for rendering products
const productHtmlTemplate = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

app.get("/products", async function (req, res) {
    try {
        const products = await readProductsFromJson(); // Read products from JSON file
        if (products.length === 0) {
            // If no products found, send an appropriate response
            return res.status(404).send("No products found");
        }
        // Inject products data into the HTML template
        const productItems = products.map(product => `
            <li>
                <h2>${product.name}</h2>
                <p>SKU: ${product.sku}</p>
                <p>Type: ${product.type}</p>
                <p>Price: $${product.price}</p>
                <p>Description: ${product.description}</p>
                <p>Manufacturer: ${product.manufacturer}</p>
                <p>Model: ${product.model}</p>
                <p>URL: <a href="${product.url}">${product.url}</a></p>
                <img src="${product.image}" alt="${product.name}">
            </li>
        `).join('');
        const modifiedHtml = productHtmlTemplate.replace('<!-- Product items will be appended here -->', productItems);
        // Send the modified HTML content as the response
        res.send(modifiedHtml);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Error fetching products");
    }
});
app.get("/", function (req, res) {
    res.send("This is the root route!");
});

const PORT = process.env.PORT || 8080;

(async () => {
    await connectToDb(); // Connect to the database
    await createCollection(); // Create the collection
    app.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`);
    });
})();
