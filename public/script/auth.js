// Authentication and Account Management
import { auth, db, openModal, closeModal, initializeModal } from './script.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
            window.location.href = 'home.html';
        } catch (error) {
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
        
        if (confirmPassword && password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            await setDoc(doc(db, "users", userCredential.user.uid), {
                email: email,
                favorites: [],
                createdAt: new Date().toISOString()
            });
            
            window.location.href = 'tutorial.html';
        } catch (error) {
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
    onOpen: () => applyProfile(readProfile()) 
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
    onOpen: () => applyProfile(readProfile())
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
    editAccountForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const current = readProfile();
        const name = (editNameInput?.value || "").trim() || current.name;
        const username = (editUsernameInput?.value || "").trim() || current.username;

        saveProfile({ name, username });
        closeModal(editAccountFormModal);
        openModal(editAccountModal);
    });
}

// ============================== PROFILE HELPERS ==============================

const readProfile = () => {
    const stored = localStorage.getItem("userProfile");
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (parsed && (parsed.name || parsed.username)) {
                return parsed;
            }
        } catch (error) {
            return null;
        }
    }

    return {
        name: editAccountNameValue?.textContent?.trim() || "",
        username: editAccountUsernameValue?.textContent?.trim() || ""
    };
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

const saveProfile = (profile) => {
    localStorage.setItem("userProfile", JSON.stringify(profile));
    applyProfile(profile);
};

// Initialize profile on page load
applyProfile(readProfile());
