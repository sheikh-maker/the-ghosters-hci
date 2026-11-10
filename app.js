const products = [
  { id: "banana", name: "Bananas", category: "produce", detail: "1 kg · Produce", price: 4.90, icon: "🍌" },
  { id: "apple", name: "Red apples", category: "produce", detail: "4 pieces · Produce", price: 7.20, icon: "🍎" },
  { id: "greens", name: "Leafy greens", category: "produce", detail: "1 bunch · Produce", price: 3.50, icon: "🥬" },
  { id: "bread", name: "Wholemeal bread", category: "pantry", detail: "1 loaf · Bakery", price: 5.80, icon: "🍞" },
  { id: "rice", name: "Rice", category: "pantry", detail: "1 kg · Pantry", price: 8.90, icon: "🌾" },
  { id: "oats", name: "Rolled oats", category: "pantry", detail: "500 g · Pantry", price: 6.40, icon: "🥣" },
  { id: "milk", name: "Fresh milk", category: "chilled", detail: "1 L · Chilled", price: 7.10, icon: "🥛" },
  { id: "yogurt", name: "Plain yogurt", category: "chilled", detail: "400 g · Chilled", price: 6.60, icon: "🥣" }
];

let basket = [
  { id: "banana", quantity: 1 },
  { id: "milk", quantity: 1 }
];
let lastBasketSnapshot = null;
let selectedCategory = "all";
let narratorEnabled = false;

const productGrid = document.querySelector("#product-grid");
const basketItems = document.querySelector("#basket-items");
const basketEmpty = document.querySelector("#basket-empty");
const basketCount = document.querySelector("#basket-count");
const basketTotal = document.querySelector("#basket-total");
const undoButton = document.querySelector("#undo-button");
const undoHint = document.querySelector("#undo-hint");
const kioskStatus = document.querySelector("#kiosk-status");
const searchInput = document.querySelector("#product-search");
const emptySearch = document.querySelector("#empty-search");
const demo = document.querySelector("#kiosk-demo");

function money(value) {
  return `RM ${value.toFixed(2)}`;
}

function productFor(id) {
  return products.find((product) => product.id === id);
}

function rememberBasket() {
  lastBasketSnapshot = JSON.stringify(basket);
  undoButton.disabled = false;
  undoHint.textContent = "One step available";
}

function announce(message) {
  kioskStatus.textContent = message;
}

function addProduct(id) {
  const product = productFor(id);
  if (!product) return;
  rememberBasket();
  const existing = basket.find((item) => item.id === id);
  if (existing) existing.quantity += 1;
  else basket.push({ id, quantity: 1 });
  renderBasket();
  const current = basket.find((item) => item.id === id);
  announce(`${product.name} added. Basket quantity ${current.quantity}.`);
}

function setQuantity(id, quantity) {
  const item = basket.find((entry) => entry.id === id);
  const product = productFor(id);
  if (!item || !product) return;
  if (quantity < 1) {
    removeItem(id);
    return;
  }
  rememberBasket();
  item.quantity = quantity;
  renderBasket();
  announce(`${product.name} quantity changed to ${quantity}.`);
}

function removeItem(id) {
  const product = productFor(id);
  if (!product) return;
  rememberBasket();
  basket = basket.filter((item) => item.id !== id);
  renderBasket();
  announce(`${product.name} removed. Use Undo last change to restore it.`);
}

function undoLastChange() {
  if (!lastBasketSnapshot) return;
  basket = JSON.parse(lastBasketSnapshot);
  lastBasketSnapshot = null;
  undoButton.disabled = true;
  undoHint.textContent = "Nothing to undo";
  renderBasket();
  announce("Last basket change undone.");
}

function renderProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const visible = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = !query || `${product.name} ${product.category} ${product.detail}`.toLocaleLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  productGrid.replaceChildren();
  emptySearch.hidden = visible.length > 0;
  for (const product of visible) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `<div class="product-art" aria-hidden="true">${product.icon}</div>
      <h5></h5><small></small><div class="product-card-bottom"><strong>${money(product.price)}</strong>
      <button class="add-product" type="button" data-add="${product.id}">Add</button></div>`;
    card.querySelector("h5").textContent = product.name;
    card.querySelector("small").textContent = product.detail;
    productGrid.append(card);
  }
}

function renderBasket() {
  basketItems.replaceChildren();
  const fullCount = basket.reduce((sum, item) => sum + item.quantity, 0);
  basketCount.textContent = String(fullCount);
  basketEmpty.hidden = basket.length > 0;
  basketItems.hidden = basket.length === 0;

  let total = 0;
  for (const item of basket) {
    const product = productFor(item.id);
    if (!product) continue;
    total += product.price * item.quantity;
    const row = document.createElement("article");
    row.className = "basket-item";
    row.innerHTML = `<div><div class="basket-item-name"></div><div class="basket-item-price"></div></div>
      <span class="basket-item-price">${money(product.price * item.quantity)}</span>
      <div class="basket-item-actions"><div class="quantity-control">
      <button type="button" data-quantity="minus" aria-label="Decrease quantity of ${product.name}">−</button>
      <span>${item.quantity}</span>
      <button type="button" data-quantity="plus" aria-label="Increase quantity of ${product.name}">+</button>
      </div><button type="button" class="remove-item" data-remove="${product.id}">Remove</button></div>`;
    row.querySelector(".basket-item-name").textContent = product.name;
    row.querySelector(".basket-item-price").textContent = `${money(product.price)} each`;
    basketItems.append(row);
  }
  basketTotal.textContent = money(total);
}

