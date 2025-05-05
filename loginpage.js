// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged,
    setPersistence,
    browserSessionPersistence,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    set,
    get,
    child,
    onValue
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBrBuYJYzdkVNTxVrOul-O1m5V_oLQxotw",
    authDomain: "my-shop-3f13c.firebaseapp.com",
    databaseURL: "https://my-shop-3f13c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "my-shop-3f13c",
    storageBucket: "my-shop-3f13c.firebasestorage.app",
    messagingSenderId: "291411857178",
    appId: "1:291411857178:web:33242ecb444506cbd6e6a3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase();
const db_f = getFirestore(app);

// Set persistence to browser session
setPersistence(auth, browserSessionPersistence)
    .catch((error) => {
        console.error("Error setting persistence:", error.code, error.message);
    });

document.addEventListener("DOMContentLoaded", function () {
    // DOM elements
    const formTitle = document.getElementById('form-title');
    const authForm = document.getElementById('authForm');
    const emailInput = document.getElementById('mail');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const passwordStrength = document.getElementById('password-strength');
    const submitButton = document.getElementById('submit');
    const toggleFormLink = document.getElementById('toggle-form');
    const haveAccText = document.getElementById('have_acc');
    const forgotPasswordLink = document.getElementById('forgot-password');

    // Toggle password visibility buttons
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

    // Check if all required elements exist
    if (!authForm || !emailInput || !passwordInput || !errorMessage || !formTitle || !submitButton) {
        console.warn("Some required elements are missing in the DOM.");
        return;
    }

    // Form state variables
    let isLoginForm = true;
    let isResetPassword = false;

    // Check for logged in user and redirect if needed
    onAuthStateChanged(auth, (user) => {
        if (user && window.location.pathname.includes('index.html')) {
            // User is signed in, redirect to dashboard
            window.location.href = "Dashboard.html";
        }
    });

    // Toggle between login and signup forms
    window.toggleForm = function () {
        isLoginForm = !isLoginForm;
        isResetPassword = false;

        // Update form title and button text
        formTitle.innerHTML = isLoginForm ? '<b>Login</b>' : '<b>Sign Up</b>';
        submitButton.innerHTML = `<b>${isLoginForm ? 'Login' : 'Sign Up'}</b>`;

        // Toggle password field visibility
        const confirmPasswordContainer = document.getElementById('confirm-password-container');
        if (confirmPasswordContainer) {
            confirmPasswordContainer.style.display = isLoginForm ? 'none' : 'block';
        }

        // Handle name field for signup
        if (!isLoginForm) {
            // Add name field if it doesn't exist
            if (!document.getElementById('name')) {
                const nameContainer = document.createElement('div');
                nameContainer.className = 'input-container';
                nameContainer.id = 'name-container';

                const nameIcon = document.createElement('i');
                nameIcon.className = 'fas fa-user input-icon';

                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.id = 'name';
                nameInput.placeholder = 'Full Name';
                nameInput.required = true;

                nameContainer.appendChild(nameIcon);
                nameContainer.appendChild(nameInput);

                // Insert at the beginning of the form
                const firstInput = authForm.querySelector('.input-container');
                authForm.insertBefore(nameContainer, firstInput);
            }

            // Hide forgot password link
            document.getElementById('forgot-password-text').style.display = 'none';
        } else {
            // Remove name field if it exists
            const nameContainer = document.getElementById('name-container');
            if (nameContainer) {
                nameContainer.remove();
            }

            // Show forgot password link
            document.getElementById('forgot-password-text').style.display = 'block';
        }

        // Update toggle text
        haveAccText.innerHTML = isLoginForm
            ? 'Don\'t have an account? <span id="toggle-form" class="action-link">Sign Up</span>'
            : 'Already have an account? <span id="toggle-form" class="action-link">Login</span>';

        // Clear form fields and errors
        authForm.reset();
        errorMessage.textContent = '';
        if (passwordStrength) passwordStrength.textContent = '';

        // Re-attach event listener to the new toggle link
        document.getElementById('toggle-form').addEventListener('click', toggleForm);
    };

    // Handle forgot password
    window.reset_pass = function () {
        isResetPassword = !isResetPassword;

        if (isResetPassword) {
            // Switch to reset password mode
            formTitle.innerHTML = '<b>Reset Password</b>';

            // Hide password field
            const passwordContainer = document.querySelector('.password-container');
            if (passwordContainer) {
                passwordContainer.style.display = 'none';
            }

            // Hide confirm password field if visible
            const confirmPasswordContainer = document.getElementById('confirm-password-container');
            if (confirmPasswordContainer) {
                confirmPasswordContainer.style.display = 'none';
            }

            // Update button and toggle text
            submitButton.innerHTML = '<b>Reset Password</b>';
            haveAccText.innerHTML = 'Remembered my password? <span id="forgot-password" class="action-link">Login</span>';

            // Hide the forgot password text
            document.getElementById('forgot-password-text').style.display = 'none';

            // Add event listener to the new login link
            document.getElementById('forgot-password').addEventListener('click', reset_pass);

            // Focus on email field
            emailInput.focus();
        } else {
            // Switch back to login mode
            formTitle.innerHTML = '<b>Login</b>';

            // Show password field
            const passwordContainer = document.querySelector('.password-container');
            if (passwordContainer) {
                passwordContainer.style.display = 'flex';
            }

            // Update button and toggle text
            submitButton.innerHTML = '<b>Login</b>';
            haveAccText.innerHTML = 'Don\'t have an account? <span id="toggle-form" class="action-link">Sign Up</span>';

            // Show the forgot password text
            document.getElementById('forgot-password-text').style.display = 'block';

            // Re-attach event listener to the toggle link
            document.getElementById('toggle-form').addEventListener('click', toggleForm);
        }

        // Clear form fields and errors
        errorMessage.textContent = '';
        if (passwordStrength) passwordStrength.textContent = '';
    };

    // Toggle password visibility
    function togglePasswordVisibility(inputField, toggleButton) {
        const type = inputField.type === 'password' ? 'text' : 'password';
        inputField.type = type;

        // Update icon
        if (toggleButton.querySelector('i')) {
            const icon = toggleButton.querySelector('i');
            icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        } else {
            // Fallback to emoji if no icon element
            toggleButton.textContent = type === 'password' ? '👁️' : '🙈';
        }
    }

    // Handle login with Firebase
    async function handleLogin(email, password) {
        try {
            showLoader();
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            errorMessage.textContent = 'Login successful!';
            errorMessage.style.color = '#4caf50';

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        } catch (error) {
            hideLoader();
            console.error("Login failed:", error.code, error.message);

            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage.textContent = 'No user found with this email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage.textContent = 'Incorrect password.';
                    break;
                case 'auth/invalid-credential':
                    errorMessage.textContent = 'Invalid username or password.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage.textContent = 'Too many failed login attempts. Please try again later.';
                    break;
                default:
                    errorMessage.textContent = 'Login failed. Please try again.';
            }
        }
    }
    // Check password strength
    function checkPasswordStrength(password) {
        if (!passwordStrength || isLoginForm) return;

        // Reset strength indicator
        passwordStrength.textContent = '';
        passwordStrength.style.color = '';

        if (!password) return;

        const length = password.length;
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);

        const strength = [
            length >= 8,
            hasLower,
            hasUpper,
            hasNumber,
            hasSpecial
        ].filter(Boolean).length;

        let strengthText = '';
        let strengthColor = '';

        switch (strength) {
            case 0:
            case 1:
                strengthText = 'Very Weak';
                strengthColor = '#ff4444';
                break;
            case 2:
                strengthText = 'Weak';
                strengthColor = '#ffbb33';
                break;
            case 3:
                strengthText = 'Moderate';
                strengthColor = '#ffbb33';
                break;
            case 4:
                strengthText = 'Strong';
                strengthColor = '#00C851';
                break;
            case 5:
                strengthText = 'Very Strong';
                strengthColor = '#007E33';
                break;
        }

        passwordStrength.textContent = `Password strength: ${strengthText}`;
        passwordStrength.style.color = strengthColor;
    }

    // Handle signup with Firebase
    async function handleSignUp(email, password, name) {
        try {
            showLoader();

            // Validate password strength
            const length = password.length;
            const hasLower = /[a-z]/.test(password);
            const hasUpper = /[A-Z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            const hasSpecial = /[^A-Za-z0-9]/.test(password);

            if (length < 8) {
                throw { code: 'auth/weak-password', message: 'Password should be at least 8 characters' };
            }

            if (!(hasLower && hasUpper && hasNumber)) {
                throw {
                    code: 'auth/weak-password',
                    message: 'Password should contain lowercase, uppercase letters, and numbers'
                };
            }

            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Set display name
            await updateProfile(user, { displayName: name });

            // Store user data in Firebase Realtime Database and Firestore
            await writeUserData(user.uid, name, email);

            errorMessage.textContent = 'Account created successfully!';
            errorMessage.style.color = '#4caf50';

            // Switch to login form
            setTimeout(() => {
                isLoginForm = true;
                toggleForm();
                hideLoader();
            }, 1500);

        } catch (error) {
            hideLoader();
            console.error("Signup failed:", error.code, error.message);

            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage.textContent = 'Email already in use.';
                    break;
                case 'auth/weak-password':
                    errorMessage.textContent = error.message || 'Password is too weak.';
                    break;
                case 'auth/invalid-email':
                    errorMessage.textContent = 'Invalid email address.';
                    break;
                default:
                    errorMessage.textContent = 'Signup failed. Please try again.';
            }
        }
    }

    // Reset password with Firebase
    async function resetPassword(email) {
        if (!email) {
            errorMessage.textContent = 'Please enter your email address.';
            return;
        }

        try {
            showLoader();
            await sendPasswordResetEmail(auth, email);

            errorMessage.textContent = 'Password reset email sent! Check your inbox.';
            errorMessage.style.color = '#4caf50';

            setTimeout(() => {
                hideLoader();
                isResetPassword = false;
                reset_pass();
            }, 3000);

        } catch (error) {
            hideLoader();
            console.error("Password reset failed:", error.code, error.message);

            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage.textContent = 'No account found with this email.';
                    break;
                case 'auth/invalid-email':
                    errorMessage.textContent = 'Invalid email address.';
                    break;
                default:
                    errorMessage.textContent = 'Failed to send reset email. Please try again.';
            }
        }
    }

    // Show loading indicator
    function showLoader() {
        // Create loader if it doesn't exist
        if (!document.getElementById('loader')) {
            const loader = document.createElement('div');
            loader.id = 'loader';
            loader.className = 'loader';
            loader.style.display = 'inline-block';
            loader.style.border = '3px solid #f3f3f3';
            loader.style.borderTop = '3px solid #3498db';
            loader.style.borderRadius = '50%';
            loader.style.width = '20px';
            loader.style.height = '20px';
            loader.style.animation = 'spin 1s linear infinite';
            loader.style.marginLeft = '10px';

            // Add animation style
            if (!document.getElementById('loader-style')) {
                const style = document.createElement('style');
                style.id = 'loader-style';
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }

            // Append loader next to submit button
            submitButton.appendChild(loader);
        } else {
            document.getElementById('loader').style.display = 'inline-block';
        }

        // Disable form elements during loading
        Array.from(authForm.elements).forEach(element => {
            if (element.type !== 'submit') {
                element.disabled = true;
            }
        });
    }

    // Hide loading indicator
    function hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'none';
        }

        // Re-enable form elements
        Array.from(authForm.elements).forEach(element => {
            element.disabled = false;
        });
    }

    // Form submission handler
    authForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Basic validation
        if (!email) {
            errorMessage.textContent = 'Please enter your email address.';
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorMessage.textContent = 'Please enter a valid email address.';
            emailInput.focus();
            return;
        }

        // Handle different form states
        if (isResetPassword) {
            // Handle password reset
            resetPassword(email);
        } else if (isLoginForm) {
            // Handle login
            if (!password) {
                errorMessage.textContent = 'Please enter your password.';
                return;
            }
            handleLogin(email, password);
        } else {
            // Handle signup
            if (!password) {
                errorMessage.textContent = 'Please enter a password.';
                return;
            }

            const name = document.getElementById('name').value.trim();
            if (!name) {
                errorMessage.textContent = 'Please enter your name.';
                return;
            }

            const confirmPasswordInput = document.getElementById('confirm-password');
            if (confirmPasswordInput) {
                const confirmPassword = confirmPasswordInput.value;
                if (password !== confirmPassword) {
                    errorMessage.textContent = 'Passwords do not match.';
                    return;
                }
            }

            handleSignUp(email, password, name);
        }
    });

    // Event listener for toggle password
    if (togglePassword) {
        togglePassword.addEventListener('click', function () {
            togglePasswordVisibility(passwordInput, togglePassword);
        });
    }

    // Event listener for toggle confirm password
    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', function () {
            const confirmPasswordInput = document.getElementById('confirm-password');
            if (confirmPasswordInput) {
                togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword);
            }
        });
    }

    // Event listener for password strength check
    if (passwordInput && passwordStrength) {
        passwordInput.addEventListener('input', function () {
            checkPasswordStrength(this.value);
        });
    }

    // Event listener for toggle form
    if (toggleFormLink) {
        toggleFormLink.addEventListener('click', toggleForm);
    }

    // Event listener for forgot password
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', reset_pass);
    }
});

