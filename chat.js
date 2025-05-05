import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getDatabase, ref, set, get, child, onValue, query, orderByChild, equalTo, remove, update, push } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";

const auth = getAuth();
const db = getDatabase();

let currentUser = {
    id: "",
    name: "",
    email: "",
    avatar: "generic-user-icon-9.jpg"
};

// Set up on login
onAuthStateChanged(auth, user => {
    if (user) {
        currentUser.id = user.uid;
        loadChatList();

        const storedName = sessionStorage.getItem("currentUserName");
        if (storedName) {
            currentUser.name = storedName;
            updateUIWithName(currentUser.name);
            loadFriendRequests();
        } else {
            const userRef = ref(db, `users/${user.uid}`);
            onValue(userRef, snapshot => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    currentUser.name = data.name?.trim() || "User";
                    currentUser.email = data.email?.trim() || "";
                    currentUser.avatar = data.avatar || "generic-user-icon-9.jpg";

                    // Save name to session storage
                    sessionStorage.setItem("currentUserName", currentUser.name);

                    updateUIWithName(currentUser.name);
                    loadFriendRequests();
                }
            });
        }
    } else {
        window.location.href = "login_signup.html";
        console.log("User not logged in.");
    }
});

// Helper function to update UI
function updateUIWithName(name) {
    const dashName = document.getElementById("dash_name");
    dashName.removeAttribute("href");
    dashName.textContent = name;
}


// Friend Request Logic
const popupTrigger = document.getElementById('popupTrigger');
const popup = document.getElementById('popup');
const popupOverlay = document.getElementById('popupOverlay');
const popupClose = document.getElementById('popupClose');
const requestsList = document.getElementById('requestsList');

let requests = [];

function loadFriendRequests() {
    const requestsRef = ref(db, `friendRequests/${currentUser.id}`);
    onValue(requestsRef, snapshot => {
        requests = [];
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const senderId = child.key;
                const data = child.val();
                requests.push({
                    id: senderId,
                    name: data.name,
                    email: data.email,
                    avatar: data.avatar || "generic-user-icon-9.jpg"
                });
            });
        }
        renderRequests();
    });
}

function renderRequests() {
    requestsList.innerHTML = '';

    if (requests.length === 0) {
        requestsList.innerHTML = `<p class="text-gray-500 text-center">No Requests</p>`;
        return;
    }

    requests.forEach(request => {
        const requestItem = document.createElement('div');
        requestItem.className = "flex items-center justify-between p-3 bg-gray-100 rounded-lg mb-2";
        requestItem.innerHTML = `
            <div class="flex items-center space-x-3">
                <img src="${request.avatar}" alt="${request.name}" class="w-10 h-10 rounded-full">
                <span class="font-medium">${request.name}</span>
            </div>
            <div class="space-x-2">
                <button class="accept-btn bg-green-500 text-white px-2 py-1 rounded" data-id="${request.id}">Accept</button>
                <button class="reject-btn bg-red-500 text-white px-2 py-1 rounded" data-id="${request.id}">Reject</button>
            </div>
        `;
        requestsList.appendChild(requestItem);
    });

    document.querySelectorAll('.accept-btn').forEach(btn => {
        btn.addEventListener('click', () => acceptRequest(btn.dataset.id));
    });

    document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', () => rejectRequest(btn.dataset.id));
    });
}

function acceptRequest(senderId) {
    const sender = requests.find(r => r.id === senderId);
    if (!sender) return;

    const chatId = generateChatId(currentUser.id, senderId);

    const updates = {};

    // Add each other as friends
    updates[`friends/${currentUser.id}/${senderId}`] = {
        name: sender.name,
        email: sender.email,
        avatar: sender.avatar
    };
    updates[`friends/${senderId}/${currentUser.id}`] = {
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar
    };

    // Create chat reference
    updates[`chatList/${currentUser.id}/${chatId}`] = {
        friendId: senderId,
        friendName: sender.name,
        friendAvatar: sender.avatar,
        lastMessage: "",
        timestamp: Date.now()
    };
    updates[`chatList/${senderId}/${chatId}`] = {
        friendId: currentUser.id,
        friendName: currentUser.name,
        friendAvatar: currentUser.avatar,
        lastMessage: "",
        timestamp: Date.now()
    };

    // Optional: create an empty chat node
    updates[`chats/${chatId}`] = {
        messages: []
    };

    // Remove friend request
    updates[`friendRequests/${currentUser.id}/${senderId}`] = null;

    update(ref(db), updates).then(() => {
        console.log(`Friend request accepted and chat created with ${sender.name}`);
    });
}


function rejectRequest(senderId) {
    const requestRef = ref(db, `friendRequests/${currentUser.id}/${senderId}`);
    remove(requestRef).then(() => {
        console.log(`Rejected friend request from ${senderId}`);
    });
}

