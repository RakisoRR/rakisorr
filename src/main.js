import "./style.css";
import { cloneDefaults, hydrateIds } from "./defaults.js";
import { isSupabaseConfigured, supabase } from "./supabase.js";
import { fetchBookmarkTree, replaceBookmarkTree } from "./api.js";

const LS_STATE = "bookmarks-state-v1";
const LS_EDIT = "bookmarks-editmode";

const sectionsRoot = document.getElementById("sections");
const filterInput = document.getElementById("filter-q");
const emptyState = document.getElementById("emptyState");
const clockTime = document.getElementById("clockTime");
const clockDate = document.getElementById("clockDate");
const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const editToggle = document.getElementById("editToggle");
const settingsMenu = document.getElementById("settingsMenu");
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const resetBtn = document.getElementById("resetBtn");
const importFile = document.getElementById("importFile");
const accountEl = document.getElementById("account");
const userEmailEl = document.getElementById("userEmail");
const addSectionBtn = document.getElementById("addSectionBtn");

const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const authModalTitle = document.getElementById("authModalTitle");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authMessage = document.getElementById("authMessage");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authTabSignIn = document.getElementById("authTabSignIn");
const authTabSignUp = document.getElementById("authTabSignUp");
const closeAuthModalBtn = document.getElementById("closeAuthModal");
const cancelAuthBtn = document.getElementById("cancelAuthBtn");

const bookmarkModal = document.getElementById("bookmarkModal");
const bookmarkForm = document.getElementById("bookmarkForm");
const modalTitle = document.getElementById("modalTitle");
const closeModalBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const deleteBtn = document.getElementById("deleteBtn");
const titleInput = document.getElementById("title");
const urlInput = document.getElementById("url");
const initialsInput = document.getElementById("initials");
const sectionSelect = document.getElementById("section");
const editIdInput = document.getElementById("editId");
const editSectionIndexInput = document.getElementById("editSectionIndex");

let user = null;
let state = hydrateIds(cloneDefaults());
let editMode = localStorage.getItem(LS_EDIT) === "1";
let saving = false;
let saveTimer = null;
let authMode = "signin"; // signin | signup

function deriveInitials(title) {
  if (!title) return "??";
  const words = title.trim().split(/\s+/);
  const chars = (words[0][0] || "").toUpperCase() + (words[1]?.[0] || "").toUpperCase();
  return chars || title.slice(0, 2).toUpperCase();
}

function displayHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function cssSafe(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

function cacheState() {
  localStorage.setItem(LS_STATE, JSON.stringify(state));
}

function loadCache() {
  try {
    const raw = localStorage.getItem(LS_STATE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.sections) return null;
    return hydrateIds(parsed);
  } catch {
    return null;
  }
}

function setEditMode(on) {
  editMode = Boolean(on) && Boolean(user);
  localStorage.setItem(LS_EDIT, editMode ? "1" : "0");
  document.body.classList.toggle("edit-mode", editMode);
  editToggle.setAttribute("aria-pressed", editMode ? "true" : "false");
  editToggle.classList.toggle("toggled", editMode);
  render();
}

function updateAuthChrome() {
  const signedIn = Boolean(user);
  const configured = isSupabaseConfigured;
  settingsMenu.hidden = !configured;
  signInBtn.hidden = signedIn || !configured;
  signOutBtn.hidden = !signedIn;
  editToggle.hidden = !signedIn;
  exportBtn.hidden = !signedIn;
  importBtn.hidden = !signedIn;
  resetBtn.hidden = !signedIn;
  accountEl.hidden = !signedIn;
  if (!signedIn) closeSettingsMenu();

  if (signedIn) {
    userEmailEl.textContent = user.email || "Signed in";
  }
}

function closeSettingsMenu() {
  settingsPanel.hidden = true;
  settingsBtn.setAttribute("aria-expanded", "false");
}

function toggleSettingsMenu() {
  const open = settingsPanel.hidden;
  settingsPanel.hidden = !open;
  settingsBtn.setAttribute("aria-expanded", open ? "true" : "false");
}

function setAuthMessage(message, isError = false) {
  authMessage.hidden = !message;
  authMessage.textContent = message || "";
  authMessage.classList.toggle("error", Boolean(isError && message));
}

function setAuthMode(mode) {
  authMode = mode;
  const isSignIn = mode === "signin";
  authModalTitle.textContent = isSignIn ? "Sign in" : "Create account";
  authSubmitBtn.textContent = isSignIn ? "Sign in" : "Create account";
  authPassword.autocomplete = isSignIn ? "current-password" : "new-password";
  authTabSignIn.classList.toggle("toggled", isSignIn);
  authTabSignUp.classList.toggle("toggled", !isSignIn);
  authTabSignIn.setAttribute("aria-selected", isSignIn ? "true" : "false");
  authTabSignUp.setAttribute("aria-selected", isSignIn ? "false" : "true");
  setAuthMessage("");
}

function openAuthModal(mode = "signin") {
  if (!supabase) return;
  setAuthMode(mode);
  authForm.reset();
  authModal.showModal();
  setTimeout(() => authEmail.focus(), 10);
}

function closeAuthModal() {
  authModal.close();
  setAuthMessage("");
}

async function persistState(nextState = state) {
  state = hydrateIds(nextState);
  cacheState();
  render();

  if (!user || !supabase) return;

  saving = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      state = await replaceBookmarkTree(user.id, state);
      cacheState();
    } catch (err) {
      console.error(err);
    } finally {
      saving = false;
    }
  }, 350);
}

