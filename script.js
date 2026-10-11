const form = document.getElementById("entry-form");
const textInput = document.getElementById("text-input");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const entriesEl = document.getElementById("entries");
const emptyStateEl = document.getElementById("empty-state");
const countEl = document.getElementById("count");

let entries = [];

/**
 * --- Database hook ---
 * Replace the body of this function with your real database call later,
 * e.g. `await fetch("/api/entries", { method: "POST", ... })`.
 * It must return the saved entry: { id, text, createdAt }.
 */
async function saveEntry(text) {
  return {
    id: crypto.randomUUID(),
    text,
    createdAt: new Date().toISOString(),
  };
}

/**
 * --- Database hook ---
 * Replace with a call that loads your existing entries from the database,
 * e.g. `return fetch("/api/entries").then((r) => r.json())`.
 */
async function loadEntries() {
  return [];
}

/**
 * --- Database hook ---
 * Replace with a call that deletes the entry from the database,
 * e.g. `await fetch("/api/entries/" + id, { method: "DELETE" })`.
 */
async function deleteEntry(id) {
  entries = entries.filter((entry) => entry.id !== id);
}

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = "status" + (type ? " status--" + type : "");
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

function renderEntry(entry) {
  const li = document.createElement("li");
  li.className = "entry";

  const p = document.createElement("p");
  p.className = "entry__text";
  p.textContent = entry.text;

  const time = document.createElement("span");
  time.className = "entry__time";
  time.textContent = formatDate(entry.createdAt);
  p.appendChild(time);

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "entry__delete";
  removeBtn.textContent = "\u00d7";
  removeBtn.title = "Delete entry";
  removeBtn.setAttribute("aria-label", "Delete entry");
  removeBtn.addEventListener("click", async () => {
    removeBtn.disabled = true;
    await deleteEntry(entry.id);
    li.remove();
    renderAll();
  });

  li.append(p, removeBtn);
  return li;
}

function renderAll() {
  entriesEl.replaceChildren(...entries.map(renderEntry));
  countEl.textContent = String(entries.length);
  emptyStateEl.hidden = entries.length > 0;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = textInput.value.trim();
  if (!text) {
    setStatus("Please enter some text.", "error");
    return;
  }

  submitBtn.disabled = true;
  setStatus("Saving...");

  try {
    const saved = await saveEntry(text);
    entries = [saved, ...entries];
    renderAll();
    form.reset();
    setStatus("Saved.", "success");
    textInput.focus();
  } catch (error) {
    console.error(error);
    setStatus("Could not save. Try again.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

form.addEventListener("reset", () => {
  setStatus("");
});

(async function init() {
  try {
    entries = await loadEntries();
    renderAll();
  } catch (error) {
    console.error(error);
    setStatus("Could not load entries.", "error");
  }
})();
