// 1. CREDENTIALS
const SUPABASE_URL = 'https://supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WCRT11CQKRrGVeL1DZn9mw_GzzUiHth';

// 2. INITIALIZATION (Uses the library loaded in index.html)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 3. DOM ELEMENTS
const form = document.getElementById("entry-form");
const textInput = document.getElementById("text-input");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const entriesEl = document.getElementById("entries");
const emptyStateEl = document.getElementById("empty-state");
const countEl = document.getElementById("count");

let entries = [];

// --- DATABASE FUNCTIONS ---

async function saveEntry(text) {
  const { data, error } = await supabase
    .from("essays")
    .insert([{ content: text }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    text: data.content,
    createdAt: data.created_at,
  };
}

async function loadEntries() {
  const { data, error } = await supabase
    .from("essays")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((essay) => ({
    id: essay.id,
    text: essay.content,
    createdAt: essay.created_at,
  }));
}

async function deleteEntry(id) {
  const { error } = await supabase
    .from("essays")
    .delete()
    .eq("id", id);

  if (error) throw error;

  entries = entries.filter((entry) => entry.id !== id);
}

// --- UI FUNCTIONS ---

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = "status" + (type ? " status--" + type : "");
  // Clear status after 3 seconds
  if (message) setTimeout(() => (statusEl.textContent = ""), 3000);
}

function renderEntry(entry) {
  const li = document.createElement("li");
  li.className = "entry";

  const p = document.createElement("p");
  p.className = "entry__text";
  p.textContent = entry.text;

  const time = document.createElement("span");
  time.className = "entry__time";
  time.textContent = new Date(entry.createdAt).toLocaleString();
  p.appendChild(time);

  const removeBtn = document.createElement("button");
  removeBtn.className = "entry__delete";
  removeBtn.innerHTML = "&times;"; // X symbol
  removeBtn.title = "Delete entry";
  
  removeBtn.addEventListener("click", async () => {
    if (!confirm("Delete this essay?")) return;
    
    removeBtn.disabled = true;
    try {
      await deleteEntry(entry.id);
      li.remove();
      renderAll();
    } catch (error) {
      console.error(error);
      alert("Error deleting entry");
      removeBtn.disabled = false;
    }
  });

  li.append(p, removeBtn);
  return li;
}

function renderAll() {
  entriesEl.replaceChildren(...entries.map(renderEntry));
  countEl.textContent = String(entries.length);
  emptyStateEl.hidden = entries.length > 0;
}

// --- EVENT LISTENERS ---

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = textInput.value.trim();
  if (!text) return;

  submitBtn.disabled = true;
  setStatus("Saving...");

  try {
    const saved = await saveEntry(text);
    entries = [saved, ...entries];
    renderAll();
    form.reset();
    setStatus("Saved!", "success");
  } catch (error) {
    console.error(error);
    setStatus("Error saving.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

form.addEventListener("reset", () => {
  setStatus("");
});

// --- STARTUP ---

(async function init() {
  try {
    entries = await loadEntries();
    renderAll();
  } catch (error) {
    console.error(error);
    setStatus("Connection error.", "error");
  }
})();
