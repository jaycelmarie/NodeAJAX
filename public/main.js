// ====== START OF UPDATE PRODUCT FORM ============
document.addEventListener('DOMContentLoaded', () => {
    const updateProductButton = document.getElementById('updateProductButton');
    const searchProductModal = document.getElementById('searchProductModal');
    const searchProductNameInput = document.getElementById('searchProductName');
    const searchProductButton = document.getElementById('searchProductButton');
    const updateProductForm = document.getElementById('updateProductForm');
  
    // Event listener for clicking the "Update Product" button
    updateProductButton.addEventListener('click', () => {
      searchProductModal.style.display = 'block'; // Show the search product modal
    });
  
    // Event listener for clicking the search button in the modal
    searchProductButton.addEventListener('click', async () => {
        const productName = searchProductNameInput.value.trim();
        if (productName) {
        // Send a request to search for the product by name
        try {
            const response = await fetch(`/search?q=${productName}`);
            if (response.ok) {
            const product = await response.json();
            if (product) {
                // Display the update form with the product details
                displayUpdateForm(product);
                updateProductListener(product);
            } else {
                alert('Product not found.');
            }
            } else {
            alert('Error searching for product.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error searching for product.');
        }
        } else {
        alert('Please enter a product name.');
        }
    });
    
  
    // Function to display the update form with product details
    function displayUpdateForm(product) {
    // Log the product object to the console for inspection
    console.log(product);
    console.log(product[0].name);
  
    // Populate the form fields with product details
    updateProductForm.querySelector('#name_upt').value = product[0].name;
    updateProductForm.querySelector('#sku_upt').value = product[0].sku;
    updateProductForm.querySelector('#type_upt').value = product[0].type;
    updateProductForm.querySelector('#price_upt').value = product[0].price;
    updateProductForm.querySelector('#description_upt').value = product[0].description;
    updateProductForm.querySelector('#manufacturer_upt').value = product[0].manufacturer;
    updateProductForm.querySelector('#model_upt').value = product[0].model;
    updateProductForm.querySelector('#url_upt').value = product[0].url;
    updateProductForm.querySelector('#image_upt').value = product[0].image;
  
    // Show the update product form
    updateProductForm.style.display = 'block';
  }

    // Define updatedProduct with initial values or empty object
    let updatedProduct = {};

    // Get all input fields inside the updateProductForm
    const inputFields = updateProductForm.querySelectorAll('input');

    // Iterate over each input field
    inputFields.forEach(input => {
        // Add an event listener to listen for changes in the input field
        input.addEventListener('input', () => {
            // Update the corresponding property in the updatedProduct object with the new value entered by the user
            updatedProduct[input.id] = input.value;
        });
    });


// Function to add event listener for submitting the update product form
    function updateProductListener(product) {
    // Event listener for submitting the update product form
    updateProductForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent the form from submitting normally
        
     
                const productID = product[0]._id;

                console.log(product[0]._id);

                    
                const nameValue = updateProductForm.querySelector('#model_upt').value;

                console.log('Type value:', nameValue);


                // Send a request to update the product
                try {
                    // Make a fetch request to update the product
                    const response = await fetch(`/update/${productID}`, {
                        method: 'PUT', // Use PUT method for updating
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(updatedProduct),
                    });
                    
                    const responseData = await response.json();
                    if (response.status === 200) {
                        alert('Product updated successfully.');
                        console.log(product);
                        //updateProductForm.reset(); // Clear the form after successful submission
                        updateProductForm.style.display = 'none'; // Hide the form after successful submission
                    } 

                } catch (error) {
                    console.error('Error updating product:', error);
                    alert('Error updating product. Please try again.');
                }
    });

}

});
  

// ====== START OF ADD PRODUCT FORM ============
document.addEventListener('DOMContentLoaded', () => {
    const showAddProductFormButton = document.getElementById('showAddProductForm');
    const addProductForm = document.getElementById('addProductForm');
    const form = document.getElementById('productForm');

    // Event listener for the button click
    showAddProductFormButton.addEventListener('click', () => {
        // Toggle the visibility of the form
        if (addProductForm.style.display === 'block') {
            addProductForm.style.display = 'none'; // Hide the form if it's already visible
        } else {
            addProductForm.style.display = 'block'; // Show the form if it's hidden
        }
    });
    // Event listener for form submission
    addProductForm.querySelector('form').addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent the form from submitting normally

        // Get form data
        const formData = new FormData(addProductForm.querySelector('form'));

        // Convert FormData to JSON object
        const jsonObject = {};
        formData.forEach((value, key) => {
            jsonObject[key] = value;
        });
        const jsonData = JSON.stringify(jsonObject);

        try {
            const response = await fetch('/insert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: jsonData
            });

            if (response.ok) {
                const responseData = await response.json();
                alert(responseData.message); // Display success message
                form.reset(); // Clear the form
                addProductForm.style.display = 'none'; // Hide the form after successful submission
            } else {
                alert('Failed to add product. Please try again.');
            }
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Error adding product. Please try again.');
        }
    });
});

// ====== START OF SEARCH FUNCTIONALITY ========

document.getElementById('searchForm').addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent the form from submitting normally
        const searchQuery = document.getElementById('searchInput').value;
        try {
            const response = await fetch(`/search?q=${searchQuery}`);
            const products = await response.json();
            displaySearchResults(products);
        } catch (error) {
            console.error('Error searching products:', error);
        }
    });

// Function to display search results on the page
function displaySearchResults(products) {
    const searchResultsContainer = document.getElementById('searchResults');
    searchResultsContainer.innerHTML = ''; // Clear previous search results
    if (products.length === 0) {
        searchResultsContainer.innerHTML = '<p>No products found</p>';
        return;
    }
    else {
        const productList = document.createElement('ul');
        products.forEach(product => {
            const productItem = document.createElement('li');
            productItem.innerHTML = `
                <h2>${product.name}</h2>
                <p>SKU: ${product.sku}</p>
                <p>Type: ${product.type}</p>
                <p>Price: $${product.price}</p>
                <p>Description: ${product.description}</p>
                <p>Manufacturer: ${product.manufacturer}</p>
                <p>Model: ${product.model}</p>
                <p>URL: <a href="${product.url}">${product.url}</a></p>
                <img src="${product.image}" alt="${product.name}">
            `;
            productList.appendChild(productItem);
        });
        searchResultsContainer.appendChild(productList);
    }
} // End of search



