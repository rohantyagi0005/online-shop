// Dummy product data
const products = [
    { id: 1, name: "Lumina Jacket", price: 129.00, image: "https://via.placeholder.com/300/333/fff?text=Lumina", category: "Outerwear" },
    { id: 2, name: "Ethereal Sneakers", price: 89.00, image: "https://via.placeholder.com/300/333/fff?text=Ethereal", category: "Footwear" },
    { id: 3, name: "Vortex Bag", price: 45.00, image: "https://via.placeholder.com/300/333/fff?text=Vortex", category: "Accessories" },
    { id: 4, name: "Nebula Watch", price: 199.00, image: "https://via.placeholder.com/300/333/fff?text=Nebula", category: "Watches" },
    { id: 5, name: "Solaris Sunglasses", price: 55.00, image: "https://via.placeholder.com/300/333/fff?text=Solaris", category: "Accessories" },
    { id: 6, name: "Lunar Boots", price: 145.00, image: "https://via.placeholder.com/300/333/fff?text=Lunar", category: "Footwear" }
];

// App State
const state = {
    cart: JSON.parse(localStorage.getItem('evva_cart')) || [],
    category: 'All',
    search: ''
};

// Cart Functions
function updateCartCount() {
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.textContent = state.cart.length;
    }
}

function addToCart(productId) {
    state.cart.push({ id: productId, date: new Date() });
    localStorage.setItem('evva_cart', JSON.stringify(state.cart));
    updateCartCount();
    alert("Item added to cart!");
}
window.addToCart = addToCart;

// Render Functions
function createProductCard(product) {
    return `
        <div class="product-card">
            <div class="product-image">
                <span style="font-size: 1.5rem; opacity: 0.5;">${product.name}</span>
            </div>
            <div class="product-info">
                <span style="font-size: 0.8rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px;">${product.category}</span>
                <h3>${product.name}</h3>
                <p class="price">$${product.price.toFixed(2)}</p>
                <button class="add-btn" onclick="addToCart(${product.id})">Add to Cart</button>
            </div>
        </div>
    `;
}

function renderProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return; // Safely exit if element doesn't exist

    const homeProducts = products.slice(0, 4);
    grid.innerHTML = homeProducts.map(p => createProductCard(p)).join('');
}

function renderShopProducts() {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;

    let filtered = products;

    // Filter by Category
    if (state.category !== 'All') {
        filtered = filtered.filter(p => p.category === state.category);
    }

    // Filter by Search
    if (state.search) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(state.search.toLowerCase()));
    }

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.7; padding: 2rem;">No products found matching your criteria.</p>';
        return;
    }

    grid.innerHTML = filtered.map(p => createProductCard(p)).join('');
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    renderProducts();
    renderShopProducts();

    // Category Sidebar Logic
    const categoryLinks = document.querySelectorAll('.sidebar li');
    if (categoryLinks.length > 0) {
        categoryLinks.forEach(link => {
            link.addEventListener('click', () => {
                // UI Update
                categoryLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // State Update
                state.category = link.textContent.trim();
                renderShopProducts();
            });
        });
    }

    // Search Logic
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.search = e.target.value;
            // If on Shop page, render immediately
            if (document.getElementById('shop-grid')) {
                renderShopProducts();
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !document.getElementById('shop-grid')) {
                window.location.href = 'shop.html';
            }
        });
    }

    // Animation Effect for Products Section
    const productsSection = document.querySelector('.products');
    if (productsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        productsSection.style.opacity = '0';
        productsSection.style.transform = 'translateY(50px)';
        productsSection.style.transition = 'all 0.8s ease-out';
        observer.observe(productsSection);
    }

    // Clear History Logic
    const clearProps = document.querySelector('.clear-history-text');
    if (clearProps) {
        clearProps.addEventListener('click', () => {
            alert("History cleared!");
        });
    }
});
