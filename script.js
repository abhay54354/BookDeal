// Mobile swipe + desktop click flip
(function () {
    const wrappers = document.querySelectorAll('.book-wrapper');

    wrappers.forEach(wrapper => {
        const book = wrapper.querySelector('.book');
        if (!book) return;

        let startX = 0;
        let startY = 0;
        let isTouch = false;

        // TOUCH START
        wrapper.addEventListener('touchstart', (e) => {
            isTouch = true;
            const t = e.touches[0];
            startX = t.clientX;
            startY = t.clientY;
        }, { passive: true });

        // TOUCH END (SWIPE)
        wrapper.addEventListener('touchend', (e) => {
            const t = e.changedTouches[0];
            let diffX = t.clientX - startX;
            let diffY = t.clientY - startY;

            if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
                book.classList.toggle('show-back');
            }
        });

        // DESKTOP CLICK (ignore if touch already happened)
        wrapper.addEventListener('click', (e) => {
            if (isTouch) {
                isTouch = false;
                return;
            }
            book.classList.toggle('show-back');
        });

        // KEYBOARD
        wrapper.setAttribute('tabindex', '0');
        wrapper.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                book.classList.toggle('show-back');
            }
        });
    });

    // header scroll
    function updateHeader() {
        const header = document.getElementById('header');
        if (!header) return;
        const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollPos > 40) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    }

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
})();


// Mobile header hamburger toggle
(function () {
    const header = document.getElementById('header');
    const hamburger = header && header.querySelector('.hamburger');
    const nav = document.getElementById('site-nav');
    if (!hamburger || !nav || !header) return;

    function setOpen(open) {
        hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) header.classList.add('nav-open');
        else header.classList.remove('nav-open');
    }

    const overlay = document.getElementById('nav-overlay');
    if (overlay) overlay.addEventListener('click', () => setOpen(false));

    hamburger.addEventListener('click', () => {
        const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
        setOpen(!isOpen);
    });

    // Close menu when a link is clicked (mobile)
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));

    // Close on outside click (if not on header)
    document.addEventListener('click', (e) => {
        if (header && !header.contains(e.target)) setOpen(false);
    });
})();


// Hero shelf carousel: arrow controls, keyboard, and autoplay
(function () {
    const shelf = document.querySelector('.shelf-books');
    if (!shelf) return;
    const imgs = Array.from(shelf.querySelectorAll('img'));
    let center = Math.floor(imgs.length / 2); // start with middle

    function updatePositions() {
        imgs.forEach((img, i) => {
            img.classList.remove('pos-center', 'pos-left', 'pos-right', 'pos-hidden');
            const offset = i - center;
            if (offset === 0) img.classList.add('pos-center');
            else if (offset === -1) img.classList.add('pos-left');
            else if (offset === 1) img.classList.add('pos-right');
            else img.classList.add('pos-hidden');
        });
    }

    function prev() {
        center = (center - 1 + imgs.length) % imgs.length;
        updatePositions();
    }

    function next() {
        center = (center + 1) % imgs.length;
        updatePositions();
    }

    // init
    updatePositions();

    // arrows
    const left = document.querySelector('.hero-arrow.left');
    const right = document.querySelector('.hero-arrow.right');
    if (left) left.addEventListener('click', prev);
    if (right) right.addEventListener('click', next);

    // TOUCH SWIPE SUPPORT
    let startX = 0;
    let startY = 0;

    const heroShelf1 = document.querySelector('.hero-shelf');

    if (heroShelf1) {

        heroShelf1.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            startX = t.clientX;
            startY = t.clientY;
        }, { passive: true });

        heroShelf1.addEventListener('touchend', (e) => {
            const t = e.changedTouches[0];

            let diffX = t.clientX - startX;
            let diffY = t.clientY - startY;

            // horizontal swipe only
            if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {

                if (diffX < 0) {
                    // swipe left → next book
                    next();
                } else {
                    // swipe right → previous book
                    prev();
                }
            }
        });
    }

    // keyboard
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
    });

    // autoplay (pause on hover)
    let autoplay = setInterval(next, 4200);
    const heroShelf = document.querySelector('.hero-shelf');
    if (heroShelf) {
        heroShelf.addEventListener('mouseenter', () => clearInterval(autoplay));
        heroShelf.addEventListener('mouseleave', () => { autoplay = setInterval(next, 4200); });
    }
})();