popupTrigger.addEventListener('click', () => {
    popup.style.display = 'block';
    popupOverlay.style.display = 'block';

});
popupClose.addEventListener('click', () => {
    popup.style.display = 'none';
    popupOverlay.style.display = 'none';
});
popupOverlay.addEventListener('click', () => {
    popup.style.display = 'none';
    popupOverlay.style.display = 'none';
});

// Add Friends
const addFriendsSpan = document.getElementById('add-friends-popup');
const popupAdd = document.getElementById('in_popup');
const popupOverlayAdd = document.getElementById('popup-overlay');
const popupAddClose = document.getElementById('popupAddClose');
const searchInput = document.getElementById('searchUser');
const contactList = document.getElementById('contactList');

let contacts = [];

addFriendsSpan.addEventListener('click', () => {
    popupAdd.style.display = 'block';
    popupOverlayAdd.style.display = 'block';
    let c_w = document.getElementById("messagesContainer");
    if (c_w) {
        c_w.setAttribute("hidden", "true");  // Add the "hidden" attribute to hide the element
    }

});
popupAddClose.addEventListener('click', closeAddPopup);
popupOverlayAdd.addEventListener('click', closeAddPopup);

function closeAddPopup() {
    popupAdd.style.display = 'none';
    popupOverlayAdd.style.display = 'none';
    searchInput.value = '';
    contactList.innerHTML = '';
    contacts = [];
    window.location.reload();
}

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    if (searchTerm) {
        searchByEmail(searchTerm);
    } else {
        contactList.innerHTML = '';
    }
});

function searchByEmail(email) {
    const emailQuery = query(ref(db, 'users'), orderByChild('email'), equalTo(email));
    onValue(emailQuery, snapshot => {
        contacts = [];
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const uid = child.key;
                const data = child.val();
                if (uid !== currentUser.id) {
                    contacts.push({
                        id: uid,
                        name: data.name,
                        email: data.email,
                        avatar: data.avatar || "generic-user-icon-9.jpg",
                        added: false
                    });
                }
            });
            renderContacts(contacts);
        } else {
            contactList.innerHTML = `<p class="text-center text-gray-500">No User found</p>`;
        }
    });
}

function renderContacts(list) {
    availableUser.innerHTML = '';
    list.forEach(contact => {
        const div = document.createElement('div');
        div.className = "flex items-center space-x-3 p-2 hover:bg-gray-200 rounded cursor-pointer";
        div.innerHTML = `
            <img src="${contact.avatar}" alt="${contact.name}" class="w-10 h-10 rounded-full">
            <span class="font-medium flex-grow">${contact.name}</span>
            <span class="text-xl text-green-500 font-bold add-friend-btn cursor-pointer" data-id="${contact.id}">${contact.added ? '✓' : '+'}</span>
        `;
        availableUser.appendChild(div);
    });

    document.querySelectorAll('.add-friend-btn').forEach(btn => {
        btn.addEventListener('click', () => addFriend(btn.dataset.id));
    });
}

function addFriend(receiverId) {
    const contact = contacts.find(c => c.id === receiverId);
    if (!contact || contact.added) return;

    contact.added = true;
    const requestRef = ref(db, `friendRequests/${receiverId}/${currentUser.id}`);

    const requestData = {
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        timestamp: Date.now()
    };

    set(requestRef, requestData).then(() => {
        console.log(`Friend request sent to ${contact.name}`);
        renderContacts(contacts);
    });
}
function generateChatId(id1, id2) {
    return [id1, id2].sort().join("_"); // ensures same ID for both users
}
function loadChatList() {
    const chatListRef = ref(db, `chatList/${currentUser.id}`);
    onValue(chatListRef, snapshot => {
        const chatListContainer = document.getElementById("chatList");
        chatListContainer.innerHTML = '';

        if (snapshot.exists()) {
            const chatList = snapshot.val();
            Object.entries(chatList).forEach(([chatId, chatData]) => {
                const chatDiv = document.createElement("div");
                chatDiv.className = "relative flex items-center justify-between p-2 hover:bg-gray-100 rounded";

                // Three-dot button
                const moreBtn = document.createElement('button');
                moreBtn.innerHTML = "⋮";
                moreBtn.className = "text-gray-600 px-2 text-xl";
                moreBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering chat open
                    togglePopup(chatDiv, chatId, chatData.friendId);
                });

                // Chat content (click to open chat)
                const chatInfo = document.createElement("div");
                chatInfo.className = "flex items-center space-x-3 cursor-pointer flex-grow";
                chatInfo.innerHTML = `
                    <img src="${chatData.friendAvatar}" alt="${chatData.friendName}" class="w-10 h-10 rounded-full">
                    <div class="flex flex-col">
                        <span class="font-medium">${chatData.friendName}</span>
                        <span class="text-sm text-gray-500">${chatData.lastMessage || "Start chatting..."}</span>
                    </div>
                `;
                chatInfo.addEventListener('click', () => {
                    openChatWindow(chatId, chatData.friendId, chatData.friendName, chatData.friendAvatar);
                });

                // Append
                chatDiv.appendChild(chatInfo);
                chatDiv.appendChild(moreBtn);
                chatListContainer.appendChild(chatDiv);
            });
        } else {
            chatListContainer.innerHTML = `<p class="text-center text-gray-500">No Chats yet</p>`;
        }
    });
}
window.clearChat = function (chatId) {
    const chatMessagesRef = ref(db, `chats/${chatId}/messages`);
    remove(chatMessagesRef)
        .then(() => {
            console.log("✅ Chat messages cleared.");
            window.location.reload();
        })
        .catch((error) => {
            console.error("❌ Failed to clear chat:", error);
        });
};

