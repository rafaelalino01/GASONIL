document.addEventListener("DOMContentLoaded", function() {
    // ===========================================
    // 1. Seletores de Elementos
    // ===========================================
    const addButtons = document.querySelectorAll(".btn-secondary");
    const productCards = document.querySelectorAll(".product-card");
    const meusPedidosBtn = document.getElementById("meus-pedidos");

    // Seletores de Busca de CEP
    const cepInput = document.getElementById('cep-input');
    const searchBtn = document.getElementById('search-btn');
    const addressResultEl = document.getElementById('address-result');

    const btnAjuda = document.getElementById('btn-ajuda');

    // Seletores de Modais
    const cartModal = document.getElementById("cart-modal");
    const helpModal = document.getElementById('help-modal');
    const addressDetailModal = document.getElementById('address-detail-modal'); 

    // Seletores de Botões de Ação
    const closeCartBtn = document.getElementById("close-cart");
    const closeHelpBtnHeader = document.getElementById('close-help-modal');
    const closeAddressDetailBtn = document.getElementById('close-address-detail');
    const returnToHubBtn = document.getElementById('return-to-hub-btn');
    const checkoutBtn = document.getElementById("checkout-btn");
    const continueBtn = document.getElementById("continue-btn");
    const saveAddressBtn = document.getElementById('save-address-btn'); 

    // Seletores de Detalhes de Endereço
    const addressNumberInput = document.getElementById('address-number-input');
    const addressComplementInput = document.getElementById('address-complement-input');
    const addressReferenceInput = document.getElementById('address-reference-input');
    const cartItemsContainer = document.getElementById("cart-items");
    const cartTotalEl = document.getElementById("cart-total");

    // Seletores de Pagamento
    const paymentMethodSelect = document.getElementById('payment-method');
    const trocoWrapper = document.getElementById('troco-wrapper');
    const valorPagamentoInput = document.getElementById('valor-pagamento');


    // ===========================================
    // 2. Variáveis de Estado
    // ===========================================
    let cart = [];
    let validatedCepAddress = {}; 
    let fullAddressDetails = null; 

    const allModals = [cartModal, helpModal, addressDetailModal];

    // ===========================================
    // 3. Funções de Utilidade e Controle de Modais
    // ===========================================
    function formatPrice(price) {
        return "R$ " + price.toFixed(2).replace(".", ",");
    }

    function closeModal(modal) {
        if (modal && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            modal.style.display = 'none'; 
        }
    }

    function openModal(modalToOpen) {
        allModals.forEach(modal => {
            if (modal !== modalToOpen) {
                closeModal(modal);
            }
        });
        if (modalToOpen) {
            modalToOpen.style.display = ''; 
            modalToOpen.classList.remove("hidden");
        }
    }
    
    const openCart = () => openModal(cartModal);
    const closeCart = () => closeModal(cartModal);
    const openHelpModal = () => openModal(helpModal);
    const closeHelpModal = () => closeModal(helpModal);
    const closeAddressDetailModal = () => closeModal(addressDetailModal);
    
    function openAddressDetailModal() { 
        openModal(addressDetailModal); 
        setTimeout(() => {
            if(addressNumberInput) addressNumberInput.focus();
        }, 100); 
    }

    // ===========================================
    // 4. Lógica de Busca e Endereço
    // ===========================================

    async function searchAddress() {
        if (!cepInput || !addressResultEl) return;

        const cep = cepInput.value.replace(/\D/g, ''); 
        addressResultEl.textContent = "Buscando endereço...";
        addressResultEl.style.color = "gray";

        if (cep.length !== 8) {
            addressResultEl.textContent = "CEP inválido. Digite 8 números.";
            addressResultEl.style.color = "red";
            return;
        }

        try {
            const url = `https://viacep.com.br/ws/${cep}/json/`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.erro) {
                addressResultEl.textContent = "CEP não encontrado.";
                addressResultEl.style.color = "red";
                validatedCepAddress = {};
                fullAddressDetails = null;
            } else {
                validatedCepAddress = {
                    cep: cep,
                    logradouro: data.logradouro,
                    bairro: data.bairro,
                    localidade: data.localidade,
                    uf: data.uf,
                };
                
                addressResultEl.textContent = `CEP ${cep} validado. Agora, informe os detalhes.`;
                addressResultEl.style.color = "var(--color-navy)";
                
                openAddressDetailModal();
            }

        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            addressResultEl.textContent = "Erro na conexão. Tente novamente.";
            addressResultEl.style.color = "red";
            validatedCepAddress = {};
            fullAddressDetails = null;
        }
    }

    function saveAddressDetailsAndContinue() {
        if (!addressNumberInput || !addressResultEl || !validatedCepAddress.cep) return;

        const number = addressNumberInput.value.trim();
        
        if (number === "") {
            alert("Por favor, preencha o número da residência. É obrigatório.");
            return;
        }

        const complement = addressComplementInput.value.trim();
        const reference = addressReferenceInput.value.trim();
        
        fullAddressDetails = {
            ...validatedCepAddress,
            number: number,
            complement: complement,
            reference: reference
        };

        let fullAddressText = `${fullAddressDetails.logradouro}, Nº ${number}`;
        if (complement) fullAddressText += `, Compl.: ${complement}`;
        fullAddressText += ` - ${fullAddressDetails.bairro} - ${fullAddressDetails.localidade}/${fullAddressDetails.uf}`;
        if (reference) fullAddressText += ` (Ref.: ${reference})`;

        addressResultEl.innerHTML = `
            ✅ **Endereço Salvo:** ${fullAddressText}
            <br>
            <span style="font-size: 14px; font-weight: 400;">Agora você pode adicionar os produtos ao carrinho.</span>
        `;
        addressResultEl.style.color = "var(--color-navy)";
        
        closeAddressDetailModal();
        
        addressNumberInput.value = '';
        addressComplementInput.value = '';
        addressReferenceInput.value = '';
    }


    // ===========================================
    // 5. Lógica do Carrinho e Renderização
    // ===========================================
    
    function calculateTotal() {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }

    function updateTotal() {
        const total = calculateTotal();
        if (cartTotalEl) {
            cartTotalEl.textContent = formatPrice(total);
        }
    }

    function renderCart() {
        if (!cartItemsContainer) return;
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

        document.querySelectorAll(".qty-wrapper input").forEach(input => {
            input.addEventListener("change", function(e) {
                const idx = parseInt(e.target.dataset.index);
                let val = parseInt(e.target.value);
                if (val < 1 || isNaN(val)) val = 1;
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
                else cart.splice(idx, 1);
                renderCart();
            });
        });

        updateTotal();
    }

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


    // ===========================================
    // 6. Lógica de Pagamento (Novo)
    // ===========================================

    function toggleTrocoInput() {
        if (paymentMethodSelect.value === 'dinheiro') {
            trocoWrapper.classList.remove('hidden');
            valorPagamentoInput.required = true;
            valorPagamentoInput.value = '';
            valorPagamentoInput.focus();
        } else {
            trocoWrapper.classList.add('hidden');
            valorPagamentoInput.required = false;
            valorPagamentoInput.value = ''; 
        }
    }
    
    if (paymentMethodSelect) {
        paymentMethodSelect.addEventListener('change', toggleTrocoInput);
        paymentMethodSelect.value = 'cartao'; 
        toggleTrocoInput();
    }


    // ===========================================
    // 7. Event Listeners (Checkout Atualizado)
    // ===========================================

    // A. Busca de Endereço
    if (searchBtn) {
        searchBtn.addEventListener("click", searchAddress);
    }
    if (cepInput) {
        cepInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                searchAddress();
            }
        });
    }

    // B. Detalhes Endereço
    if (saveAddressBtn) {
        saveAddressBtn.addEventListener("click", function(e) {
            e.preventDefault(); 
            saveAddressDetailsAndContinue();
        });
    }
    if (closeAddressDetailBtn) {
        closeAddressDetailBtn.addEventListener("click", closeAddressDetailModal);
    }
    if (addressDetailModal) {
        addressDetailModal.addEventListener('click', (event) => {
            if (event.target === addressDetailModal) {
                closeAddressDetailModal();
            }
        });
    }

    // C. Produtos: Adicionar ao carrinho
    const addProductHandler = (e) => {
        e.stopPropagation();
        const card = e.target.closest(".product-card");
        
        if (!fullAddressDetails) {
            alert("⚠️ Por favor, primeiro valide seu CEP e informe o número de residência na busca acima antes de adicionar produtos!");
            return;
        }
        addToCart(card);
    };
    
    addButtons.forEach(btn => {
        btn.addEventListener("click", addProductHandler);
    });

    productCards.forEach(card => {
        card.addEventListener("click", (e) => {
            if (!e.target.classList.contains("btn-secondary")) {
                if (!fullAddressDetails) {
                    alert("⚠️ Por favor, primeiro valide seu CEP e informe o número de residência na busca acima antes de adicionar produtos!");
                    return;
                }
                addToCart(card);
            }
        });
    });
    
    // D. Carrinho
    if (meusPedidosBtn) {
        meusPedidosBtn.addEventListener("click", (e) => {
            e.preventDefault();
            renderCart(); 
            openCart();
        });
    }
    if (closeCartBtn) {
        closeCartBtn.addEventListener("click", closeCart);
    }
    if (cartModal) {
        cartModal.addEventListener("click", (e) => {
            if (e.target === cartModal) closeCart();
        });
    }
    if (continueBtn) {
        continueBtn.addEventListener("click", function() {
            closeCart();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
    
    // E. Ajuda
    if (btnAjuda) { 
        btnAjuda.addEventListener('click', (event) => {
            event.preventDefault(); 
            openHelpModal();
        });
    }
    if (closeHelpBtnHeader) {
        closeHelpBtnHeader.addEventListener('click', closeHelpModal);
    }
    if (helpModal) {
        helpModal.addEventListener('click', (event) => {
            if (event.target === helpModal) {
                closeHelpModal();
            }
        });
    }
    
    // F. Botão Voltar ao Hub (no modal de Ajuda)
    if (returnToHubBtn) {
        returnToHubBtn.addEventListener('click', (event) => {
            event.preventDefault();
            closeHelpModal();
            window.scrollTo({ top: 0, behavior: "smooth" }); 
        });
    }

    // G. Checkout via WhatsApp
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", function() {
            const total = calculateTotal();
            const paymentMethod = paymentMethodSelect.value;
            let trocoMessage = "";

            if (cart.length === 0) {
                alert("Seu carrinho está vazio!");
                return;
            }
            
            if (!fullAddressDetails) {
                alert("🚨 Por favor, primeiro valide seu CEP e informe o número da residência antes de finalizar o pedido.");
                return;
            }

            // Validação e Cálculo do Troco
            if (paymentMethod === 'dinheiro') {
                const valorPagamento = parseFloat(valorPagamentoInput.value);
                if (isNaN(valorPagamento) || valorPagamento < total) {
                    alert(`🚨 Se o pagamento for em Dinheiro, o valor informado (${valorPagamento ? formatPrice(valorPagamento) : 'não preenchido'}) deve ser igual ou maior que o total do pedido (${formatPrice(total)}).`);
                    return;
                }
                if (valorPagamento > total) {
                    const trocoNecessario = valorPagamento - total;
                    trocoMessage = `*TROCO NECESSÁRIO:* ${formatPrice(trocoNecessario)} (Para: ${formatPrice(valorPagamento)})%0A`;
                } else {
                    trocoMessage = `*TROCO:* Não Necessário (Valor exato)%0A`;
                }
            } else {
                trocoMessage = ""; // Limpa a mensagem se não for dinheiro
            }
            
            // Lógica de formatação de mensagem para WhatsApp
            let addressMessage = `🏠 *ENDEREÇO DE ENTREGA:*%0A`;
            addressMessage += `• CEP: ${fullAddressDetails.cep}%0A`;
            addressMessage += `• Rua: ${fullAddressDetails.logradouro}%0A`;
            addressMessage += `• **NÚMERO: ${fullAddressDetails.number}**%0A`;
            if (fullAddressDetails.complement) addressMessage += `• Complemento: ${fullAddressDetails.complement}%0A`;
            if (fullAddressDetails.reference) addressMessage += `• Ponto de Ref.: ${fullAddressDetails.reference}%0A`;
            addressMessage += `• Bairro/Cidade/UF: ${fullAddressDetails.bairro}, ${fullAddressDetails.localidade}/${fullAddressDetails.uf}%0A%0A`;

            let message = "🧾 *NOVO PEDIDO GASONIL*%0A%0A";
            message += addressMessage;
            
            message += `✅ *PAGAMENTO:* ${paymentMethod.toUpperCase()}%0A`;
            if (trocoMessage) {
                message += trocoMessage;
            }
            message += `%0A`; 
            
            message += `📦 *ITENS DO PEDIDO*%0A`;
            cart.forEach(item => {
                const subtotal = (item.price * item.quantity).toFixed(2);
                message += `• ${item.name} — Qtd: ${item.quantity} = R$ ${subtotal.replace(".", ",")}%0A`;
            });

            const totalFormatted = total.toFixed(2);
            message += `%0A💰 *TOTAL:* R$ ${totalFormatted.replace(".", ",")}%0A%0A*Aguarde a confirmação da entrega!*`;

            const phone = "5531999306022";
            const url = `https://wa.me/${phone}?text=${message}`;
            window.open(url, "_blank");
            
            closeCart();
        });
    }

});