// Simple cart and add-to-cart functionality (localStorage)------------------------------------------------
(function () {
    function readCart() {
        try {
            return JSON.parse(localStorage.getItem('bookdeal_cart') || '[]');
        } catch (e) {
            return [];
        }
    }

    function writeCart(cart) {
        localStorage.setItem('bookdeal_cart', JSON.stringify(cart));
        updateCartBadge();
    }

    function updateCartBadge() {
        const cart = readCart();
        const count = cart.length; // count unique items only
        const link = document.querySelector('.cart-link');
        if (link) {
            link.textContent = count > 0 ? `Cart (${count})` : 'Cart';
        }
    }

    // Add only one copy per unique item. Return true if added, false if already present.
    function addToCart(item) {
        const cart = readCart();
        const existing = cart.find(i => i.id === item.id);
        if (existing) {
            return false;
        } else {
            cart.push(Object.assign({ qty: 1 }, item));
            writeCart(cart);
            return true;
        }
    }

    // Page: book detail -> wire buttons
    const addBtn = document.getElementById('add-to-cart');
    const buyBtn = document.getElementById('buy-now');
    if (addBtn || buyBtn) {
        function gatherBookData() {
            const titleEl = document.querySelector('.detail-header h1');
            const authorEl = document.querySelector('.author-name');
            // Prefer the Sale Price inside the price box; fallback to the last .spec-value
            let priceEl = null;
            const priceItems = document.querySelectorAll('.detail-price-box .spec-item');
            if (priceItems && priceItems.length) {
                priceItems.forEach(pi => {
                    const label = pi.querySelector('.spec-label');
                    const value = pi.querySelector('.spec-value');
                    if (label && /sale price/i.test(label.textContent || '')) {
                        priceEl = value;
                    }
                });
            }
            if (!priceEl) priceEl = document.querySelector('.detail-price-box .spec-value:last-child');
            const imgEl = document.querySelector('.detail-visual .book-face.front img') || document.querySelector('.book-face.front img');

            const title = titleEl ? titleEl.textContent.trim() : 'Unknown title';
            const author = authorEl ? authorEl.textContent.replace(/^by\s*/i, '').trim() : '';
            // Normalize price text: extract numeric part (handles ₹, Rs, commas, spaces)
            let price = 0;
            if (priceEl && priceEl.textContent) {
                const m = priceEl.textContent.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
                price = m ? parseFloat(m[0]) : 0;
            }
            const image = imgEl ? imgEl.src : '';
            const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || Date.now().toString();

            return { id, title, author, price, image };
        }

        if (addBtn) addBtn.addEventListener('click', () => {
            const item = gatherBookData();
            const added = addToCart(item);
            addBtn.textContent = added ? 'Added' : 'Already in cart';
            setTimeout(() => addBtn.textContent = 'Add to Cart', 1400);
        });

        if (buyBtn) buyBtn.addEventListener('click', () => {
            const item = gatherBookData();
            addToCart(item); // if already present, addToCart returns false; we still go to cart
            window.location.href = 'cart.html';
        });
    }

    // Page: cart -> render items
    function formatRs(num) {
        return 'Rs. ' + Number(num).toFixed(2);
    }

    function renderCartPage() {
        const cartContainer = document.getElementById('cart-items');
        const totalPriceEl = document.querySelector('.total-price');
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (!cartContainer) return;

        const cart = readCart();
        cartContainer.innerHTML = '';
        if (cart.length === 0) {
            cartContainer.innerHTML = '<p>Your cart is empty.</p>';
            if (totalPriceEl) totalPriceEl.textContent = formatRs(0);
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        let total = 0;
        cart.forEach((item, idx) => {
            const itemTotal = (item.price || 0) * (item.qty || 1);
            total += itemTotal;

            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="cart-item-img">
                <div class="cart-item-info">
                    <h2 class="cart-item-title">${item.title} <span style="display:block; font-size:0.9rem; opacity:0.7;">by ${item.author}</span></h2>
                    <p class="cart-item-price">${formatRs(item.price)}</p>
                    <div class="cart-item-details">
                        <span>Language: Marathi</span>
                    </div>
                    <div style="display:flex; align-items:center; margin-top:8px;">
                        <div class="qty-num">Qty: ${item.qty || 1}</div>
                        <button class="remove-btn" data-idx="${idx}" style="margin-left:12px;">&times;</button>
                    </div>
                </div>
                <div class="cart-item-total">${formatRs(itemTotal)}</div>
            `;

            cartContainer.appendChild(div);
        });

        if (totalPriceEl) totalPriceEl.textContent = formatRs(total);
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.addEventListener('click', () => {
                alert('Proceeding to checkout — this demo redirects to homepage.');
                window.location.href = 'index.html';
            });
        }

        // Attach remove handlers only (no qty controls -- one copy per item)
        cartContainer.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-idx'));
                const cart = readCart();
                cart.splice(idx, 1);
                writeCart(cart);
                renderCartPage();
            });
        });
    }

    // Run on load
    document.addEventListener('DOMContentLoaded', () => {
        updateCartBadge();
        renderCartPage();
    });

})();