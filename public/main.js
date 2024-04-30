// ====== START OF SLIDESHOW ===========
let slideIndex = 0;
showSlides();

function showSlides() {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  slideIndex++;
  if (slideIndex > slides.length) {slideIndex = 1}
  slides[slideIndex-1].style.display = "block";
  setTimeout(showSlides, 10000); // Change image every 2 seconds
}

// ====== BUTTON CLICKS - HIDING =============
document.addEventListener('DOMContentLoaded', () => {
    const addProductButton = document.getElementById('showAddProductForm');
    const updateProductButton = document.getElementById('updateProductButton');
    const deleteProductButton = document.getElementById('deleteProductButton');
    const addProductForm = document.getElementById('addProductForm');
    const updateProductForm = document.getElementById('updateProductForm');
    const deleteProductSection = document.getElementById('deleteProductSection');

    // Event listener for Add Product button
    addProductButton.addEventListener('click', () => {
        hideForms();
        addProductForm.style.display = 'block';
    });

    // Event listener for Update Product button
    updateProductButton.addEventListener('click', () => {
        hideForms();
        updateProductForm.style.display = 'block';
    });

    // Event listener for Delete Product button
    deleteProductButton.addEventListener('click', () => {
        hideForms();
        deleteProductSection.style.display = 'block';
    });

    // Function to hide all forms/search bars
    function hideForms() {
        addProductForm.style.display = 'none';
        updateProductForm.style.display = 'none';
        deleteProductSection.style.display = 'none';
    }
});

