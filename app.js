const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId } = require('mongodb');
const { requireLogin } = require('./authMiddleware');
const fs = require('fs');

const app = express();

app.use(express.static(path.join(__dirname, '../my-app/build')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true
}));

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
    await db.createCollection('users');
    console.log("Created collection 'products', 'users'");
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

async function insertUsersToDb(users) {
    try {
        const db = client.db('myDatabase');
        const result = await db.collection('users').insertMany(users);
        console.log(`${result.insertedCount} users inserted into MongoDB`);
    } catch (error) {
        console.error('Error inserting users into MongoDB:', error);
    }
}

// async function readProductsFromDb() {
//     try {
//         const db = client.db('myDatabase');
//         const products = await db.collection('products').find().toArray();
//         console.log('Fetched products from MongoDB:', products);
//         return products;
//     } catch (error) {
//         console.error('Error reading products from MongoDB:', error);
//         return [];
//     }
// }

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/about.html'));
});

// ===== PRICE SEARCH UP ========
// Search route to search for a product in the database
app.get('/search', async (req, res) => {
    const query = req.query.q; // Extract the search query from the URL query parameter
    const minPrice = parseFloat(req.query.minPrice); // Convert minPrice to number
    const maxPrice = parseFloat(req.query.maxPrice); // Convert maxPrice to number
    const page = parseInt(req.query.page) || 1; // Default page to 1 if not provided
    const limit = 10; // Number of products per page

    try {
        const db = client.db('myDatabase');
        let queryFilter = {
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { sku: parseInt(query) }
            ]
        };

        if (minPrice !== undefined && maxPrice !== undefined) {
            queryFilter.$or.push({ price: { $gte: minPrice, $lte: maxPrice } });
        }

        const skip = (page - 1) * limit;
        const products = await db.collection('products').find(queryFilter).skip(skip).limit(limit).toArray();
        
        res.json(products);
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).send('Error searching products');
    }
});

// Insert route to add a new product
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
                    // Check if the SKU field is modified and assign the parsed SKU value
                    if (field === 'sku_upt') {
                        updateOperations['sku'] = skuValue;
                    }
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
            // If no fields were modified, return this
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

// User Login
app.post('/login', async (req, res) => {
    const { usernameEmail, password } = req.body;

    const db = client.db('myDatabase');

    try {
        // Check if the username or email exists in the database
        const user = await db.collection('users').findOne({ $or: [{ username: usernameEmail }, { email: usernameEmail }] });

        // If user is not found or password doesn't match, send error response
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid username/email or password' });
        }

        console.log({ username: user.username });
        // Validate username and password (replace with your authentication logic)
        if (user.username || user.email) {
            // If credentials are valid, store user information in session
            req.session.user = {
                username: user.username,
                email: user.email,
                password: user.password
            }
        };
        // If user is found and password matches, send user data in response
        res.json({ username: user.username });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'An error occurred while logging in' });
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.clearCookie('session-id'); // Clear the session cookie if necessary
            res.status(200).json({ message: 'Logout successful' });
        }
    });
});

// Protected route example
app.get('/protected', requireLogin, (req, res) => {
    res.send('Welcome to the protected route');
});

// File path to the users JSON file
const usersFilePath = 'open-data-set/users.json';

// New User Registration
app.post('/register', async (req, res) => {
    try {
        // Extract user data from request body
        const { email, username, password } = req.body;

        // Validate required fields
        if (!email || !username || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Create a new user object
        const newUser = {
            email,
            username,
            password
        };

        // Insert the new user into the database
        const db = client.db('myDatabase');
        const result = await db.collection('users').insertOne(newUser);

        console.log('New user registered:', newUser);

        // Read the existing users JSON file
        fs.readFile(usersFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading users file:', err);
                return res.status(500).json({ error: 'Error registering user' });
            }

            // Parse the JSON data into a JavaScript object
            let users = JSON.parse(data);

            // Append the new user object to the existing array of users
            users.push(newUser);

            // Convert the updated JavaScript object back to JSON
            const updatedData = JSON.stringify(users, null, 2);

            // Write the updated JSON content back to the file
            fs.writeFile(usersFilePath, updatedData, (err) => {
                if (err) {
                    console.error('Error writing users file:', err);
                    return res.status(500).json({ error: 'Error registering user' });
                }
                console.log('User registration successful!');

                // Send a success response with the ID of the inserted user
                res.status(201).json({ message: 'User inserted successfully', username: newUser });
       });
     });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Error registering user' });
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
        const usersFilePath = path.join(__dirname, 'open-data-set', 'users.json');
        const usersData = fs.readFileSync(usersFilePath, 'utf8');
        const users = JSON.parse(usersData);
        await insertUsersToDb(users);
        app.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
    }
})();
