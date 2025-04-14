// Initialize product stock data
let productStock = JSON.parse(localStorage.getItem("productStock")) || {
    "PC Gaming Ryzen 5": 90,
    "Jam Tangan Premium": 100,
    "Laptop Gaming": 90,
    "Smartphone Premium": 80,
    "Headphone Wireless": 150,
    "Keyboard Gaming": 200,
    "Mouse Gaming": 250,
    "Monitor Gaming": 70,
    "Speaker Bluetooth": 120,
    "Kamera Digital": 90
};

// Save initial stock data if it doesn't exist yet
if (!localStorage.getItem("productStock")) {
    localStorage.setItem("productStock", JSON.stringify(productStock));
}

// Initialize or load cart from localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];
if (!Array.isArray(cart)) cart = [];
updateCartDisplay();
updateProductButtons();

// Fetch products from APIs
async function fetchApiProducts() {
    try {
        // Fetch from DummyJSON API
        const dummyResponse = await fetch('https://dummyjson.com/products');
        const dummyData = await dummyResponse.json();
        
        // Fetch from FakeStore API
        const fakeStoreResponse = await fetch('https://fakestoreapi.com/products');
        const fakeStoreData = await fakeStoreResponse.json();
        
        // Process and render API products
        processApiProducts(dummyData.products, 'dummyjson');
        processApiProducts(fakeStoreData, 'fakestore');
        
        // Update product buttons and pagination after adding API products
        updateProductButtons();
        setupPagination();
    } catch (error) {
        console.error('Error fetching API products:', error);
        showNotification('Gagal memuat produk dari API');
    }
}

function processApiProducts(products, source) {
    const productsContainer = document.getElementById("products");
    
    // Limit to 5 products from each API for demonstration
    const limitedProducts = products.slice(0, 20);
    
    limitedProducts.forEach(product => {
        // Generate random stock between 3 and 20
        const stock = Math.floor(Math.random() * 18) + 50;
        
        // Format data based on API source
        let name, price, image;
        
        if (source === 'dummyjson') {
            name = product.title;
            price = product.price * 15000; // Convert to IDR
            image = product.thumbnail;
        } else {
            name = product.title;
            price = product.price * 15000; // Convert to IDR
            image = product.image;
        }
        
        // Add to product stock
        productStock[name] = stock;
        
        // Create product element
        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        
        // Add API logo badge
        const apiSource = source === 'dummyjson' ? 'DummyJSON' : 'FakeStore';
        
        productDiv.innerHTML = `
            <div class="api-badge">${apiSource} API</div>
            <img src="${image}" alt="${name}">
            <h3>${name}</h3>
            <p>Rp ${price.toLocaleString("id-ID")}</p>
            <p class="product-date">Tanggal Upload : ${getCurrentDate()}</p>
            <div class="stock-info">Stok: ${stock}</div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="decreaseQuantity(this)">-</button>
                <input type="number" class="quantity-input" value="1" min="1" max="10">
                <button class="quantity-btn" onclick="increaseQuantity(this)">+</button>
            </div>
            <button onclick="addToCartWithQuantity(this, '${name.replace("'", "\\'")}', ${price}, '${image.replace("'", "\\'")}')">Tambah ke Keranjang</button>
        `;
        
        productsContainer.appendChild(productDiv);
    });
    
    // Save updated stock
    saveStock();
}

function getCurrentDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function scrollToProducts() {
    document.getElementById("products").scrollIntoView({ behavior: "smooth" });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function increaseQuantity(button) {
    const input = button.previousElementSibling;
    const product = button.closest('.product');
    const productName = product.querySelector('h3').textContent;
    const currentValue = parseInt(input.value);
    const maxStock = productStock[productName];
    
    // Calculate max quantity considering what's already in cart
    const cartItem = cart.find(item => item.name === productName);
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    const availableStock = maxStock - cartQuantity;
    
    if (currentValue < availableStock) {
        input.value = currentValue + 1;
    } else {
        showNotification(`Stok tersedia untuk ${productName} hanya ${availableStock} unit`);
    }
}

function decreaseQuantity(button) {
    const input = button.nextElementSibling;
    const currentValue = parseInt(input.value);
    if (currentValue > parseInt(input.min)) {
        input.value = currentValue - 1;
    }
}

function addToCartWithQuantity(button, name, price, image) {
    const product = button.closest('.product');
    const quantityInput = product.querySelector('.quantity-input');
    const quantity = parseInt(quantityInput.value);
    
    // Check available stock
    const availableStock = productStock[name];
    
    // Check if product already in cart
    const existingItemIndex = cart.findIndex(item => item.name === name);
    
    if (existingItemIndex !== -1) {
        // Calculate new total quantity
        const newTotalQuantity = cart[existingItemIndex].quantity + quantity;
        
        // Validate against available stock
        if (newTotalQuantity > availableStock) {
            showNotification(`Stok tidak cukup! Tersedia: ${availableStock}, Di keranjang: ${cart[existingItemIndex].quantity}`);
            return;
        }
        
        // Update quantity if product already exists
        cart[existingItemIndex].quantity = newTotalQuantity;
    } else {
        // Validate quantity against available stock
        if (quantity > availableStock) {
            showNotification(`Stok tidak cukup! Tersedia: ${availableStock}`);
            return;
        }
        
        // Add new item to cart
        cart.push({ name, price, image, quantity });
    }
    
    saveCart();
    updateCartDisplay();
    updateProductButtons();
    
    // Reset quantity to 1
    quantityInput.value = 1;
    
    // Show notification
    showNotification(`${quantity} x ${name} ditambahkan ke keranjang`);
}

function updateProductButtons() {
    const products = document.querySelectorAll('.product');
    
    products.forEach(product => {
        const productName = product.querySelector('h3').textContent;
        const stockElement = product.querySelector('.stock-info');
        const addButton = product.querySelector('button:last-child');
        const quantityControls = product.querySelector('.quantity-controls');
        
        // Update stock display
        if (stockElement) {
            stockElement.textContent = `Stok: ${productStock[productName] || 0}`;
            
            // Change color based on stock level
            if (productStock[productName] <= 0) {
                stockElement.style.color = "#e20c0c";
            } else if (productStock[productName] <= 3) {
                stockElement.style.color = "#ffae00";
            } else {
                stockElement.style.color = "#64ffda";
            }
        }
        
        // Check if item is in cart
        const cartItem = cart.find(item => item.name === productName);
        
        // Update button state based on stock and cart status
        if (productStock[productName] <= 0) {
            // Out of stock
            addButton.disabled = true;
            addButton.style.backgroundColor = "#a0a0a0";
            addButton.style.cursor = "not-allowed";
           
            
            // Disable quantity controls
            const minusBtn = quantityControls.querySelector('button:first-child');
            const plusBtn = quantityControls.querySelector('button:last-child');
            minusBtn.disabled = true;
            plusBtn.disabled = true;
            minusBtn.style.backgroundColor = "#a0a0a0";
            plusBtn.style.backgroundColor = "#a0a0a0";
            minusBtn.style.cursor = "not-allowed";
            plusBtn.style.cursor = "not-allowed";
        } else if (cartItem) {
            // Item is in cart
           
            
            // Enable minus button, but check plus button based on available stock
            const minusBtn = quantityControls.querySelector('button:first-child');
            const plusBtn = quantityControls.querySelector('button:last-child');
            minusBtn.disabled = false;
            minusBtn.style.backgroundColor = "#64ffda";
            minusBtn.style.cursor = "pointer";
            
            // Check if we can add more to cart based on remaining stock
            if (productStock[productName] <= cartItem.quantity) {
                plusBtn.disabled = true;
                plusBtn.style.backgroundColor = "#a0a0a0";
                plusBtn.style.cursor = "not-allowed";
            } else {
                plusBtn.disabled = false;
                plusBtn.style.backgroundColor = "#64ffda";
                plusBtn.style.cursor = "pointer";
            }
        } else {
            // Normal state - item not in cart and has stock
            addButton.disabled = false;
            addButton.style.backgroundColor = "#64ffda";
            addButton.style.cursor = "pointer";
            
            
            // Enable quantity controls
            const minusBtn = quantityControls.querySelector('button:first-child');
            const plusBtn = quantityControls.querySelector('button:last-child');
            minusBtn.disabled = false;
            plusBtn.disabled = false;
            minusBtn.style.backgroundColor = "#64ffda";
            plusBtn.style.backgroundColor = "#64ffda";
            minusBtn.style.cursor = "pointer";
            plusBtn.style.cursor = "pointer";
        }
    });
}

function showNotification(message) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.position = 'fixed';
        notification.style.bottom = '80px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#64ffda';
        notification.style.color = '#112240';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '1002';
        notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        notification.style.transition = 'opacity 0.3s ease-in-out';
        document.body.appendChild(notification);
    }
    
    // Show notification with message
    notification.textContent = message;
    notification.style.opacity = '1';
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 3000);
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function saveStock() {
    localStorage.setItem("productStock", JSON.stringify(productStock));
}