// ====== START OF DELETE PRODUCT ============
document.addEventListener('DOMContentLoaded', () => {
    // Get the delete product button, search SKU button, and SKU input field
    const deleteProductButton = document.getElementById('deleteProductButton');
    const searchSkuButton = document.getElementById('searchSkuButton');
    const skuToDeleteInput = document.getElementById('skuToDelete');

    // Event listener for delete product button
    deleteProductButton.addEventListener('click', () => {
        const deleteProductSection = document.getElementById('deleteProductSection');
        deleteProductSection.style.display = 'block';
    });

    // Event listener for search SKU button
searchSkuButton.addEventListener('click', async () => {
    try {
        const skuToDelete = skuToDeleteInput.value.trim(); // Get the SKU entered by the user
        if (skuToDelete) {
            // Send a fetch request to search for the product by SKU
            const response = await fetch(`/search?q=${skuToDelete}`);
            console.log('SKU to delete:', skuToDelete); // Log the SKU to the console
            if (response.ok) {
                const product = await response.json();
                if (product) {
                    // Display the product details or perform any other action
                    console.log('Product found:', product);
                    deleteProductListener(product);
                } else {
                    alert('Product not found.');
                }
            } else {
                throw new Error('Error searching for product. Server response not OK.');
            }
        } else {
            alert('Please enter a SKU.');
        }
    } catch (error) {
        console.error('Error searching product:', error);
        alert('Error searching product. Please try again.');
    }
});


   // Function to add event listener for deleting the product
async function deleteProductListener(product) {
    //console.log('entering deleteProductListener function...');
    try {
        if (product && product.length > 0) {
            const skuToDelete = product[0].sku; // Get the SKU of the product
            console.log('SKU to delete:', skuToDelete);
            // Send a fetch request to delete the product by SKU
            const response = await fetch(`/delete/${skuToDelete}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                alert('Product deleted successfully.');
                // Optionally, update the UI to reflect the deletion
            } else {
                alert('Failed to delete product. Please try again.');
            }
        } else {
            alert('Product not found or empty result.');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please try again.');
    }
}

 
});

// ====== START OF UPDATE PRODUCT FORM ============
document.addEventListener('DOMContentLoaded', () => {
    const updateProductButton = document.getElementById('updateProductButton');
    const container = document.querySelector('.container');
    const searchProductModal = document.getElementById('searchProductModal');
    const searchProductNameInput = document.getElementById('searchProductName');
    const searchProductButton = document.getElementById('searchProductButton');
    const updateProductForm = document.getElementById('updateProductForm');

    // Event listener for clicking the "Update Product" button
    updateProductButton.addEventListener('click', () => {
      searchProductModal.style.display = 'block'; // Show the search product modal
      container.style.display = 'block';
    });
  
    // Event listener for clicking the search button in the modal
    searchProductButton.addEventListener('click', async () => {
        const productName = searchProductNameInput.value.trim();
        searchProductModal.style.display = 'none';
        
        if (productName) {
        // Send a request to search for the product by name
        try {
            const response = await fetch(`/search?q=${productName}`);
            if (response.ok) {
            const product = await response.json();
            if (product) {
                console.log('got the product!', product);
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

    console.log(product);

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
        const skuInput = document.getElementById('sku');

        // Get the clear fields button
        const clearFieldsButton = document.getElementById('clearFieldsButton');

        // Add event listener for the clear fields button
        clearFieldsButton.addEventListener('click', () => {
            // Loop through each input field in the form and set its value to an empty string
            updateProductForm.querySelectorAll('input, textarea').forEach(input => {
                input.value = '';
            });
        });

        // Event listener for submitting the update product form
        updateProductForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent the form from submitting normally
            const skuValue = updateProductForm.querySelector('#sku_upt').value;
        
            // Check if the SKU value is a valid number
            if (validateSKU(skuValue)) {
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
                    
                    //const responseData = await response.json();
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
            } else {
                // If not valid, show an error message
                alert('Please enter a valid SKU (numbers only).');
            }
    });
    
 // Validation function to check if the input is a valid number
 function validateSKU(sku) {
    return /^\d+$/.test(sku);
}
}

});
  

// ====== START OF ADD PRODUCT FORM ============
document.addEventListener('DOMContentLoaded', () => {
    const addProductForm = document.getElementById('addProductForm');
    const form = document.getElementById('productForm');
    const skuInput = document.getElementById('sku');

    // Event listener for form submission
    addProductForm.querySelector('form').addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent the form from submitting normally
        
        const skuValue = skuInput.value.trim();
    
        // Check if the SKU value is a valid number
        if (validateSKU(skuValue)) {
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
        } else {
            // If not valid, show an error message
            alert('Please enter a valid SKU (numbers only).');
        }
       
    });
    // Validation function to check if the input is a valid number
    function validateSKU(sku) {
        return /^\d+$/.test(sku);
}
});

// ====== START OF SEARCH FUNCTIONALITY ========
const minValue = document.getElementById("min-value");
const maxValue = document.getElementById("max-value");
const rangeFill = document.querySelector(".range-fill");

function validateRange() {
    const minPrice = parseInt(document.querySelector('.min-price').value);
    const maxPrice = parseInt(document.querySelector('.max-price').value);

    if (minPrice > maxPrice) {
        const tempValue = maxPrice;
        maxPrice = minPrice;
        minPrice = tempValue;
    }

    minValue.innerHTML = "$" + minPrice;
    maxValue.innerHTML = "$" + maxPrice;
}

const inputElements = document.querySelectorAll("input[type=range]");

inputElements.forEach((element) => {
    element.addEventListener("input", validateRange);
});

// ===== START OF PRICE =========

const minPriceRange = document.querySelector('.min-price');
const maxPriceRange = document.querySelector('.max-price');

if (minPriceRange && maxPriceRange) {
    minPriceRange.addEventListener('input', () => {
        minPrice = parseInt(minPriceRange.value);
        searchAndFilterProducts();
    });

    maxPriceRange.addEventListener('input', () => {
        maxPrice = parseInt(maxPriceRange.value);
        searchAndFilterProducts();
    });
}


// Function to search and filter products based on search query and price range
async function searchAndFilterProducts() {
    const searchQuery = document.getElementById('searchInput').value;
    let url = `/search?q=${searchQuery}`;

    // Check if the price range inputs have values
    const minPriceInput = document.querySelector('.min-price');
    const maxPriceInput = document.querySelector('.max-price');

    // Update minPrice and maxPrice if inputs have values
    if (minPriceInput.value !== "") {
        minPrice = parseInt(minPriceInput.value);
    }
    if (maxPriceInput.value !== "") {
        maxPrice = parseInt(maxPriceInput.value);
    }

    // Append price range parameters to the URL
    if (minPrice !== null && maxPrice !== null) {
        url += `&minPrice=${minPrice}&maxPrice=${maxPrice}`;
    }

    // Limit the number of output products to 10
    url += '&limit=10';
    
    try {
        const response = await fetch(url);
        const products = await response.json();
        displaySearchResults(products);
    } catch (error) {
        console.error('Error searching products:', error);
    }
}

// Add event listener for keypress event on the search input
document.getElementById('searchInput').addEventListener('keypress', function(event) {
    // Check if the key pressed is Enter (key code 13)
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission
        searchAndFilterProducts();

    }
});

// Add event listener for submit event on the search form
document.getElementById('searchForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from submitting normally
    searchAndFilterProducts();
});

// Add event listener for input event on price range inputs
document.getElementById('min-value').addEventListener('input', searchAndFilterProducts);
document.getElementById('max-value').addEventListener('input', searchAndFilterProducts);
function displayNoProductsFoundMessage() {
    const searchResults = document.getElementById('searchResults');
    searchResults.style.display = 'block';
    searchResults.innerText = 'No products found';
    searchResults.style.color = 'red';
    searchResults.style.fontWeight = 'bold';
}

function clearNoProductsFoundMessage() {
    const searchResults = document.getElementById('searchResults');
    searchResults.style.color = ''; // Reset the color
    searchResults.style.fontWeight = ''; // Reset the font weight
}

// Function to display search results on the page
function displaySearchResults(products) {
    const searchResultsContainer = document.getElementById('searchResults');
    const searchInput = document.getElementById('searchInput');
    const container = document.querySelector('.container');

    searchResultsContainer.style.display = 'block'; // Show the search product modal
    container.style.display = 'block';

    searchResultsContainer.innerHTML = ''; // Clear previous search results
    if (products.length === 0) {
        displayNoProductsFoundMessage();
    } else {
        clearNoProductsFoundMessage(); // Clear the styling if products are found
        const productList = document.createElement('ul');
        productList.classList.add('productList'); // Add the productList class
        products.forEach(product => {
            const productItem = document.createElement('li');
            productItem.innerHTML = `
                <div class="product-details">
                    <h2>Product Details</h2>
                    <p><strong>Name:</strong> ${product.name}</p>
                    <p><strong>SKU:</strong> ${product.sku}</p>
                    <p><strong>Type:</strong> ${product.type}</p>
                    <p><strong>Price:</strong> $${product.price}</p>
                    <p><strong>Description:</strong> ${product.description}</p>
                    <p><strong>Manufacturer:</strong> ${product.manufacturer}</p>
                    <p><strong>Model:</strong> ${product.model}</p>
                    <p><strong>URL:</strong> <a href="${product.url}">${product.url}</a></p>
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                </div>
            `;
            productList.appendChild(productItem);
        });
        searchResultsContainer.appendChild(productList);
    }
     // If another button is clicked, hide this
     const otherButtons = document.querySelectorAll('.other-buttons'); 
     otherButtons.forEach(button => {
         button.addEventListener('click', () => {
             searchInput.value = ''; // clear input field
             searchResultsContainer.style.display = 'none';
         });
     });

} // End of search

// ======== PAGINATION ===========
let currentPage = 1;

// Event listener for previous page button
document.getElementById('prevPageBtn').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchProducts(currentPage);
    }
});

// Event listener for next page button
document.getElementById('nextPageBtn').addEventListener('click', () => {
    currentPage++;
    fetchProducts(currentPage);
});

// Function to fetch products for a specific page
async function fetchProducts(page) {
    const searchQuery = document.getElementById('searchInput').value;
    const response = await fetch(`/search?q=${searchQuery}&page=${page}`);
    const products = await response.json();
    displaySearchResults(products);
    updatePageIndicator(page);
}

// Function to update the current page indicator
function updatePageIndicator(page) {
    document.getElementById('currentPage').textContent = `Page ${page}`;
}



