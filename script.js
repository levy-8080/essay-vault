// Replace with your actual Supabase URL and Anon Public Key
const SUPABASE_URL = 'https://jboqpkflktriltvichvy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WCRT11CQKRrGVeL1DZn9mw_GzzUiHth';

// CORRECTED: Pass the defined variables into the client initialization
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
 * Inserts the text into the cloud database and returns the created row.
 */
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

/**
 * --- Database hook ---
 * Fetches all saved essays from the database ordered by newest first.
 */
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

/**
 * --- Database hook ---
 * Deletes the matching row from the cloud database and clears it locally.
 */
async function deleteEntry(id) {
  const { error } = await supabase
    .from("essays")
    .delete()
    .eq("id", id);

  if (error) throw error;

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
    try {
      await deleteEntry(entry.id);
      li.remove();
      renderAll();
    } catch (error) {
      console.error(error);
      alert("Failed to delete entry from database.");
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
