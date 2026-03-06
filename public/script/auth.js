// Authentication and Account Management
import { auth, db, openModal, closeModal, initializeModal } from './script.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
        
        const username = document.getElementById('username').value;
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
                username: username,
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
    deleteAccountButton.addEventListener("click", async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("No signed-in user found.");
            return;
        }

        const confirmed = window.confirm("Are you sure you want to permanently delete your account?");
        if (!confirmed) return;

        try {
            // Delete all event docs in the user's events subcollection
            const eventsRef = collection(db, "users", user.uid, "events");
            const eventsSnap = await getDocs(eventsRef);

            for (const eventDoc of eventsSnap.docs) {
                await deleteDoc(doc(db, "users", user.uid, "events", eventDoc.id));
            }

            // Delete the main user document
            await deleteDoc(doc(db, "users", user.uid));

            // Delete the Firebase Auth account
            await deleteUser(user);

            // Clear any local leftovers just in case
            localStorage.removeItem("userProfile");

            window.location.href = "index.html";
        } catch (error) {
            console.error("Error deleting account:", error);

            if (error.code === "auth/requires-recent-login") {
                alert("For security, please log out, log back in, and then try deleting your account again.");
                return;
            }

            alert("Failed to delete account: " + error.message);
        }
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