function updateCartDisplay() {
    const cartItems = document.getElementById("cart-items");
    const cartTotalElement = document.getElementById("cart-total");
    const cartCount = document.getElementById("cart-count");
    const floatingCartCount = document.getElementById("floating-cart-count");
    
    cartItems.innerHTML = "";
    let totalPrice = 0;
    let totalItems = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = "<li style='justify-content: center; padding: 20px;'>Keranjang kosong</li>";
    } else {
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;
            totalItems += item.quantity;
            
            const li = document.createElement("li");
            li.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <div>${item.name}</div>
                    <div>Rp ${item.price.toLocaleString("id-ID")}</div>
                    <div class="cart-item-quantity">
                        <button class="cart-quantity-btn" onclick="updateCartItemQuantity(${index}, ${item.quantity - 1})">-</button>
                        <input type="number" class="cart-quantity-input" value="${item.quantity}" min="1" max="${productStock[item.name]}" 
                            onchange="updateCartItemQuantity(${index}, this.value)">
                        <button class="cart-quantity-btn" onclick="updateCartItemQuantity(${index}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <div>Rp ${itemTotal.toLocaleString("id-ID")}</div>
                <button class="remove-btn" onclick="removeFromCart(${index})">×</button>
            `;
            cartItems.appendChild(li);
        });
    }

    cartTotalElement.textContent = totalPrice.toLocaleString("id-ID");
    cartCount.textContent = totalItems;
    floatingCartCount.textContent = totalItems;
}

function updateCartItemQuantity(index, newQuantity) {
    newQuantity = parseInt(newQuantity);
    
    if (newQuantity <= 0) {
        removeFromCart(index);
        return;
    }
    
    const item = cart[index];
    
    // Check if new quantity exceeds available stock
    if (newQuantity > productStock[item.name]) {
        showNotification(`Stok ${item.name} hanya tersisa ${productStock[item.name]}`);
        newQuantity = productStock[item.name];
    }
    
    cart[index].quantity = newQuantity;
    saveCart();
    updateCartDisplay();
    updateProductButtons();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartDisplay();
    updateProductButtons();
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartDisplay();
    updateProductButtons();
}

function toggleCart() {
    let cartOverlay = document.getElementById("cart-overlay");
    cartOverlay.style.display = (cartOverlay.style.display === "flex") ? "none" : "flex";
}

function toggleContact() {
    let contactOverlay = document.getElementById("contact-overlay");
    contactOverlay.style.display = (contactOverlay.style.display === "flex") ? "none" : "flex";
}

function generateReceipt() {
    // Get current date and time
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('id-ID');
    
    // Generate random receipt number
    const receiptNumber = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    
    // Set default customer name since login is removed
    const customerName = 'Pelanggan';
    
    // Calculate total and total items
    let totalAmount = 0;
    let totalItems = 0;
    
    // Create receipt content
    let receiptItems = '';
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        totalItems += item.quantity;
        
        // Add item details to receipt
        receiptItems += `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}x</td>
                <td>Rp ${item.price.toLocaleString('id-ID')}</td>
                <td>Rp ${itemTotal.toLocaleString('id-ID')}</td>
            </tr>
        `;
    });
    
    // Create receipt HTML
    const receiptHTML = `
        <div class="receipt">
            <div class="receipt-header">
                <div class="store-name">Onika Online Shop</div>
                <div class="receipt-title">STRUK BELANJA</div>
                <div class="receipt-number">${receiptNumber}</div>
                <div class="receipt-date">${dateStr} - ${timeStr}</div>
                <div class="customer-info">Pelanggan: ${customerName}</div>
            </div>
            
            <div class="receipt-separator">--------------------------------</div>
            
            <table class="receipt-items">
                <thead>
                    <tr>
                        <th>Produk</th>
                        <th>Qty</th>
                        <th>Harga</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${receiptItems}
                </tbody>
            </table>
            
            <div class="receipt-separator">--------------------------------</div>
            
            <div class="receipt-summary">
                <div class="summary-item">
                    <span>Total Item:</span>
                    <span>${totalItems} item</span>
                </div>
                <div class="summary-item total-amount">
                    <span>Total Harga:</span>
                    <span>Rp ${totalAmount.toLocaleString('id-ID')}</span>
                </div>
            </div>
            
            <div class="receipt-separator">--------------------------------</div>
            
            <div class="receipt-footer">
                <div>Terima kasih telah berbelanja</div>
                <div>di Onika Online Shop</div>
                <div class="support-info">Hubungi kami: 0895328620093</div>
            </div>
        </div>
    `;
    
    return { html: receiptHTML, totalAmount: totalAmount };
}

function checkout() {
    if (cart.length === 0) {
        showNotification("Keranjang belanja kosong");
        return;
    }
    
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
        showNotification("Silahkan login terlebih dahulu untuk checkout");
        window.location.href = "login.html";
        return;
    }
    
    // Create receipt overlay if it doesn't exist
    let receiptOverlay = document.getElementById("receipt-overlay");
    if (!receiptOverlay) {
        receiptOverlay = document.createElement('div');
        receiptOverlay.id = "receipt-overlay";
        receiptOverlay.className = "cart-overlay";
        document.body.appendChild(receiptOverlay);
    }
    
    // Generate receipt
    const receipt = generateReceipt();
    
    
    // Create receipt container
    receiptOverlay.innerHTML = `
        <div class="receipt-container">
            ${receipt.html}
            <div class="receipt-actions">
                <button class="print-btn" onclick="window.print()">Print Struk</button>
                <button class="whatsapp-btn" onclick="sendToWhatsApp()">Kirim via WhatsApp</button>
                <button class="close-btn" onclick="hideReceipt()">Tutup</button>
            </div>
        </div>
    `;
    
    // Update stock after checkout
    cart.forEach(item => {
        productStock[item.name] -= item.quantity;
    });
    
    // Save updated stock
    saveStock();
    
    // Show receipt
    receiptOverlay.style.display = "flex";
    
    // Clear cart after checkout
    clearCart();
    
    // Hide cart
    document.getElementById("cart-overlay").style.display = "none";
}
// Function to save sale record
function saveSaleRecord(receipt) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const now = new Date();
    
    const saleRecord = {
        id: 'SALE-' + Math.floor(100000 + Math.random() * 900000),
        date: now.toISOString(),
        formattedDate: now.toLocaleDateString('id-ID', {
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        }),
        formattedTime: now.toLocaleTimeString('id-ID'),
        customer: currentUser.username,
        items: cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity
        })),
        totalAmount: receipt.totalAmount
    };
    
    // Get existing sales or initialize empty array
    const sales = JSON.parse(localStorage.getItem("salesRecords")) || [];
    
    // Add new sale
    sales.push(saleRecord);
    
    // Save back to localStorage
    localStorage.setItem("salesRecords", JSON.stringify(sales));
}
function hideReceipt() {
    document.getElementById("receipt-overlay").style.display = "none";
}

function sendToWhatsApp() {
    // Prepare order summary
    let orderSummary = "📝 *PESANAN DARI ONIKA SHOP* 📝\n\n";
    
    // Add items
    cart.forEach(item => {
        orderSummary += `*${item.name}*\n`;
        orderSummary += `Jumlah: ${item.quantity}\n`;
        orderSummary += `Harga: Rp ${item.price.toLocaleString("id-ID")}\n`;
        orderSummary += `Subtotal: Rp ${(item.price * item.quantity).toLocaleString("id-ID")}\n\n`;
    });
    
    // Add total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    orderSummary += `💰 *Total Bayar: Rp ${total.toLocaleString("id-ID")}*`;
    
    // Redirect to WhatsApp with order summary
    const encodedSummary = encodeURIComponent(orderSummary);
    window.open(`https://wa.me/0895328620093?text=${encodedSummary}`, '_blank');
}

