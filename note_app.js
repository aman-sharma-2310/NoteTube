// Firebase imports
import { getDatabase, ref, set, onValue, remove, get } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";


// Initialize Firebase
const db = getDatabase();
const auth = getAuth();

let notes = [];
let currentNoteId = null;
let currentUser = { id: "", name: "" };

// DOM
const notesList = document.getElementById('notes-list');
const titleInput = document.getElementById('note-title');
const contentInput = document.getElementById('note-content');
const newNoteBtn = document.getElementById('new-note-btn');
const saveBtn = document.getElementById('save-btn');
const deleteBtn = document.getElementById('delete-btn');
const searchInput = document.getElementById('search-input');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// User Authentication
onAuthStateChanged(auth, async user => {
  if (user) {
    currentUser.id = user.uid;
    const friends = await getFriendsList(user.uid);
    loadNotesFromFirebase();
    // Render to UI or use as needed
    friends.forEach(friend => {
      console.log(`${friend.name} (${friend.email})`);
    });
  } else {
    window.location.href = "login_signup.html";
  }
});

// Notes Functions
function loadNotesFromFirebase() {
  const notesRef = ref(db, `notes/${currentUser.id}`);
  onValue(notesRef, snapshot => {
    notes = snapshot.exists() ? Object.values(snapshot.val()) : [];
    saveToLocalStorage();
    displayNotes();
    if (notes.length > 0) loadNote(notes[0].id);
  });
}

function saveNoteToFirebase(note) {
  const noteRef = ref(db, `notes/${currentUser.id}/${note.id}`);
  set(noteRef, note);
}

function deleteNoteFromFirebase(noteId) {
  const noteRef = ref(db, `notes/${currentUser.id}/${noteId}`);
  remove(noteRef);
}

function saveToLocalStorage() {
  localStorage.setItem('notes', JSON.stringify(notes));
}

function displayNotes(list = notes) {
  notesList.innerHTML = '';

  if (list.length === 0) {
    notesList.innerHTML = `<div class="empty-state"><p>No notes found.</p></div>`;
    return;
  }

  const sorted = [...list].sort((a, b) => {
    if (a.pinned === b.pinned) return b.updatedAt - a.updatedAt;
    return a.pinned ? -1 : 1;
  });

  sorted.forEach(note => {
    const noteItem = document.createElement('div');
    noteItem.classList.add('note-item');
    if (note.id === currentNoteId) noteItem.classList.add('active');

    const preview = (note.content || "").substring(0, 60) + ((note.content || "").length > 60 ? '...' : '');
    const date = new Date(note.updatedAt || Date.now());
    const formattedDate = `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    noteItem.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <div class="note-title font-semibold">${note.title || 'Untitled'}</div>
                    <div class="note-preview text-sm">${preview}</div>
                    <div class="note-date text-xs text-gray-500">Updated: ${formattedDate}</div>
                </div>
                <button class="pin-btn text-lg">${note.pinned ? '📌' : '📍'}</button>
                <button class="share-btn text-lg">🔗</button> <!-- Share Button -->
            </div>
        `;

    // Add Event Listener for Share Button
    noteItem.querySelector('.share-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      shareNoteWithFriend(note);
    });

    noteItem.querySelector('.pin-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      togglePin(note.id);
    });

    noteItem.addEventListener('click', () => loadNote(note.id));
    notesList.appendChild(noteItem);
  });
}


function loadNote(id) {
  const note = notes.find(n => n.id === id);
  if (note) {
    currentNoteId = id;
    titleInput.value = note.title;
    contentInput.value = note.content;
    document.querySelectorAll('.note-item').forEach(item => item.classList.remove('active'));
    event.currentTarget?.classList?.add('active');
  }
}

function createNewNote() {
  const newNote = {
    id: Date.now().toString(),
    title: '',
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pinned: false
  };

  notes.unshift(newNote);
  currentNoteId = newNote.id;
  saveNoteToFirebase(newNote);
  saveToLocalStorage();
  displayNotes();
  titleInput.value = '';
  contentInput.value = '';
  titleInput.focus();
}