async function loadFromCloud() {
  if (!user || !supabase) return;

  try {
    let tree = await fetchBookmarkTree(user.id);
    if (!tree.sections.length) {
      tree = hydrateIds(cloneDefaults());
      tree = await replaceBookmarkTree(user.id, tree);
    }
    state = hydrateIds(tree);
    cacheState();
    render();
  } catch (err) {
    console.error(err);
    const cached = loadCache();
    if (cached) {
      state = cached;
      render();
    }
  }
}

function render() {
  const filterQuery = filterInput.value;
  sectionsRoot.innerHTML = "";

  state.sections.forEach((section, sectionIndex) => {
    const sectionEl = document.createElement("section");
    sectionEl.dataset.section = cssSafe(section.name);

    const header = document.createElement("div");
    header.className = "section-header";
    header.innerHTML = `
      <h2 id="sec-${cssSafe(section.name)}-${sectionIndex}">${escapeHtml(section.name)}</h2>
      <span class="section-controls">
        <button type="button" class="btn" data-action="rename">Rename</button>
        <button type="button" class="btn" data-action="up" aria-label="Move section up">▲</button>
        <button type="button" class="btn" data-action="down" aria-label="Move section down">▼</button>
        <button type="button" class="btn danger" data-action="delete">Delete</button>
      </span>
    `;
    sectionEl.appendChild(header);

    header.querySelector('[data-action="rename"]').addEventListener("click", () => renameSection(sectionIndex));
    header.querySelector('[data-action="up"]').addEventListener("click", () => moveSection(sectionIndex, -1));
    header.querySelector('[data-action="down"]').addEventListener("click", () => moveSection(sectionIndex, 1));
    header.querySelector('[data-action="delete"]').addEventListener("click", () => deleteSection(sectionIndex));

    const list = document.createElement("div");
    list.className = "bookmarks";
    list.setAttribute("role", "list");

    section.items.forEach((item) => {
      list.appendChild(renderBookmark(item, sectionIndex));
    });
    list.appendChild(renderAddTile(sectionIndex));

    sectionEl.appendChild(list);
    sectionsRoot.appendChild(sectionEl);
  });

  applyFilter(filterQuery);
}

function renderBookmark(item, sectionIndex) {
  const link = document.createElement("a");
  link.className = "bookmark";
  link.href = item.url;
  link.rel = "noopener noreferrer";
  link.setAttribute("role", "listitem");
  link.dataset.title = item.title.toLowerCase();
  link.dataset.host = displayHost(item.url).toLowerCase();
  link.innerHTML = `
    <span class="icon" aria-hidden="true">${escapeHtml(item.initials || deriveInitials(item.title))}</span>
    <span class="bookmark-meta">
      <span class="bookmark-title">${escapeHtml(item.title)}</span>
      <span class="bookmark-url">${escapeHtml(displayHost(item.url))}</span>
    </span>
    <button type="button" class="edit-btn" title="Edit" aria-label="Edit bookmark">✎</button>
  `;
  link.querySelector(".edit-btn").addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openBookmarkModal({ mode: "edit", sectionIndex, bookmark: item });
  });
  return link;
}

function renderAddTile(sectionIndex) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "add-tile";
  btn.innerHTML = `<span class="plus" aria-hidden="true">+</span><span class="bookmark-title">Add bookmark</span>`;
  btn.addEventListener("click", () => openBookmarkModal({ mode: "add", sectionIndex }));
  return btn;
}

