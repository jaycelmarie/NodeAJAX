const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');

const app = express();

app.use(express.static(path.join(__dirname, '../my-app/build')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(bodyParser.json());

let client;

async function connectToDb() {
    const mongoServer = await MongoMemoryServer.create();
    const uri = await mongoServer.getUri();
    client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB in memory!');
}

async function createCollection() {
    const db = client.db('myDatabase');
    await db.createCollection('products');
    console.log("Created collection 'products'");
}

async function insertProductsToDb(products) {
    try {
        const db = client.db('myDatabase');
        const result = await db.collection('products').insertMany(products);
        console.log(`${result.insertedCount} products inserted into MongoDB`);
    } catch (error) {
        console.error('Error inserting products into MongoDB:', error);
    }
}

async function readProductsFromDb() {
    try {
        const db = client.db('myDatabase');
        const products = await db.collection('products').find().toArray();
        console.log('Fetched products from MongoDB:', products);
        return products;
    } catch (error) {
        console.error('Error reading products from MongoDB:', error);
        return [];
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/index.html'));
});

app.get('/products', async (req, res) => {
    try {
        const products = await readProductsFromDb();
        if (products.length === 0) {
            return res.status(404).send('No products found');
        }
        const productHtmlTemplate = fs.readFileSync(path.join(__dirname, 'client/products.html'), 'utf8');
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
        res.send(modifiedHtml);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Error fetching products');
    }
});

// Search route to search for a product in the database
app.get('/search', async (req, res) => {
    const query = req.query.q; // Extract the search query from the URL query parameter
    //console.log(query);
    try {
        const db = client.db('myDatabase');
        const products = await db.collection('products').find({
            $or: [
                { name: { $regex: query, $options: 'i' } }, // Case-insensitive search by product name
                { description: { $regex: query, $options: 'i' } }, // Case-insensitive search by description
                { sku: parseInt(query) } // Case-insensitive search by SKU
            ]
        }).toArray();
        console.log(products);
        res.json(products);
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).send('Error searching products');
    }
});

// Insert route to add a new product
// Route to insert a new product into the database
app.post('/insert', async (req, res) => {
    try {
        // Extract product data from request body
        const { name, sku, type, price, description, manufacturer, model, url, image } = req.body;
        
        // Parse the SKU value into an integer
        const parsedSKU = parseInt(sku);

        // Validate required fields
        if (!name || !sku || !type || !price || !description || !manufacturer || !model || !url || !image) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Create a new product object
        const newProduct = {
            name,
            sku: parsedSKU,
            type,
            price,
            description,
            manufacturer,
            model,
            url,
            image
        };

        // Insert the new product into the database
        const db = client.db('myDatabase');
        const result = await db.collection('products').insertOne(newProduct);

        // Send a success response with the ID of the inserted product
        res.status(201).json({ message: 'Product inserted successfully', productId: result.insertedId });
    } catch (error) {
        console.error('Error inserting product:', error);
        res.status(500).json({ error: 'Error inserting product' });
    }
});

// Update route to update an existing product in the database
app.put('/update/:id', async (req, res) => {

    try {
        const id = req.params.id; // Extract the id from the request parameters
        const updatedProductData = req.body; // Extract the updated product data from the request body
        console.log('Received request to update product with ID:', id);

        // Convert the id string to an ObjectId
        const objectId = new ObjectId(id);

        // Log the updated product data
        //console.log('Updated product data:', updatedProductData);

        // Use MongoDB's update operations to update the product in the database
        const db = client.db('myDatabase');

        // Mapping between client-side field names and database field names
        const fieldMappings = {
            name_upt: 'name',
            sku_upt: 'sku',
            type_upt: 'type',
            price_upt: 'price',
            description_upt: 'description',
            manufacturer_upt: 'manufacturer',
            model_upt: 'model',
            url_upt: 'url',
            image_upt: 'image'
        };

        // Parse the SKU value into an integer
        const skuValue = parseInt(updatedProductData['sku_upt']);

        // Create an empty object to store the update operations
        let updateOperations = {};

        // Check if each field in updatedProductData has been modified
        for (const field in updatedProductData) {
            if (updatedProductData.hasOwnProperty(field)) {
                // Map the client-side field name to the corresponding database field name
                const dbFieldName = fieldMappings[field];
                if (dbFieldName) {
                    // Set the updated value in the updateOperations object using the database field name
                    updateOperations[dbFieldName] = updatedProductData[field];
                    updateOperations['sku'] = skuValue;
                }
            }
        }

        // Log the update operations
        console.log('Update operations:', updateOperations);

        // Check if any fields have been modified before performing the update
        if (Object.keys(updateOperations).length > 0) {
            // Perform the update only if there are modified fields
            const result = await db.collection('products').updateOne(
                { _id: objectId }, // Filter by ID
                { $set: updateOperations,
                 } // Set the updated product data
            );

            if (result.modifiedCount === 1) {
                // If one document was modified, the update was successful
                console.log("==== PRODUCT UPDATED! =====")
                res.status(200).json({ message: 'Product updated successfully' });
            } else {
                // If no document was modified, the product with the given ID was not found
                res.status(404).json({ error: 'Product not found' });
            }
        } else {
            // If no fields were modified, return a success response
            res.status(200).json({ message: 'No changes to update' });
        }
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Error updating product' });
    }
});

// Delete a product
app.delete('/delete/:sku', async (req, res) => {
    try {
        const sku = req.params.sku;
        const db = client.db('myDatabase');
        console.log('Received request to delete product with SKU:', sku);
        const result = await db.collection('products').deleteOne({ sku: parseInt(sku) });
        if (result.deletedCount === 1) {
            res.status(200).json({ message: 'Product deleted successfully' });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Error deleting product' });
    }
});


const PORT = process.env.PORT || 8080;

(async () => {
    try {
        await connectToDb();
        await createCollection();
        const productsFilePath = path.join(__dirname, 'open-data-set', 'products.json');
        const productsData = fs.readFileSync(productsFilePath, 'utf8');
        const products = JSON.parse(productsData);
        await insertProductsToDb(products);
        app.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
    }
})();