function searchProducts() {
    let input = document.getElementById("search-bar").value.toLowerCase();
    let products = document.querySelectorAll(".product");

    products.forEach(product => {
        let productName = product.querySelector("h3").innerText.toLowerCase();
        product.style.display = productName.includes(input) ? "block" : "none";
    });
}

function sortProducts() {
    let productContainer = document.getElementById("products");
    let products = Array.from(document.querySelectorAll(".product"));

    let sortPrice = document.getElementById("sort-price").value;
    let sortDate = document.getElementById("sort-date").value;

    products.sort((a, b) => {
        let priceA = parseInt(a.querySelector("p").innerText.replace(/\D/g, ""));
        let priceB = parseInt(b.querySelector("p").innerText.replace(/\D/g, ""));

        let dateA = new Date(a.querySelector(".product-date").innerText.replace("Tanggal Upload : ", ""));
        let dateB = new Date(b.querySelector(".product-date").innerText.replace("Tanggal Upload : ", ""));

        if (sortPrice === "low-high") return priceA - priceB;
        if (sortPrice === "high-low") return priceB - priceA;
        if (sortDate === "new-old") return dateB - dateA;
        if (sortDate === "old-new") return dateA - dateB;

        return 0; // Jika tidak ada filter yang dipilih
    });

    productContainer.innerHTML = "";
    products.forEach(product => productContainer.appendChild(product));
}

