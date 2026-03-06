// Authentication handling for login and register pages
import { auth, db } from './script.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// ============================== LOGIN & REGISTRATION ==============================

// Login Form Handler
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Redirect to home page after successful login
            window.location.href = 'home.html';
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
        }
    });
}

// Register Form Handler
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password')?.value;
        
        // Check if passwords match (if confirm field exists)
        if (confirmPassword && password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Create user document in Firestore
            await setDoc(doc(db, "users", userCredential.user.uid), {
                email: email,
                favorites: [],
                createdAt: new Date().toISOString()
            });
            
            // Redirect based on screen size - mobile vs desktop
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                window.location.href = 'tutorial_1.html';
            } else {
                window.location.href = 'tutorial_desktop.html';
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed: ' + error.message);
        }
    });
}

// ============================== ACCOUNT SETTINGS ==============================

// Initialize User Settings Modal
const userSettingsModal = initializeModal("user-settings-modal", {
    openButtonSelector: ".open-user-settings",
    closeButtonSelector: "#close-user-settings"
});

// Initialize Edit Account Modal
const editAccountModal = initializeModal("edit-account-modal", {
    closeButtonSelector: "#close-edit-account",
    onOpen: () => readProfile().then(applyProfile)
});

// Setup Edit Account open buttons
const openEditAccountButtons = document.querySelectorAll(".open-edit-account");
openEditAccountButtons.forEach((button) => {
    button.addEventListener("click", () => {
        closeModal(userSettingsModal);
        openModal(editAccountModal);
    });
});

// Setup back button from edit account to settings
const backEditAccountButton = document.getElementById("back-edit-account");
if (backEditAccountButton) {
    backEditAccountButton.addEventListener("click", () => {
        closeModal(editAccountModal);
        openModal(userSettingsModal);
    });
}

// Initialize Edit Account Form Modal
const editAccountFormModal = initializeModal("edit-account-form-modal", {
    closeButtonSelector: "#close-edit-account-form",
    onOpen: () => readProfile().then(applyProfile)
});

// Setup form open button
const openEditAccountFormButton = document.getElementById("open-edit-account-form");
if (openEditAccountFormButton) {
    openEditAccountFormButton.addEventListener("click", () => {
        closeModal(editAccountModal);
        openModal(editAccountFormModal);
    });
}

// Setup cancel/back buttons on form
const cancelEditAccountFormButton = document.getElementById("cancel-edit-account-form");
const backEditAccountFormButton = document.getElementById("back-edit-account-form");

if (cancelEditAccountFormButton) {
    cancelEditAccountFormButton.addEventListener("click", () => {
        closeModal(editAccountFormModal);
        openModal(editAccountModal);
    });
}

if (backEditAccountFormButton) {
    backEditAccountFormButton.addEventListener("click", () => {
        closeModal(editAccountFormModal);
        openModal(editAccountModal);
    });
}

// Setup delete account button
const deleteAccountButton = document.getElementById("delete-account");
if (deleteAccountButton) {
    deleteAccountButton.addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

// Get form and input references
const userSettingsTitle = document.getElementById("user-settings-title");
const editAccountNameValue = document.getElementById("edit-account-name");
const editAccountUsernameValue = document.getElementById("edit-account-username");
const editAccountForm = document.getElementById("edit-account-form");
const editNameInput = document.getElementById("edit-name");
const editUsernameInput = document.getElementById("edit-username");

// Setup form submission
if (editAccountForm) {
    editAccountForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const current = await readProfile();
        const name = (editNameInput?.value || "").trim() || current.name;
        const username = (editUsernameInput?.value || "").trim() || current.username;

        await saveProfile({ name, username });
        closeModal(editAccountFormModal);
        openModal(editAccountModal);
    });
}

// ============================== PROFILE HELPERS ==============================

const readProfile = async () => {
    const user = auth.currentUser;
    if (!user) return { name: "", username: "" };

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            return {
                name: data.name || "",
                username: data.username || ""
            };
        }
    } catch (error) {
        console.error("Error reading profile:", error);
    }

    return { name: "", username: "" };
};

const applyProfile = (profile) => {
    if (!profile) return;
    if (editAccountNameValue) editAccountNameValue.textContent = profile.name;
    if (editAccountUsernameValue) editAccountUsernameValue.textContent = profile.username;
    if (userSettingsTitle) {
        userSettingsTitle.textContent = profile.name?.trim() ? profile.name : profile.username;
    }
    if (editNameInput) editNameInput.value = profile.name;
    if (editUsernameInput) editUsernameInput.value = profile.username;
};

const saveProfile = async (profile) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await updateDoc(doc(db, "users", user.uid), {
            name: profile.name,
            username: profile.username
        });
        applyProfile(profile);
    } catch (error) {
        console.error("Error saving profile:", error);
        alert("Failed to save profile: " + error.message);
    }
};

// Initialize profile on page load
readProfile().then(applyProfile);