function speakCurrentStep() {
  if (!narratorEnabled) {
    announce("Turn on Voice guidance first, then use Repeat to hear this step.");
    return;
  }
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    announce("Voice guidance is not available in this browser. The written instructions remain on screen.");
    return;
  }
  const language = document.querySelector("#narrator-language").value;
  const count = basket.reduce((sum, item) => sum + item.quantity, 0);
  const total = basket.reduce((sum, item) => sum + productFor(item.id).price * item.quantity, 0);
  const text = language === "ms-MY"
    ? `Langkah satu. Tambahkan barangan anda. Cari produk atau pilih kategori. Anda boleh menyemak bakul sebelum pembayaran. Bakul anda mengandungi ${count} barang. Jumlah anggaran ialah ${total.toFixed(2)} ringgit. Gunakan butang tambah atau tolak untuk menukar kuantiti, atau pilih buang. Tekan undur untuk membatalkan perubahan terakhir.`
    : `Step one. Add your items. Search for a product or choose a category. You can review every item before checkout. Your basket has ${count} items. The estimated total is ${total.toFixed(2)} ringgit. Use plus or minus to change a quantity, or choose remove. Use undo to restore the last change.`;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.92;
  utterance.onstart = () => announce("Reading the checkout steps aloud.");
  utterance.onend = () => announce("Voice guidance finished. You can repeat it at any time.");
  utterance.onerror = () => announce("Voice guidance could not start here. The written instructions remain on screen.");
  window.speechSynthesis.speak(utterance);
}

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (button) addProduct(button.dataset.add);
});

basketItems.addEventListener("click", (event) => {
  const remove = event.target.closest("[data-remove]");
  if (remove) {
    removeItem(remove.dataset.remove);
    return;
  }
  const quantityButton = event.target.closest("[data-quantity]");
  if (quantityButton) {
    const id = quantityButton.closest(".basket-item").querySelector("[data-remove]").dataset.remove;
    const current = basket.find((item) => item.id === id);
    if (current) setQuantity(id, current.quantity + (quantityButton.dataset.quantity === "plus" ? 1 : -1));
  }
});

searchInput.addEventListener("input", renderProducts);
document.querySelectorAll(".category-chip").forEach((button) => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.category;
    document.querySelectorAll(".category-chip").forEach((chip) => {
      const selected = chip === button;
      chip.classList.toggle("is-selected", selected);
      chip.setAttribute("aria-pressed", String(selected));
    });
    renderProducts();
  });
});

undoButton.addEventListener("click", undoLastChange);
document.querySelector("#contrast-toggle").addEventListener("click", (event) => {
  const active = event.currentTarget.getAttribute("aria-pressed") !== "true";
  event.currentTarget.setAttribute("aria-pressed", String(active));
  demo.classList.toggle("high-contrast", active);
  announce(active ? "High contrast mode on." : "High contrast mode off.");
});
document.querySelector("#text-toggle").addEventListener("click", (event) => {
  const active = event.currentTarget.getAttribute("aria-pressed") !== "true";
  event.currentTarget.setAttribute("aria-pressed", String(active));
  demo.classList.toggle("large-text", active);
  announce(active ? "Larger text on." : "Standard text size restored.");
});
document.querySelector("#reach-toggle").addEventListener("click", (event) => {
  const active = event.currentTarget.getAttribute("aria-pressed") !== "true";
  event.currentTarget.setAttribute("aria-pressed", String(active));
  demo.classList.toggle("reach-mode", active);
  announce(active ? "Reach layout on. Basket actions are grouped in a larger, centered panel." : "Standard layout restored.");
});

const narratorToggle = document.querySelector("#narrator-toggle");
narratorToggle.addEventListener("click", () => {
  narratorEnabled = !narratorEnabled;
  narratorToggle.setAttribute("aria-pressed", String(narratorEnabled));
  narratorToggle.querySelector("small").textContent = narratorEnabled ? "Optional · on" : "Optional · off";
  if (!narratorEnabled && "speechSynthesis" in window) window.speechSynthesis.cancel();
  announce(narratorEnabled ? "Voice guidance on. Select Repeat when you want to hear this step." : "Voice guidance off.");
});
document.querySelector("#repeat-button").addEventListener("click", speakCurrentStep);
document.querySelector("#sample-scan").addEventListener("click", () => {
  addProduct("apple");
  announce("Sample scan: Red apples added. This is a demo action, not a real barcode scan.");
});
document.querySelector("#review-button").addEventListener("click", () => {
  if (basket.length === 0) announce("Your basket is empty. Add a sample item before reviewing.");
  else announce(`Basket reviewed. ${basket.reduce((sum, item) => sum + item.quantity, 0)} items, estimated total ${basketTotal.textContent}. You can still edit each item. This concept does not process payment.`);
});

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");
menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  navigation.classList.toggle("is-open", open);
});
navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    navigation.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }
});

const sections = ["team", "project-0", "project-1"].map((id) => document.getElementById(id)).filter(Boolean);
const navLinks = Array.from(document.querySelectorAll(".nav-link"));
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!current) return;
    navLinks.forEach((link) => {
      const active = link.hash === `#${current.target.id}`;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.15, 0.35] });
  sections.forEach((section) => observer.observe(section));
}

renderProducts();
renderBasket();