// Setup pagination function
function setupPagination() {
    const products = document.querySelectorAll('.product');
    const itemsPerPage = 8;
    let currentPage = 1;

    function displayProducts() {
        let start = (currentPage - 1) * itemsPerPage;
        let end = start + itemsPerPage;

        products.forEach((product, index) => {
            if (index >= start && index < end) {
                product.style.display = "block";
            } else {
                product.style.display = "none";
            }
        });

        document.getElementById("page-number").textContent = currentPage;
    }

    function nextPage() {
        if (currentPage * itemsPerPage < products.length) {
            currentPage++;
            displayProducts();
        }
    }

    function prevPage() {
        if (currentPage > 1) {
            currentPage--;
            displayProducts();
        }
    }

    document.getElementById("next-btn").addEventListener("click", nextPage);
    document.getElementById("prev-btn").addEventListener("click", prevPage);

    displayProducts();
}

// Document ready event listener - simplified without login functionality
document.addEventListener("DOMContentLoaded", function() {
    // Add stock information to each product
    const products = document.querySelectorAll('.product');
    products.forEach(product => {
        const productName = product.querySelector('h3').textContent;
        const productPrice = product.querySelector('p');
        
        // Create stock info element if it doesn't exist yet
        if (!product.querySelector('.stock-info')) {
            const stockInfo = document.createElement('div');
            stockInfo.className = 'stock-info';
            stockInfo.textContent = `Stok: ${productStock[productName] || 0}`;
            
            // Insert stock info after price
            productPrice.after(stockInfo);
        }
    });
    
    // Update product buttons initial state
    updateProductButtons();
    
    // Fetch API products
    fetchApiProducts();
});

// Add these arrays at the top of your script.js file, after your productStock initialization
let productCategories = {
    "PC Gaming Ryzen 5": "Computer",
    "Jam Tangan Premium": "Fashion",
    "Laptop Gaming": "Computer",
    "Smartphone Premium": "Gadget",
    "Headphone Wireless": "Audio",
    "Keyboard Gaming": "Computer Accessories",
    "Mouse Gaming": "Computer Accessories",
    "Monitor Gaming": "Computer Accessories",
    "Speaker Bluetooth": "Audio",
    "Kamera Digital": "Camera"
};