function applyFilter(query) {
  const term = query.trim().toLowerCase();
  let visibleCount = 0;

  sectionsRoot.querySelectorAll("section").forEach((section) => {
    let sectionVisible = 0;
    section.querySelectorAll(".bookmark").forEach((link) => {
      const matches = !term
        || link.dataset.title.includes(term)
        || link.dataset.host.includes(term);
      link.hidden = !matches;
      if (matches) sectionVisible += 1;
    });
    const addTile = section.querySelector(".add-tile");
    const showSection = sectionVisible > 0 || (editMode && !term);
    if (addTile) addTile.hidden = Boolean(term);
    section.hidden = !showSection;
    visibleCount += sectionVisible;
  });

  emptyState.hidden = visibleCount > 0 || (editMode && !term);
  emptyState.classList.toggle("visible", visibleCount === 0 && term.length > 0);
}

function updateClock() {
  const now = new Date();
  clockTime.textContent = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  clockDate.textContent = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function populateSectionSelect(preselectIndex) {
  sectionSelect.innerHTML = "";
  state.sections.forEach((section, index) => {
    const opt = document.createElement("option");
    opt.value = String(index);
    opt.textContent = section.name;
    sectionSelect.appendChild(opt);
  });
  const divider = document.createElement("option");
  divider.disabled = true;
  divider.textContent = "──────────";
  const create = document.createElement("option");
  create.value = "__new__";
  create.textContent = "Create new section…";
  sectionSelect.appendChild(divider);
  sectionSelect.appendChild(create);
  sectionSelect.value = preselectIndex != null ? String(preselectIndex) : "0";
}

function openBookmarkModal({ mode, sectionIndex, bookmark }) {
  if (!user) return;
  if (mode === "add") {
    modalTitle.textContent = "Add bookmark";
    editIdInput.value = "";
    editSectionIndexInput.value = String(sectionIndex);
    titleInput.value = "";
    urlInput.value = "";
    initialsInput.value = "";
    populateSectionSelect(sectionIndex);
    deleteBtn.hidden = true;
  } else {
    modalTitle.textContent = "Edit bookmark";
    editIdInput.value = bookmark.id;
    editSectionIndexInput.value = String(sectionIndex);
    titleInput.value = bookmark.title;
    urlInput.value = bookmark.url;
    initialsInput.value = bookmark.initials || deriveInitials(bookmark.title);
    populateSectionSelect(sectionIndex);
    deleteBtn.hidden = false;
  }
  bookmarkModal.showModal();
  setTimeout(() => titleInput.focus(), 10);
}

function closeBookmarkModal() {
  bookmarkModal.close();
}

async function renameSection(index) {
  const current = state.sections[index].name;
  const name = prompt("Rename section:", current);
  if (!name || !name.trim() || name.trim() === current) return;
  state.sections[index].name = name.trim();
  await persistState(state);
}

async function moveSection(index, delta) {
  const next = index + delta;
  if (next < 0 || next >= state.sections.length) return;
  const copy = state.sections.slice();
  const [sec] = copy.splice(index, 1);
  copy.splice(next, 0, sec);
  state.sections = copy;
  await persistState(state);
}

async function deleteSection(index) {
  const section = state.sections[index];
  const count = section.items.length;
  const message = count
    ? `Delete “${section.name}” and its ${count} bookmark(s)?`
    : `Delete empty section “${section.name}”?`;
  if (!confirm(message)) return;
  state.sections.splice(index, 1);
  await persistState(state);
}

sectionSelect.addEventListener("change", () => {
  if (sectionSelect.value !== "__new__") return;
  const name = prompt("New section name:");
  if (name && name.trim()) {
    state.sections.push({ id: crypto.randomUUID(), name: name.trim(), items: [] });
    populateSectionSelect(state.sections.length - 1);
  } else {
    populateSectionSelect(0);
  }
});

bookmarkForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!user) return;

  const payload = {
    title: titleInput.value.trim(),
    url: urlInput.value.trim(),
    initials: (initialsInput.value || deriveInitials(titleInput.value)).toUpperCase().slice(0, 3),
  };

  let destIndex = sectionSelect.value === "__new__" ? null : Number(sectionSelect.value);
  const editingId = editIdInput.value;
  const originalIndex = Number(editSectionIndexInput.value);

  if (destIndex == null) {
    const name = prompt("New section name:");
    if (!name || !name.trim()) return;
    state.sections.push({ id: crypto.randomUUID(), name: name.trim(), items: [] });
    destIndex = state.sections.length - 1;
  }

  if (editingId) {
    const srcItems = state.sections[originalIndex].items;
    const idx = srcItems.findIndex((b) => b.id === editingId);
    if (idx === -1) return;
    const updated = { ...srcItems[idx], ...payload };
    srcItems.splice(idx, 1);
    state.sections[destIndex].items.push(updated);
  } else {
    state.sections[destIndex].items.push({
      id: crypto.randomUUID(),
      ...payload,
    });
  }

  closeBookmarkModal();
  await persistState(state);
});

