document.addEventListener("DOMContentLoaded", function() {
    // Seletores
    const addButtons = document.querySelectorAll(".btn-secondary");
    const productCards = document.querySelectorAll(".product-card");
    const cartModal = document.querySelector(".cart-modal");
    const closeCartBtn = document.querySelector(".close-btn");
    const cartItemsContainer = document.querySelector(".cart-items");
    const cartTotalEl = document.querySelector(".cart-footer span");
    const checkoutBtn = document.getElementById("checkout-btn");
    const continueBtn = document.getElementById("continue-btn");
    const meusPedidosBtn = document.getElementById("meus-pedidos");

    let cart = [];

    // Formatar preço
    function formatPrice(price) {
        return "R$ " + price.toFixed(2).replace(".", ",");
    }

    // Abrir e fechar modal
    function openCart() {
        cartModal.classList.remove("hidden");
    }

    function closeCart() {
        cartModal.classList.add("hidden");
    }

    // Atualizar total
    function updateTotal() {
        let total = 0;
        cart.forEach(item => total += item.price * item.quantity);
        cartTotalEl.textContent = formatPrice(total);
    }

    // Renderizar itens do carrinho
    function renderCart() {
        cartItemsContainer.innerHTML = "";

        cart.forEach((item, index) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${item.name} — ${formatPrice(item.price)}</span>
                <span class="qty-wrapper">
                    <button class="qty-minus" data-index="${index}">-</button>
                    <input type="number" min="1" value="${item.quantity}" data-index="${index}">
                    <button class="qty-plus" data-index="${index}">+</button>
                </span>
                <span>${formatPrice(item.price * item.quantity)}</span>
            `;
            cartItemsContainer.appendChild(li);
        });

        // Eventos de quantidade
        document.querySelectorAll(".qty-wrapper input").forEach(input => {
            input.addEventListener("change", function(e) {
                const idx = parseInt(e.target.dataset.index);
                let val = parseInt(e.target.value);
                if (val < 1) val = 1;
                cart[idx].quantity = val;
                renderCart();
            });
        });

        document.querySelectorAll(".qty-plus").forEach(btn => {
            btn.addEventListener("click", function() {
                const idx = parseInt(btn.dataset.index);
                cart[idx].quantity++;
                renderCart();
            });
        });

        document.querySelectorAll(".qty-minus").forEach(btn => {
            btn.addEventListener("click", function() {
                const idx = parseInt(btn.dataset.index);
                if (cart[idx].quantity > 1) cart[idx].quantity--;
                renderCart();
            });
        });

        updateTotal();
    }

    // Adicionar produto ao carrinho
    function addToCart(card) {
        const name = card.querySelector(".product-name").textContent;
        const priceText = card.querySelector(".product-price").textContent.replace("R$", "").replace(",", ".").trim();
        const price = parseFloat(priceText);

        const existingIndex = cart.findIndex(p => p.name === name);
        if (existingIndex > -1) {
            cart[existingIndex].quantity += 1;
        } else {
            cart.push({ name, price, quantity: 1 });
        }

        renderCart();
        openCart();
    }

    // Eventos de clique nos botões e cards
    addButtons.forEach(btn => {
        btn.addEventListener("click", function(e) {
            e.stopPropagation();
            const card = e.target.closest(".product-card");
            addToCart(card);
        });
    });

    productCards.forEach(card => {
        card.addEventListener("click", function() {
            addToCart(card);
        });
    });

    // Abrir modal pelo menu "Meus Pedidos"
    if (meusPedidosBtn) {
        meusPedidosBtn.addEventListener("click", function(e) {
            e.preventDefault();
            if (cart.length === 0) alert("Seu carrinho está vazio!");
            openCart();
        });
    }

    // Fechar modal
    closeCartBtn.addEventListener("click", closeCart);
    cartModal.addEventListener("click", function(e) {
        if (e.target === cartModal) closeCart();
    });

    // Checkout via WhatsApp
    checkoutBtn.addEventListener("click", function() {
        if (cart.length === 0) {
            alert("Seu carrinho está vazio!");
            return;
        }

        let message = "🧾 *Novo Pedido*%0A%0A📦 *Itens*%0A";
        cart.forEach(item => {
            const subtotal = (item.price * item.quantity).toFixed(2);
            message += `• ${item.name} — R$ ${subtotal.replace(".", ",")} — Quantidade: ${item.quantity} = R$ ${subtotal.replace(".", ",")}%0A`;
        });

        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
        message += `%0A💰 *Total:* R$ ${total.replace(".", ",")}%0APor favor confirmar disponibilidade.`;

        const phone = "5531999306022";
        const url = `https://wa.me/${phone}?text=${message}`;
        window.open(url, "_blank");
    });

    // Continuar comprando
    if (continueBtn) {
        continueBtn.addEventListener("click", function() {
            closeCart();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
});