let productMaterials = {
    "PC Gaming Ryzen 5": "Metal & Plastic",
    "Jam Tangan Premium": "Stainless Steel",
    "Laptop Gaming": "Aluminum",
    "Smartphone Premium": "Glass & Aluminum",
    "Headphone Wireless": "Plastic & Leather",
    "Keyboard Gaming": "ABS Plastic",
    "Mouse Gaming": "Plastic",
    "Monitor Gaming": "Plastic & Glass",
    "Speaker Bluetooth": "Plastic & Fabric",
    "Kamera Digital": "Metal & Plastic"
};

// Function to extract unique values for filter options
function getUniqueFilterOptions() {
    const categories = new Set();
    const materials = new Set();
    
    // Add all categories and materials from our products
    Object.values(productCategories).forEach(category => categories.add(category));
    Object.values(productMaterials).forEach(material => materials.add(material));
    
    return {
        categories: Array.from(categories).sort(),
        materials: Array.from(materials).sort()
    };
}

// Add this to your fetchApiProducts function, right before processing products
function processApiProducts(products, source) {
    const productsContainer = document.getElementById("products");
    
    // Limit to 5 products from each API for demonstration
    const limitedProducts = products.slice(0, 40);
    
    limitedProducts.forEach(product => {
        // Generate random stock between 3 and 20
        const stock = Math.floor(Math.random() * 18) + 50;
        
        // Format data based on API source
        let name, price, image;
        
        if (source === 'dummyjson') {
            name = product.title;
            price = product.price * 15000; // Convert to IDR
            image = product.thumbnail;
            
            // Assign categories and materials based on product category
            if (product.category) {
                // Convert API category to our category system
                const categoryMap = {
                    'smartphones': 'Gadget',
                    'laptops': 'Computer',
                    'fragrances': 'Beauty',
                    'skincare': 'Beauty',
                    'groceries': 'Food',
                    'home-decoration': 'Home',
                    'furniture': 'Home',
                    'tops': 'Fashion',
                    'womens-dresses': 'Fashion',
                    'womens-shoes': 'Fashion',
                    'mens-shirts': 'Fashion',
                    'mens-shoes': 'Fashion',
                    'mens-watches': 'Fashion',
                    'womens-watches': 'Fashion',
                    'womens-bags': 'Fashion',
                    'womens-jewellery': 'Fashion',
                    'sunglasses': 'Fashion',
                    'automotive': 'Automotive',
                    'motorcycle': 'Automotive',
                    'lighting': 'Home'
                };
                
                productCategories[name] = categoryMap[product.category] || 'Other';
                
                // Assign material based on category
                const materialMap = {
                    'smartphones': 'Glass & Aluminum',
                    'laptops': 'Aluminum & Plastic',
                    'fragrances': 'Glass',
                    'skincare': 'Plastic',
                    'groceries': 'Organic',
                    'home-decoration': 'Various',
                    'furniture': 'Wood',
                    'tops': 'Cotton',
                    'womens-dresses': 'Cotton & Polyester',
                    'womens-shoes': 'Leather',
                    'mens-shirts': 'Cotton',
                    'mens-shoes': 'Leather',
                    'mens-watches': 'Stainless Steel',
                    'womens-watches': 'Stainless Steel',
                    'womens-bags': 'Leather',
                    'womens-jewellery': 'Metal',
                    'sunglasses': 'Plastic',
                    'automotive': 'Metal',
                    'motorcycle': 'Metal',
                    'lighting': 'Plastic & Metal'
                };
                
                productMaterials[name] = materialMap[product.category] || 'Various';
            }
        } else {
            name = product.title;
            price = product.price * 15000; // Convert to IDR
            image = product.image;
            
            // Categorize FakeStore API products
            if (product.category) {
                const categoryMap = {
                    'electronics': 'Gadget',
                    'jewelery': 'Fashion',
                    "men's clothing": 'Fashion',
                    "women's clothing": 'Fashion'
                };
                
                productCategories[name] = categoryMap[product.category] || 'Other';
                
                // Materials for FakeStore API
                const materialMap = {
                    'electronics': 'Metal & Plastic',
                    'jewelery': 'Gold & Silver',
                    "men's clothing": 'Cotton & Polyester',
                    "women's clothing": 'Cotton & Polyester'
                };
                
                productMaterials[name] = materialMap[product.category] || 'Various';
            }
        }
        
        // Add to product stock
        productStock[name] = stock;
        
        // Create product element
        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        productDiv.dataset.category = productCategories[name] || 'Other';
        productDiv.dataset.material = productMaterials[name] || 'Various';
        
        // Add API logo badge
        const apiSource = source === 'dummyjson' ? 'DummyJSON' : 'FakeStore';
        
        productDiv.innerHTML = `
            <div class="api-badge">${apiSource} API</div>
            <img src="${image}" alt="${name}">
            <h3>${name}</h3>
            <p>Rp ${price.toLocaleString("id-ID")}</p>
            <p class="product-date">Tanggal Upload : ${getCurrentDate()}</p>
            <div class="stock-info">Stok: ${stock}</div>
            <div class="product-specs">
                <span class="product-category">Kategori: ${productCategories[name] || 'Other'}</span>
                <br><br>
                <span class="product-material">Material: ${productMaterials[name] || 'Various'}</span>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="decreaseQuantity(this)">-</button>
                <input type="number" class="quantity-input" value="1" min="1" max="10">
                <button class="quantity-btn" onclick="increaseQuantity(this)">+</button>
            </div>
            <button onclick="addToCartWithQuantity(this, '${name.replace("'", "\\'")}', ${price}, '${image.replace("'", "\\'")}')">Tambah ke Keranjang</button>
        `;
        
        productsContainer.appendChild(productDiv);
    });
    
    // Save updated stock
    saveStock();
    
    // Update filter options after adding new products
    populateFilterOptions();
}