function saveCurrentNote() {
  if (!currentNoteId) return createNewNote();

  const note = notes.find(n => n.id === currentNoteId);
  if (note) {
    note.title = titleInput.value;
    note.content = contentInput.value;
    note.updatedAt = Date.now();
    saveNoteToFirebase(note);
    saveToLocalStorage();
    displayNotes();
    showToast("Note saved!");
  }
}

function deleteCurrentNote() {
  if (!currentNoteId) return;
  if (confirm('Delete this note?')) {
    notes = notes.filter(n => n.id !== currentNoteId);
    deleteNoteFromFirebase(currentNoteId);
    currentNoteId = null;
    saveToLocalStorage();
    displayNotes();
    titleInput.value = '';
    contentInput.value = '';
    showToast("Note deleted!");
  }
}

function togglePin(id) {
  const note = notes.find(n => n.id === id);
  if (note) {
    note.pinned = !note.pinned;
    note.updatedAt = Date.now();
    saveNoteToFirebase(note);
    saveToLocalStorage();
    displayNotes();
  }
}

function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Event Listeners
newNoteBtn.addEventListener('click', createNewNote);
saveBtn.addEventListener('click', saveCurrentNote);
deleteBtn.addEventListener('click', deleteCurrentNote);

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveCurrentNote();
  }
});

searchInput?.addEventListener('input', function () {
  const query = this.value.toLowerCase();
  const filtered = notes.filter(n =>
    (n.title && n.title.toLowerCase().includes(query)) ||
    (n.content && n.content.toLowerCase().includes(query))
  );
  displayNotes(filtered);
});

// Auto-save every 30 seconds
setInterval(() => {
  if (currentNoteId && (titleInput.value || contentInput.value)) {
    saveCurrentNote();
  }
}, 30000);

// Assuming you have a way to select the note (e.g., clicking a "Share" button on a note)
document.querySelectorAll(".shareNoteBtn").forEach(button => {
  button.addEventListener("click", () => {
    const noteId = button.dataset.noteId;  // Assuming each button has a data attribute with the noteId
    const note = notes.find(n => n.id === noteId); // Get the actual note by id
    shareModal.style.display = "block";
    document.getElementById("shareNoteBtn").disabled = false;
    
    document.getElementById("shareNoteBtn").addEventListener("click", () => {
      const friendId = document.getElementById("friendSelect").value;
      if (friendId) {
        shareNoteWithFriend(friendId, note);
      } else {
        showToast("Please select a friend.");
      }
    });
  });
});

// Function to share the note
async function shareNoteWithFriend(friendId, note) {
  if (!currentUser || !currentUser.email) {
    showToast("User info missing.");
    return;
  }

  const sharedNoteRef = ref(db, `shared_notes/${friendId}/${Date.now()}`);
  const sharedData = {
    ...note,
    sharedBy: {
      id: currentUser.id,
      name: currentUser.name || "Unknown",
      email: currentUser.email || ""
    },
    sharedAt: Date.now()
  };

  try {
    await set(sharedNoteRef, sharedData);
    sendSharedNoteInChat(note, friendId);  // Assuming you have a function for chat sharing
    showToast("Note shared successfully!");
    document.getElementById("shareModal").style.display = "none";
  } catch (err) {
    console.error("Error sharing note:", err);
    showToast("Failed to share note.");
  }
}

async function getFriendsList() {
  const dbRef = ref(getDatabase(), `friends/${currentUser.id}`);
  const snapshot = await get(dbRef);
  if (snapshot.exists()) {
    const data = snapshot.val();
    // Convert the object into an array of friends
    return Object.entries(data).map(([id, info]) => ({
      id,
      name: info.name,
      email: info.email,
      avatar: info.avatar
    }));
  } else {
    return []; // no friends
  }
}

async function populateFriendSelect() {
  const select = document.getElementById("friendSelect");
  select.innerHTML = `<option value="">Select a friend</option>`; // Reset

  const friends = await getFriendsList();
  if (!friends.length) {
    select.innerHTML = `<option value="">No friends found</option>`;
    return;
  }

  friends.forEach(friend => {
    const option = document.createElement("option");
    option.value = friend.id;
    option.textContent = friend.name || "Unnamed";
    select.appendChild(option);
  });
}