deleteBtn.addEventListener("click", async () => {
  const id = editIdInput.value;
  if (!id) return;
  const secIdx = Number(editSectionIndexInput.value);
  state.sections[secIdx].items = state.sections[secIdx].items.filter((b) => b.id !== id);
  closeBookmarkModal();
  await persistState(state);
});

closeModalBtn.addEventListener("click", closeBookmarkModal);
cancelBtn.addEventListener("click", closeBookmarkModal);

addSectionBtn.addEventListener("click", async () => {
  if (!user) return;
  const name = prompt("New section name:");
  if (!name || !name.trim()) return;
  state.sections.push({ id: crypto.randomUUID(), name: name.trim(), items: [] });
  await persistState(state);
});

editToggle.addEventListener("click", () => {
  setEditMode(!editMode);
  closeSettingsMenu();
});

settingsBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleSettingsMenu();
});

document.addEventListener("click", (event) => {
  if (!settingsMenu.contains(event.target)) closeSettingsMenu();
});

exportBtn.addEventListener("click", () => {
  closeSettingsMenu();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bookmarks.json";
  a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => {
  closeSettingsMenu();
  importFile.click();
});

importFile.addEventListener("change", async () => {
  const file = importFile.files?.[0];
  importFile.value = "";
  if (!file || !user) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed?.sections) throw new Error("Invalid bookmarks JSON");
    await persistState(hydrateIds(parsed));
  } catch (err) {
    console.error(err);
  }
});

resetBtn.addEventListener("click", async () => {
  closeSettingsMenu();
  if (!user) return;
  if (!confirm("Replace your cloud bookmarks with the built-in defaults?")) return;
  await persistState(hydrateIds(cloneDefaults()));
});

signInBtn.addEventListener("click", () => {
  closeSettingsMenu();
  openAuthModal("signin");
});
authTabSignIn.addEventListener("click", () => setAuthMode("signin"));
authTabSignUp.addEventListener("click", () => setAuthMode("signup"));
closeAuthModalBtn.addEventListener("click", closeAuthModal);
cancelAuthBtn.addEventListener("click", closeAuthModal);

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) return;

  const email = authEmail.value.trim();
  const password = authPassword.value;
  authSubmitBtn.disabled = true;
  setAuthMessage(authMode === "signin" ? "Signing in…" : "Creating account…");

  try {
    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session) {
        closeAuthModal();
      } else {
        setAuthMessage("Check your email to confirm your account, then sign in.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      closeAuthModal();
    }
  } catch (err) {
    console.error(err);
    setAuthMessage(err.message || "Authentication failed", true);
  } finally {
    authSubmitBtn.disabled = false;
  }
});

signOutBtn.addEventListener("click", async () => {
  closeSettingsMenu();
  if (!supabase) return;
  await supabase.auth.signOut();
});

filterInput.addEventListener("input", () => applyFilter(filterInput.value));

document.addEventListener("keydown", (event) => {
  if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  event.preventDefault();
  filterInput.focus();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && user && !saving) {
    loadFromCloud();
  }
});

async function handleSession(session) {
  user = session?.user ?? null;
  updateAuthChrome();
  if (user) {
    await loadFromCloud();
    setEditMode(editMode);
  } else {
    state = hydrateIds(cloneDefaults());
    setEditMode(false);
    render();
  }
}

async function init() {
  updateClock();
  setInterval(updateClock, 30_000);
  updateAuthChrome();

  if (!isSupabaseConfigured) {
    state = hydrateIds(cloneDefaults());
    render();
    return;
  }

  const { data } = await supabase.auth.getSession();
  await handleSession(data.session);

  supabase.auth.onAuthStateChange((_event, session) => {
    handleSession(session);
  });
}

init();