// Add this function to populate filter options
function populateFilterOptions() {
    const filterOptions = getUniqueFilterOptions();
    const categoryFilter = document.getElementById('category-filter');
    const materialFilter = document.getElementById('material-filter');
    
    // Clear existing options except the first one
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    while (materialFilter.options.length > 1) {
        materialFilter.remove(1);
    }
    
    // Add category options
    filterOptions.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    
    // Add material options
    filterOptions.materials.forEach(material => {
        const option = document.createElement('option');
        option.value = material;
        option.textContent = material;
        materialFilter.appendChild(option);
    });
}

// Update the searchProducts function to include filters
function searchProducts() {
    let input = document.getElementById("search-bar").value.toLowerCase();
    let categoryFilter = document.getElementById("category-filter").value;
    let materialFilter = document.getElementById("material-filter").value;
    let products = document.querySelectorAll(".product");

    products.forEach(product => {
        let productName = product.querySelector("h3").innerText.toLowerCase();
        const productNameText = product.querySelector("h3").textContent;
        let productCategory = productCategories[productNameText] || 'Other';
        let productMaterial = productMaterials[productNameText] || 'Various';
        
        // Check if product matches all filters
        let matchesSearch = productName.includes(input);
        let matchesCategory = categoryFilter === "" || productCategory === categoryFilter;
        let matchesMaterial = materialFilter === "" || productMaterial === materialFilter;
        
        // Show product only if it matches all selected filters
        if (matchesSearch && matchesCategory && matchesMaterial) {
            product.style.display = "block";
        } else {
            product.style.display = "none";
        }
    });
}

