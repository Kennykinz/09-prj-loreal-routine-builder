/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

const CLOUDLFARE_WORKER_URL =
  "https://lorealagain.kennedyannlorenzen.workers.dev/";

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
      <div class="product-card" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
        </div>
      </div>
    `
    )
    .join("");

  // Add event listeners after rendering
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () =>
      toggleProductSelection(card, products)
    );
  });
}

let selectedProducts = [];

function toggleProductSelection(card, products) {
  const productId = card.getAttribute("data-id");
  const product = products.find((p) => p.id == productId);
  const index = selectedProducts.findIndex((p) => p.id == productId);

  if (index > -1) {
    selectedProducts.splice(index, 1);
    card.classList.remove("selected");
  } else {
    selectedProducts.push(product);
    card.classList.add("selected");
  }

  updateSelectedProductsList();
}

function updateSelectedProductsList() {
  const list = document.getElementById("selectedProductsList");
  list.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="selected-item">
        ${product.name}
        <button class="remove-btn" data-id="${product.id}">&times;</button>
      </div>
    `
    )
    .join("");

  // Enable removing items from list
  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.getAttribute("data-id");
      selectedProducts = selectedProducts.filter((p) => p.id != id);
      updateSelectedProductsList();
      document
        .querySelector(`.product-card[data-id="${id}"]`)
        .classList.remove("selected");
    });
  });
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = document.getElementById("userInput").value.trim();
  if (!userInput) return;

  addMessageToChat("user", userInput);
  document.getElementById("userInput").value = "";

  const messages = Array.from(chatWindow.children).map((div) => ({
    role: div.className.includes("user") ? "user" : "assistant",
    content: div.textContent,
  }));

  const res = await fetch(
    "https://lorealagain.kennedyannlorenzen.workers.dev/",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    }
  );

  const data = await res.json();
  addMessageToChat("bot", data.response || "Sorry, I didn't catch that.");
});

generateBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) return;

  addMessageToChat("user", "Generate a routine for these products, please!");

  const userPrompt = `
Based on the following L'Oréal products, create a personalized skincare routine. 
Include steps, time of day (AM/PM), and any relevant tips. Be concise and clear.

${selectedProducts
  .map(
    (p) =>
      `Name: ${p.name}\nBrand: ${p.brand}\nCategory: ${p.category}\nDescription: ${p.description}`
  )
  .join("\n\n")}
`;

  const messages = [
    {
      role: "system",
      content:
        "You are a helpful L'Oréal skincare routine advisor. You will be given a list of products and their details. Based on this information, create a personalized skincare routine. Include steps, time of day (AM/PM), and tips. Be concise and clear. You are to maintain a friendly and professional tone.",
    },
    {
      role: "user",
      content: userPrompt,
    },
  ];

  try {
    const res = await fetch(CLOUDLFARE_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const data = await res.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a routine.";
    addMessageToChat("bot", reply);
  } catch (err) {
    console.error("Error fetching routine:", err);
    addMessageToChat(
      "bot",
      "There was a problem contacting the routine advisor."
    );
  }
});

function addMessageToChat(sender, message) {
  const div = document.createElement("div");
  div.className = sender === "user" ? "chat-user" : "chat-bot";
  div.textContent = message;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});
