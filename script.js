import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, onAuthStateChanged, setPersistence, browserSessionPersistence, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getDatabase, ref, set, get, child, onValue } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
const auth = getAuth();
function checkUserAndRedirect(url) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.location.href = url;
        } else {
            alert("You must be logged in to access this feature.");
            window.location.href = "login_signup.html"; // Replace with your login page
        }
    });
}

// Attach events after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn_youtube").addEventListener("click", () => {
        checkUserAndRedirect("https://www.youtube.com");
    });
    document.getElementById("btn_chats").addEventListener("click", () => {
        checkUserAndRedirect("chat.html");
    });
    document.getElementById("btn_chatbot").addEventListener("click", () => {
        checkUserAndRedirect("https://chat.openai.com/");
    });
    document.getElementById("btn_notes").addEventListener("click", () => {
        checkUserAndRedirect("note.html");
    });
});
onAuthStateChanged(auth, (user) => {
    if (user) {
        const db = getDatabase();
        const userRef = ref(db, 'users/' + user.uid);

        // Check if name is already stored in session
        const cachedName = sessionStorage.getItem('profileName');
        const g = document.getElementById("dash_name");
        g.removeAttribute("href");

        if (cachedName) {
            // Use cached name
            g.textContent = "Welcome " + cachedName;
            document.getElementById("dp").hidden = false;
            document.getElementById("dash_div").classList.remove("hover:text-blue-500");
        } else {
            // Fetch from database if not cached
            onValue(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    let n = data["name"]?.trim();

                    if (n && g) {
                        sessionStorage.setItem('profileName', n); // Save to session
                        g.textContent = "Welcome " + n;
                        document.getElementById("dp").hidden = false;
                        document.getElementById("dash_div").classList.remove("hover:text-blue-500");
                    }
                } else {
                    console.log("No data found for user:", user.uid);
                }
            }, { onlyOnce: true }); // Read only once
        }
        // Main Sidebar Toggle Functionality
        const sidebar = document.getElementById('sidebar');
        const settingsSidebar = document.getElementById('settingsSidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        const toggleSidebarButton = document.getElementById('dash_div'); // Your menu button
        const closeSidebarButton = document.getElementById('closeSidebar');
        const settingsBtn = document.getElementById('openSettings');
        const closeSettingsSidebar = document.getElementById('closeSettingsSidebar');
        const logoutBtn = document.getElementById('logoutBtn');

        // Open main sidebar
        toggleSidebarButton.addEventListener('click', () => {
            sidebar.classList.remove('translate-x-full');
            sidebarOverlay.classList.remove('hidden');
        });

        // Close main sidebar
        closeSidebarButton.addEventListener('click', closeBothSidebars);

        // Open settings sidebar
        settingsBtn.addEventListener('click', () => {
            settingsSidebar.classList.remove('translate-x-full');
            sidebarOverlay.classList.remove('hidden');
        });

        // Close settings sidebar
        closeSettingsSidebar.addEventListener('click', closeBothSidebars);

        // Click on overlay to close both sidebars
        sidebarOverlay.addEventListener('click', closeBothSidebars);
        // Function to close both sidebars and hide overlay
        function closeBothSidebars() {
            sidebar.classList.add('translate-x-full');
            settingsSidebar.classList.add('translate-x-full');
            sidebarOverlay.classList.add('hidden');
        }
    } else {
        console.log("User is not logged in.");
        sessionStorage.removeItem('profileName'); // Clear on logout
    }
});


document.getElementById("notifyBtn").addEventListener("click", function () {
    alert("You will be notified when NoteTube RED launches!");
});

// Toggle Explore dropdown menu
document.getElementById("exploreBtn").addEventListener("click", function (event) {
    event.preventDefault();
    let dropdown = document.getElementById("dropdownMenu");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
});

// Close dropdown if clicked outside
document.addEventListener("click", function (event) {
    let dropdown = document.getElementById("dropdownMenu");
    let exploreBtn = document.getElementById("exploreBtn");
    if (!exploreBtn.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = "none";
    }
});

// Change navbar background on scroll
window.addEventListener("scroll", function () {
    let navbar = document.getElementById("navbar");
    if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }
});
// Hover effact
const box = document.getElementById("tilt-box");

box.addEventListener("mousemove", (e) => {
    const boxRect = box.getBoundingClientRect();
    const centerX = boxRect.left + boxRect.width / 10;
    const centerY = boxRect.top + boxRect.height / 10;

    // Tilt effect (Increased sensitivity)
    const deltaX = (e.clientX - centerX) / 10;
    const deltaY = (e.clientY - centerY) / 10;
    box.style.transform = `rotateY(${deltaX}deg) rotateX(${-deltaY}deg)`;

    // Dynamic background effect following cursor
    const mouseX = e.clientX - boxRect.left;
    const mouseY = e.clientY - boxRect.top;

    box.style.background = `radial-gradient(circle at ${mouseX}px ${mouseY}px, 
        rgba(0, 255, 150, 0.4), 
        rgba(10, 10, 10, 0.8))`;
});

box.addEventListener("mouseleave", () => {
    // Reset transform
    box.style.transform = "rotateY(0deg) rotateX(0deg)";

    // Reset background to default
    box.style.background = "linear-gradient(145deg, #0f0f0f, #161616)";
});
if (snapshot.exists()) {
    document.getElementById("dp").hidden = false;
    document.getElementById("dash_div").classList.remove("hover:text-blue-500");
    // update name here
}