// Update your sortProducts function to keep filters when sorting
function sortProducts() {
    let productContainer = document.getElementById("products");
    let products = Array.from(document.querySelectorAll(".product"));

    let sortPrice = document.getElementById("sort-price").value;
    let sortDate = document.getElementById("sort-date").value;

    products.sort((a, b) => {
        let priceA = parseInt(a.querySelector("p").innerText.replace(/\D/g, ""));
        let priceB = parseInt(b.querySelector("p").innerText.replace(/\D/g, ""));

        let dateA = new Date(a.querySelector(".product-date").innerText.replace("Tanggal Upload : ", ""));
        let dateB = new Date(b.querySelector(".product-date").innerText.replace("Tanggal Upload : ", ""));

        if (sortPrice === "low-high") return priceA - priceB;
        if (sortPrice === "high-low") return priceB - priceA;
        if (sortDate === "new-old") return dateB - dateA;
        if (sortDate === "old-new") return dateA - dateB;

        return 0; // Jika tidak ada filter yang dipilih
    });

    productContainer.innerHTML = "";
    products.forEach(product => productContainer.appendChild(product));
    
    // After sorting, apply current filters again
    searchProducts();
}

// Update your DOMContentLoaded event
document.addEventListener("DOMContentLoaded", function() {
    // Add initial category and material data to existing products
    const existingProducts = document.querySelectorAll('.product');
    existingProducts.forEach(product => {
        const productName = product.querySelector('h3').textContent;
        product.dataset.category = productCategories[productName] || 'Other';
        product.dataset.material = productMaterials[productName] || 'Various';
        
        // Add product specs display
        if (!product.querySelector('.product-specs')) {
            const specsDiv = document.createElement('div');
            specsDiv.className = 'product-specs';
            specsDiv.innerHTML = `
                <span class="product-category">Kategori: ${productCategories[productName] || 'Other'}</span>
                <br><br>
                <span class="product-material">Material: ${productMaterials[productName] || 'Various'}</span>
            `;
            
            // Insert specs after stock info
            const stockInfo = product.querySelector('.stock-info');
            if (stockInfo) {
                stockInfo.after(specsDiv);
            } else {
                const productPrice = product.querySelector('p');
                productPrice.after(specsDiv);
            }
        }
    });
    
    // Add stock information to each product
    const products = document.querySelectorAll('.product');
    products.forEach(product => {
        const productName = product.querySelector('h3').textContent;
        const productPrice = product.querySelector('p');
        
        // Create stock info element if it doesn't exist yet
        if (!product.querySelector('.stock-info')) {
            const stockInfo = document.createElement('div');
            stockInfo.className = 'stock-info';
            stockInfo.textContent = `Stok: ${productStock[productName] || 0}`;
            
            // Insert stock info after price
            productPrice.after(stockInfo);
        }
    });
    
    // Populate filter options based on initial products
    populateFilterOptions();
    
    // Update product buttons initial state
    updateProductButtons();
    
    // Fetch API products
    fetchApiProducts();
});

// Add event listeners for filtering
document.getElementById('category-filter').addEventListener('change', searchProducts);
document.getElementById('material-filter').addEventListener('change', searchProducts);
function logout() {
    // Remove user data from both storage types
    localStorage.removeItem("currentUser");
    sessionStorage.removeItem("currentUser");
    // Also remove username for backward compatibility
    localStorage.removeItem("username");
    
    // Redirect to login page
    window.location.href = "login.html";
}
// Inisialisasi Firebase (JANGAN pakai import)
const firebaseConfig = {
    apiKey: "AIzaSyAwybEPZircQZ72IQYulRhqO_AbLrSbO9U",
    authDomain: "onika-54b19.firebaseapp.com",
    databaseURL: "https://onika-54b19-default-rtdb.firebaseio.com",
    projectId: "onika-54b19",
    storageBucket: "onika-54b19.firebasestorage.app",
    messagingSenderId: "309469279201",
    appId: "1:309469279201:web:4a6f6c98420c62f45d58a0",
    measurementId: "G-T7LKW8F5K7"
  };
  
  // Gunakan firebase versi compat
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
// Ambil stok dari Firebase saat halaman dibuka
firebase.database().ref("stok").on("value", function(snapshot) {
    const data = snapshot.val();
    if (data && data.jumlah !== undefined) {
      document.getElementById("stok").innerText = data.jumlah;
    }
  });
  
  // Fungsi untuk menambah stok dan simpan ke Firebase
  function tambahStok() {
    let current = parseInt(document.getElementById("stok").innerText);
    current += 1;
    document.getElementById("stok").innerText = current;
    firebase.database().ref("stok").set({ jumlah: current });
  }
    