window.unfriend = function (friendId, chatId) {
    const updates = {};
    updates[`friends/${currentUser.id}/${friendId}`] = null;
    updates[`friends/${friendId}/${currentUser.id}`] = null;
    updates[`chatList/${currentUser.id}/${chatId}`] = null;
    updates[`chatList/${friendId}/${chatId}`] = null;
    updates[`chats/${chatId}`] = null;

    update(ref(db), updates)
        .then(() => {
            console.log("✅ Unfriended successfully.");
            window.location.reload();
        })
        .catch((error) => {
            console.error("❌ Failed to unfriend:", error);
        });
};

// Add popup functions and handlers
function togglePopup(parentDiv, chatId, friendId) {
    // Remove existing popups
    document.querySelectorAll('.popup-options').forEach(el => el.remove());

    const popup = document.createElement('div');
    popup.className = "popup-options absolute right-2 top-12 bg-white border rounded shadow p-2 z-10";
    popup.innerHTML = `
        <button class="block w-full text-left px-2 py-1 hover:bg-gray-100" onclick="clearChat('${chatId}')">Clear Chat</button>
        <button class="block w-full text-left px-2 py-1 hover:bg-gray-100 text-red-600" onclick="unfriend('${friendId}', '${chatId}')">Unfriend</button>
    `;

    // Close popup if clicked elsewhere
    setTimeout(() => {
        window.addEventListener('click', closePopupOnce);
    }, 0);

    function closePopupOnce() {
        popup.remove();
        window.removeEventListener('click', closePopupOnce);
    }

    parentDiv.appendChild(popup);
}

function openChatWindow(chatId, friendId, friendName, friendAvatar) {
    const chatWindow = document.getElementById("chatWindow");
    chatWindow.innerHTML = `
        <div class="flex items-center space-x-3 border-b pb-2 mb-2">
            <img src="${friendAvatar}" class="w-10 h-10 rounded-full">
            <h2 class="text-lg font-semibold">${friendName}</h2>
        </div>

        <div class="relative h-[calc(100%-80px)] flex flex-col">
            <!-- Messages container -->
            <div id="messagesContainer" class="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50 rounded mb-2"></div>

            <!-- Fixed input bar -->
            <div class="absolute bottom-0 left-0 w-full bg-white p-2 border-t flex space-x-2">
                <input id="messageInput" type="text" placeholder="Type a message..."
                    class="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
                <button id="sendMessageBtn" class="bg-blue-500 text-white px-4 py-2 rounded">Send</button>
            </div>
        </div>
    `;

    // Load messages from Firebase
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    onValue(messagesRef, snapshot => {
        const container = document.getElementById("messagesContainer");
        container.innerHTML = ''; // Clear the existing messages
        if (snapshot.exists()) {
            snapshot.forEach(msgSnap => {
                const msg = msgSnap.val();
                const msgDiv = document.createElement('div');
                msgDiv.className = `p-2 rounded max-w-xs ${msg.sender === currentUser.id ? 'bg-blue-100 self-end ml-auto' : 'bg-gray-200 self-start mr-auto'}`;
                msgDiv.textContent = msg.text;
                container.appendChild(msgDiv);
            });
            // Scroll to the bottom to show the latest message
            container.scrollTop = container.scrollHeight;
        }
    });

    // Send a message to Firebase
    document.getElementById("sendMessageBtn").addEventListener('click', () => {
        const input = document.getElementById("messageInput");
        const text = input.value.trim();
        if (text) {
            const newMsgRef = push(ref(db, `chats/${chatId}/messages`));
            const msgData = {
                sender: currentUser.id,
                text,
                timestamp: Date.now()
            };
            set(newMsgRef, msgData).then(() => {
                // Optional: Update last message in the chat list
                const updates = {};
                updates[`chatList/${currentUser.id}/${chatId}/lastMessage`] = text;
                updates[`chatList/${currentUser.id}/${chatId}/timestamp`] = Date.now();
                updates[`chatList/${friendId}/${chatId}/lastMessage`] = text;
                updates[`chatList/${friendId}/${chatId}/timestamp`] = Date.now();
                update(ref(db), updates);
            });
            input.value = ''; // Clear the input after sending
        }
    });
}