// Setup logout button if it exists
function bindLogoutEvent() {
    const logoutButton = document.getElementById('logoutBtn');
    if (logoutButton) {
        logoutButton.addEventListener('click', function (event) {
            event.preventDefault();
            console.log("Logout button clicked");

            signOut(auth)
                .then(() => {
                    console.log("User signed out successfully.");
                    window.location.href = "login_signup.html"; // Redirect after logout
                })
                .catch((error) => {
                    console.error("Error signing out:", error);
                });
        });
    }
}

// Bind logout when sidebar is opened
const settingsBtn = document.querySelector('#openSettings');
const settingsSidebar = document.querySelector('#settingsSidebar');
const sidebarOverlay = document.querySelector('#sidebarOverlay');

if (settingsBtn && settingsSidebar && sidebarOverlay) {
    settingsBtn.addEventListener('click', () => {
        try {
            settingsSidebar.classList.remove('translate-x-full');
            sidebarOverlay.classList.remove('hidden');

            // Bind logout after sidebar is shown
            bindLogoutEvent();
        } catch (error) {
            console.error("Error while opening settings sidebar:", error);
        }
    });
} else {
    console.warn("Settings button or sidebar not found in the DOM.");
}


// Write user data to Firebase Realtime Database and Firestore
async function writeUserData(userId, name, email) {
    try {
        const db = getDatabase();
        // Write to Realtime Database
        await set(ref(db, 'users/' + userId), {
            name,
            email
        });

        // Write to Firestore
        await setDoc(doc(db_f, "users", userId), {
            name: name,
            mail: email,
        });

        console.log("User data written successfully!");
        return true;
    } catch (error) {
        console.error("Error writing user data:", error);
        return false;
    }
}

// Read user data from Firestore
async function readUserData(userId) {
    try {
        const userDoc = await getDoc(doc(db_f, "users", userId));
        if (userDoc.exists()) {
            console.log("User Data:", userDoc.data());
            return userDoc.data();
        } else {
            console.log("No user found with the given ID.");
            return null;
        }
    } catch (error) {
        console.error("Error reading user data:", error);
        return null;
    }
}