// Authentication and Account Management
import { auth, db, openModal, closeModal, initializeModal, closeOnOverlayClick } from './script.js';
import { deleteUser, signOut, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Account settings ---------------------------------------------------------------

// Initialize User Settings Modal
const userSettingsModal = initializeModal("user-settings-modal", {
    openButtonSelector: ".open-user-settings",
    closeButtonSelector: "#close-user-settings",
    onOpen: () => readProfile().then(applyProfile)
});

closeOnOverlayClick(userSettingsModal);

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


// Delete Account Confirmation Modal
const deleteAccountConfirmModal = initializeModal("delete-account-confirm-modal", {
    closeButtonSelector: "#close-delete-account-confirm"
});
const deleteAccountConfirmModalEl = document.getElementById("delete-account-confirm-modal");
const cancelDeleteAccountConfirmButton = document.getElementById("cancel-delete-account-confirm");
const confirmDeleteAccountButton = document.getElementById("confirm-delete-account");

// Setup delete account button — opens confirmation modal
const deleteAccountButton = document.getElementById("delete-account");
if (deleteAccountButton) {
    deleteAccountButton.addEventListener("click", () => {
        const user = auth.currentUser;
        if (!user) {
            alert("No signed-in user found.");
            return;
        }
        openModal(deleteAccountConfirmModalEl);
    });
}

if (cancelDeleteAccountConfirmButton) {
    cancelDeleteAccountConfirmButton.addEventListener("click", () => {
        closeModal(deleteAccountConfirmModalEl);
    });
}

if (confirmDeleteAccountButton) {
    confirmDeleteAccountButton.addEventListener("click", async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const eventsRef = collection(db, "users", user.uid, "events");
            const eventsSnap = await getDocs(eventsRef);

            for (const eventDoc of eventsSnap.docs) {
                await deleteDoc(doc(db, "users", user.uid, "events", eventDoc.id));
            }

            await deleteDoc(doc(db, "users", user.uid));
            await deleteUser(user);

            window.location.href = "index.html";
        } catch (error) {
            closeModal(deleteAccountConfirmModalEl);
            if (error.code === "auth/requires-recent-login") {
                alert("For security, please log out, log back in, and then try deleting your account again.");
                return;
            }
            alert("Failed to delete account: " + error.message);
        }
    });
}


// Save Account Confirmation Modal
const saveAccountConfirmModal = initializeModal("save-account-confirm-modal", {
    closeButtonSelector: "#close-save-account-confirm"
});
const saveAccountConfirmModalEl = document.getElementById("save-account-confirm-modal");
const cancelSaveAccountConfirmButton = document.getElementById("cancel-save-account-confirm");
const confirmSaveAccountButton = document.getElementById("confirm-save-account");

// Get form and input references
const userSettingsTitle = document.getElementById("user-settings-title");
const editAccountUsernameValue = document.getElementById("edit-account-username");
const editAccountForm = document.getElementById("edit-account-form");
const editUsernameInput = document.getElementById("edit-username");

// Setup form submission — show confirmation first
if (editAccountForm) {
    editAccountForm.addEventListener("submit", (event) => {
        event.preventDefault();
        openModal(saveAccountConfirmModalEl);
    });
}

if (cancelSaveAccountConfirmButton) {
    cancelSaveAccountConfirmButton.addEventListener("click", () => {
        closeModal(saveAccountConfirmModalEl);
    });
}

if (confirmSaveAccountButton) {
    confirmSaveAccountButton.addEventListener("click", async () => {
        const current = await readProfile();
        const username = (editUsernameInput?.value || "").trim() || current.username;

        await saveProfile({ username });
        closeModal(saveAccountConfirmModalEl);
        closeModal(editAccountFormModal);
        openModal(editAccountModal);
    });
}


// Profile Helpers -----------------------------------------------------------

const readProfile = async () => {
    const user = auth.currentUser;
    if (!user) return { username: "" };

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            return {
                username: data.username || ""
            };
        }
    } catch (error) {
        // Error reading profile
    }

    return { username: "" };
};

const applyProfile = (profile) => {
    if (!profile) return;
    if (editAccountUsernameValue) editAccountUsernameValue.textContent = profile.username;
    if (userSettingsTitle) userSettingsTitle.textContent = profile.username;
    if (editUsernameInput) editUsernameInput.value = profile.username;
};

const saveProfile = async (profile) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await updateDoc(doc(db, "users", user.uid), {
            username: profile.username
        });
        applyProfile(profile);
    } catch (error) {
        alert("Failed to save profile: " + error.message);
    }
};

// Initialize profile on page load when auth is ready
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const profile = await readProfile();
        applyProfile(profile);
    }
});

// Logout Confirmation Modal
const logoutConfirmModal = initializeModal("logout-confirm-modal", {
    closeButtonSelector: "#close-logout-confirm"
});
const logoutConfirmModalEl = document.getElementById("logout-confirm-modal");
const cancelLogoutConfirmButton = document.getElementById("cancel-logout-confirm");
const confirmLogoutButton = document.getElementById("confirm-logout");

const logoutButton = document.getElementById("logout-button");
if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        openModal(logoutConfirmModalEl);
    });
}

if (cancelLogoutConfirmButton) {
    cancelLogoutConfirmButton.addEventListener("click", () => {
        closeModal(logoutConfirmModalEl);
    });
}

if (confirmLogoutButton) {
    confirmLogoutButton.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "login.html";
        } catch (error) {
            alert("Failed to log out: " + error.message);
        }
    });
}