// 1. SETUP - Uses your specific keys
const SUPABASE_URL = 'https://supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WCRT11CQKRrGVeL1DZn9mw_GzzUiHth';

// Alert 1: Check if script starts
alert("Step 1: Script is running!");

if (!window.supabase) {
  alert("CRITICAL ERROR: Supabase library not found. Check your HTML script tag!");
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("entry-form");
const textInput = document.getElementById("text-input");
const submitBtn = document.getElementById("submit-btn");
const entriesEl = document.getElementById("entries");
const countEl = document.getElementById("count");
const emptyStateEl = document.getElementById("empty-state");

let entries = [];

async function loadEntries() {
  // Alert 2: Check if we are trying to fetch data
  console.log("Step 2: Attempting to load entries...");
  
  const { data, error } = await supabase
    .from("essays")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert("DATABASE ERROR loading entries: " + error.message);
    console.error(error);
    return [];
  }
  
  // Alert 3: Success if we get here
  console.log("Success! Loaded " + data.length + " entries.");
  return data.map(e => ({ id: e.id, text: e.content, createdAt: e.created_at }));
}

async function saveEntry(text) {
  const { data, error } = await supabase
    .from("essays")
    .insert([{ content: text }])
    .select()
    .single();

  if (error) {
    alert("SAVE ERROR: " + error.message); 
    throw error;
  }

  return { id: data.id, text: data.content, createdAt: data.created_at };
}

async function deleteEntry(id) {
  const { error } = await supabase.from("essays").delete().eq("id", id);
  if (error) {
    alert("DELETE ERROR: " + error.message);
    throw error;
  }
}

// ... (Rendering logic remains the same) ...
function renderEntry(entry) {
  const li = document.createElement("li");
  li.className = "entry";
  li.innerHTML = `
    <p class="entry__text">${entry.text} <span class="entry__time">${new Date(entry.createdAt).toLocaleString()}</span></p>
    <button class="entry__delete" aria-label="Delete entry">×</button>
  `;
  li.querySelector("button").addEventListener("click", async () => {
    if(confirm("Delete this?")) {
      await deleteEntry(entry.id);
      li.remove();
      entries = entries.filter(e => e.id !== entry.id);
      renderAll();
    }
  });
  return li;
}

function renderAll() {
  entriesEl.replaceChildren(...entries.map(renderEntry));
  countEl.textContent = entries.length;
  emptyStateEl.hidden = entries.length > 0;
}

// ... (Event Listeners) ...
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = textInput.value.trim();
  if (!text) return;

  alert("Step 3: Sending data to Supabase..."); // Alert on click

  try {
    const saved = await saveEntry(text);
    entries = [saved, ...entries];
    renderAll();
    form.reset();
    alert("Step 4: SUCCESS! Entry Saved.");
  } catch (error) {
    // The alert inside saveEntry will show the specific error message
  }
});

// Initialization
(async function init() {
  try {
    entries = await loadEntries();
    renderAll();
  } catch (error) {
    alert("INIT ERROR: " + error.message);
  }
})();
