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

async function shareNoteWithFriend(friendId, note) {
    if (!currentUser || !currentUser.email) {
        showToast("User info missing.");
        return;
    }

    const sharedNoteRef = ref(db, `shared_notes/${friendId}/${Date.now()}`);
    await set(sharedNoteRef, {
        ...note,
        sharedBy: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email
        },
        sharedAt: Date.now()
    });

    showToast("Note shared successfully!");
}


document.getElementById("shareNoteBtn").addEventListener("click", () => {
    const selectedFriendId = document.getElementById("friendSelect").value;

    if (!selectedFriendId) {
        showToast("Please select a friend to share with.");
        return;
    }

    shareNoteWithFriend(selectedFriendId, currentNote); // pass selected friend and note
});

function shareNoteToFirebase(friendId, note) {
    const sharedNoteRef = ref(db, `shared_notes/${friendId}/${note.id}`);
    set(sharedNoteRef, note)
        .then(() => {
            alert('Note shared successfully!');
        })
        .catch(error => {
            console.error('Error sharing note:', error);
        });
}

function sendSharedNoteInChat(note, friendId) {
    const message = {
        senderId: currentUser.id,
        receiverId: friendId,
        content: `<strong>Shared Note:</strong> ${note.title} <br> ${note.content}`,
        timestamp: Date.now(),
    };
    const chatRef = ref(db, `chats/${currentUser.id}/${friendId}`);
    push(chatRef, message);
}
