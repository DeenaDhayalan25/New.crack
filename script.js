document.addEventListener('DOMContentLoaded', function() {
  const toggle = document.getElementById('dropdownToggle');
  const menu = document.getElementById('dropdownMenu');

  // Toggle menu on hamburger click
  toggle.addEventListener('click', function(e) {
    e.stopPropagation(); // Prevent bubbling to document
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
  });

  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    if (menu.style.display === 'flex' && !menu.contains(e.target) && !toggle.contains(e.target)) {
      menu.style.display = 'none';
    }
  });

  // Collect all product cards
  const cards = document.querySelectorAll('.mobile-product-card');
  const cartTotalAmount = document.getElementById('cartTotalAmount');
  const viewCartBtn = document.getElementById('viewCartBtn');
  const cartModal = document.getElementById('cartModal');
  const closeCartModal = document.getElementById('closeCartModal');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartModalTotal = document.getElementById('cartModalTotal');

  function getPrice(card) {
    // Get the last .detail-value in the Price detail (not the actual-value/strike)
    const priceDetail = Array.from(card.querySelectorAll('.detail')).find(d => d.textContent.includes('Price'));
    if (!priceDetail) return 0;
    const priceSpan = priceDetail.querySelectorAll('.detail-value');
    if (!priceSpan.length) return 0;
    // Usually the last .detail-value is the selling price
    return parseInt(priceSpan[priceSpan.length - 1].textContent.replace(/[^\d]/g, ''), 10) || 0;
  }

  function getName(card) {
    return card.querySelector('.name-cell').textContent.trim();
  }

  function getQty(card) {
    return parseInt(card.querySelector('.qty-input').value, 10) || 0;
  }

  function updateCart() {
    let total = 0;
    cards.forEach(card => {
      const qty = getQty(card);
      const price = getPrice(card);
      total += qty * price;
    });
    cartTotalAmount.textContent = `₹${total}`;
    cartModalTotal.textContent = `₹${total}`;
  }

  // Listen for qty changes
  cards.forEach(card => {
    const qtyInput = card.querySelector('.qty-input');
    const incBtn = card.querySelector('.qty-btn.inc');
    const decBtn = card.querySelector('.qty-btn.dec');
    const totalDetail = card.querySelector('.detail-total .detail-value');

    function setQty(qty) {
      qty = Math.max(0, qty);
      qtyInput.value = qty;
      // Update per-item total
      const price = getPrice(card);
      if (totalDetail) {
        totalDetail.textContent = `₹${qty * price}`;
      }
      updateCart();
    }

    incBtn.addEventListener('click', () => setQty(Number(qtyInput.value) + 1));
    decBtn.addEventListener('click', () => setQty(Number(qtyInput.value) - 1));
    qtyInput.addEventListener('input', () => setQty(Number(qtyInput.value)));
  });

  // Show cart modal
  viewCartBtn.addEventListener('click', () => {
    let itemsHtml = '';
    let total = 0;
    cards.forEach(card => {
      const name = getName(card);
      const qty = getQty(card);
      const price = getPrice(card);
      if (qty > 0) {
        const itemTotal = qty * price;
        total += itemTotal;
        itemsHtml += `
          <div class="cart-item">
            <span>${name} × ${qty}</span>
            <span>₹${price} × ${qty} = <b>₹${itemTotal}</b></span>
          </div>
        `;
      }
    });

    if (!itemsHtml) {
      itemsHtml = '<div style="text-align:center;color:#888;">No items in cart.</div>';
    }

    cartItemsList.innerHTML = itemsHtml;
    cartModalTotal.textContent = `₹${total}`;
    cartModal.style.display = 'block';
  });

  // Back button closes modal
  document.getElementById('backBtn').addEventListener('click', () => {
    cartModal.style.display = 'none';
  });

  // Submit button (you can add your order logic here)
  document.getElementById('checkoutForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Get user details, use "N/A" if empty
    const name = document.getElementById('firstName')?.value.trim() || 'N/A';
    const mobile = document.getElementById('mobile')?.value.trim() || 'N/A';
    const email = document.getElementById('email')?.value.trim() || 'N/A';
    const state = document.getElementById('state')?.value.trim() || 'N/A';
    const city = document.getElementById('city')?.value.trim() || 'N/A';
    const address = document.getElementById('address')?.value.trim() || 'N/A';

    // Gather cart items
    const items = [];
    document.querySelectorAll('.mobile-product-card').forEach(card => {
      const nameCell = card.querySelector('.name-cell');
      const qtyInput = card.querySelector('.qty-input');
      const priceDetail = Array.from(card.querySelectorAll('.detail')).find(d => d.textContent.includes('Price'));
      const priceSpan = priceDetail ? priceDetail.querySelectorAll('.detail-value') : [];
      const itemName = nameCell ? nameCell.textContent.trim() : 'N/A';
      const qty = qtyInput ? parseInt(qtyInput.value, 10) || 0 : 0;
      const price = priceSpan.length ? parseInt(priceSpan[priceSpan.length - 1].textContent.replace(/[^\d]/g, ''), 10) : 0;
      if (qty > 0) {
        items.push([itemName, qty, `Rs. ${price}`, `Rs. ${qty * price}`]);
      }
    });

    if (items.length === 0) {
      alert('No items in cart.');
      return;
    }

    // Generate PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text('Order Summary', 14, 16);

    // User details
    doc.setFontSize(11);
    doc.text(`Name: ${name}`, 14, 26);
    doc.text(`Mobile: ${mobile}`, 14, 33);
    doc.text(`Email: ${email}`, 14, 40);
    doc.text(`State: ${state}`, 14, 47);
    doc.text(`City: ${city}`, 14, 54);
    doc.text(`Address: ${address}`, 14, 61);

    // Items table
    doc.autoTable({
      head: [['Item', 'Quantity', 'Price', 'Total']],
      body: items,
      startY: 68,
      theme: 'grid'
    });

    // Clean number helper
    function cleanNumber(str) {
      return parseFloat(String(str).replace(/[^\d.]/g, '')) || 0;
    }

    // Prepare summary data
    const subtotal = cleanNumber(document.getElementById('summarySubtotal')?.textContent);
    const minOrder = 3500;
    const packing = 0;
    const roundoff = cleanNumber(document.getElementById('summaryRoundoff')?.textContent);
    const overall = cleanNumber(document.getElementById('summaryTotal')?.textContent);

    const summaryRows = [
      ['Sub Total', `Rs. ${subtotal}`],
      ['Min. Order Amount', `Rs. ${minOrder}`],
      ['Packing Charges', `Rs. ${packing}`],
      ['Round OFF', `Rs. ${roundoff}`],
      ['Overall Amount', `Rs. ${overall}`]
    ];

    // Add summary table with different font style
    doc.autoTable({
      head: [['Description', 'Amount']],
      body: summaryRows,
      startY: doc.lastAutoTable.finalY + 10,
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80], textColor: [255,255,255], fontStyle: 'bold', fontSize: 12 },
      bodyStyles: { fontStyle: 'italic', fontSize: 12 }
    });

    // Download PDF
    doc.save('order-summary.pdf');
  });

  // Close cart modal
  closeCartModal.addEventListener('click', () => {
    cartModal.style.display = 'none';
  });

  // Close modal on outside click
  window.addEventListener('click', (e) => {
    if (e.target === cartModal) {
      cartModal.style.display = 'none';
    }
  });

  // Show cart modal when Proceed button is clicked
  

  const proceedBtn = document.getElementById('proceedBtn');
  const checkoutModal = document.getElementById('checkoutModal');
  const closeCheckoutModal = document.getElementById('closeCheckoutModal');
  const checkoutBackBtn = document.getElementById('checkoutBackBtn');

  // Show checkout modal when Proceed is clicked
  proceedBtn.addEventListener('click', () => {
    // Calculate total
    let total = 0;
    cards.forEach(card => {
      const qty = getQty(card);
      const price = getPrice(card);
      total += qty * price;
    });

    // Update summary fields in checkout modal
    document.getElementById('summarySubtotal').textContent = `₹${total.toLocaleString()}`;
    document.getElementById('summaryTotal').textContent = `₹${total.toLocaleString()}`;
    document.getElementById('summaryRoundoff').textContent = '₹0.00';

    // Show checkout modal
    checkoutModal.style.display = 'block';
  });

  // Hide checkout modal when close or back is clicked
  closeCheckoutModal.addEventListener('click', () => {
    checkoutModal.style.display = 'none';
  });
  checkoutBackBtn.addEventListener('click', () => {
    checkoutModal.style.display = 'none';
  });

  // Place order button logic
  document.getElementById('placeOrderBtn').addEventListener('click', function() {
    // Get user details
    const name = document.getElementById('firstName')?.value.trim() || 'N/A';
    const mobile = document.getElementById('mobile')?.value.trim() || 'N/A';
    const email = document.getElementById('email')?.value.trim() || 'N/A';
    const state = document.getElementById('state')?.value.trim() || 'N/A';
    const city = document.getElementById('city')?.value.trim() || 'N/A';
    const address = document.getElementById('address')?.value.trim() || 'N/A';

    // Gather cart items
    const items = [];
    document.querySelectorAll('.mobile-product-card').forEach(card => {
      const nameCell = card.querySelector('.name-cell');
      const qtyInput = card.querySelector('.qty-input');
      const priceDetail = Array.from(card.querySelectorAll('.detail')).find(d => d.textContent.includes('Price'));
      const priceSpan = priceDetail ? priceDetail.querySelectorAll('.detail-value') : [];
      const itemName = nameCell ? nameCell.textContent.trim() : 'N/A';
      const qty = qtyInput ? parseInt(qtyInput.value, 10) || 0 : 0;
      const price = priceSpan.length ? parseInt(priceSpan[priceSpan.length - 1].textContent.replace(/[^\d]/g, ''), 10) : 0;
      if (qty > 0) {
        items.push([itemName, qty, `Rs. ${price}`, `Rs. ${qty * price}`]);
      }
    });

    if (items.length === 0) {
      alert('No items in cart.');
      return;
    }

    // Clean number helper
    function cleanNumber(str) {
      return parseFloat(String(str).replace(/[^\d.]/g, '')) || 0;
    }
    const subtotal = cleanNumber(document.getElementById('summarySubtotal')?.textContent);
    const minOrder = 3500;
    const packing = 0;
    const roundoff = cleanNumber(document.getElementById('summaryRoundoff')?.textContent);
    const overall = cleanNumber(document.getElementById('summaryTotal')?.textContent);

    // Send order to backend
    fetch('http://localhost:3000/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        mobile,
        email,
        state,
        city,
        address,
        items,
        subtotal,
        minOrder,
        packing,
        roundoff,
        overall
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Order placed! Order ID: ' + data.orderId);
      } else {
        alert('Failed to save order.');
      }
    })
    .catch(() => alert('Failed to save order.'));
  });

  // Initial update
  updateCart();

});