// Firebase imports and setup
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { app } from '../firebase.js';

export const db = getFirestore(app);
export const auth = getAuth(app);
export let currentUser = null;

// Export a function to get current user
export const getCurrentUser = () => currentUser;

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (!user) {
        // Redirect to login if on protected pages
        const protectedPaths = ['/c1_home.html', '/c2_randomize.html', '/c3_explore.html', '/c4_calendar.html'];
        if (protectedPaths.includes(window.location.pathname)) {
            window.location.href = 'a2_login.html';
        }
    }
});

// Fetch all date ideas from Firestore
export async function getAllIdeas() {
    try {
        const activitiesRef = collection(db, "activities");
        const snapshot = await getDocs(activitiesRef);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title || doc.data().activity_name,
            description: doc.data().description || "",
            category: doc.data().category || "",
            image: doc.data().image || doc.data().images?.[0] || "",
            dollars: doc.data().dollars || doc.data().average_cost || 0,
            tags: doc.data().tags || []
        }));
    } catch (error) {
        return [];
    }
}

// Modals ----------------------------------------------------------------------------------------------

export const openModal = (modal) => {
    if (!modal) return;
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
};

export const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
};

export const closeOnOverlayClick = (modal) => {
    // Disabled - modals only close via X button now
    // Keeping function so existing calls don't break
};

// MODULAR MODAL SETUP
// This function sets up all modal functionality in one place
export const initializeModal = (modalId, options = {}) => {
    const modal = document.getElementById(modalId);
    if (!modal) return null;

    const {
        openButtonSelector,      // CSS selector for button(s) that open modal
        closeButtonSelector,     // CSS selector for X close button
        onOpen = null,          // Function to run when modal opens
        onClose = null          // Function to run when modal closes
    } = options;

    // Setup open button(s) - can have multiple buttons opening same modal
    if (openButtonSelector) {
        const openButtons = document.querySelectorAll(openButtonSelector);
        openButtons.forEach(button => {
            button.addEventListener("click", async () => {
                openModal(modal);
                if (onOpen) await onOpen(modal);
            });
        });
    }

    // Setup close button (the X icon)
    if (closeButtonSelector) {
        const closeButton = document.querySelector(closeButtonSelector);
        if (closeButton) {
            closeButton.addEventListener("click", () => {
                closeModal(modal);
                if (onClose) onClose(modal);
            });
        }
    }

    // Overlay clicks do NOT close modals - removed that functionality entirely

    return modal;
};

// Utilities ----------------------------------------------------------------------------------------------

// Creates dollar sign icons based on price level (1, 2, or 3)
export function renderDollarSigns(count) {
    let dollarHTML = "";
    for (let i = 0; i < count; i++) {
        dollarHTML += `<img src="images/Dollar.svg" alt="$">`;
    }
    return dollarHTML;
}

// Liked Ideas Management ----------------------------------------------------------------------------------------------

// Gets the list of liked idea IDs from Firebase
export async function getLikedIdeas() {
    if (!currentUser) return [];
    
    try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().favorites) {
            return userSnap.data().favorites;
        }
    } catch (error) {
        // Silent error handling
    }
    return [];
}

// Saves the liked IDs array to Firebase only
export async function saveLikedIdeas(likedIds) {
    if (!currentUser) return;
    
    try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        // If user document doesn't exist, create it
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                email: currentUser.email,
                favorites: likedIds,
                createdAt: new Date().toISOString()
            });
        } else {
            // Otherwise just update favorites
            await updateDoc(userRef, {
                favorites: likedIds
            });
        }
    } catch (error) {
        // Silent error handling
    }
}

// Checks if an idea is liked by the user
export async function isIdeaLiked(ideaId) {
    const likedIds = await getLikedIdeas();
    return likedIds.includes(ideaId);
}

// Toggles a like on/off for an idea
export async function toggleLike(ideaId) {
    const likedIds = await getLikedIdeas();
    
    if (likedIds.includes(ideaId)) {
        // Remove from liked array
        const newLikedIds = likedIds.filter(id => id !== ideaId);
        await saveLikedIdeas(newLikedIds);
        return false; // Now unliked
    } else {
        // Add to liked array
        likedIds.push(ideaId);
        await saveLikedIdeas(likedIds);
        return true; // Now liked
    }
}

// Card Template ----------------------------------------------------------------
// Creates the HTML for a single idea card
export async function createIdeaCardHTML(idea) {
    // Use the ID from the idea object
    const ideaId = idea.id;
    
    // Build the dollar signs HTML if there's a price
    const priceHTML = idea.dollars > 0 
        ? `<div class="price-level">${renderDollarSigns(idea.dollars)}</div>`
        : "";
    
    // Determine which heart icon to show (filled if liked, empty if not)
    const isLiked = await isIdeaLiked(ideaId);
    const heartSrc = isLiked ? "images/HeartFilled.svg" : "images/Heart.svg";
    const heartClass = isLiked ? "heart-icon is-active" : "heart-icon";
    
    // Build the complete card HTML
    return `
        <div class="card idea-card">
            <img src="${idea.image}" alt="${idea.title}" class="hero">
            <div class="card-body">
                <div class="top-half">
                    <section class="top3rd">
                        <h3>${idea.title}</h3>
                        ${priceHTML}
                    </section>
                    <p>${idea.description}</p>
                </div>
                <section class="bottom3rd">
                    <span class="tag">${idea.category}</span>
                    <img 
                        src="${heartSrc}" 
                        alt="Heart Icon" 
                        class="${heartClass}"
                        data-idea-id="${ideaId}">
                </section>
            </div>
        </div>
    `;
}

// Favorites  ----------------------------------------------------------------

// Function to render favorites list in modal
async function renderFavoritesList() {
    const favoritesList = document.getElementById("favorites-list");
    if (!favoritesList) return;

    // Get liked idea IDs
    const likedIds = await getLikedIdeas();
    
    if (likedIds.length === 0) {
        favoritesList.innerHTML = '<p style="text-align: center; color: var(--gray-50); padding: var(--large-spacing);">No favorites yet! Start liking ideas to see them here.</p>';
        return;
    }

    // Get all ideas
    const allIdeas = await getAllIdeas();
    
    // Filter to only liked ideas
    const likedIdeas = allIdeas.filter(idea => likedIds.includes(idea.id));
    
    // Render each favorite card
    const cardsHTML = await Promise.all(
        likedIdeas.map(idea => createIdeaCardHTML(idea))
    );
    
    favoritesList.innerHTML = cardsHTML.join('');
}

initializeModal("favorites-modal", {
    openButtonSelector: "#open-favorites, .open-favorites",  
    closeButtonSelector: "#close-favorites",                  
    closeOnOverlay: false,                                    
    onOpen: async () => await renderFavoritesList()          
});


// Interactive Buttons (Tags & Hearts) --------------------------------------------------------------

// Toggle active state for heart icons
const toggleActive = async (element) => {
    // Only handle heart icons
    if (!element.classList.contains("heart-icon")) return;

    element.classList.toggle("is-active");

    const ideaId = element.getAttribute("data-idea-id");
    if (!ideaId) return;

    // Toggle the like status
    const nowLiked = await toggleLike(ideaId);
    
    // Update the heart icon image
    if (nowLiked) {
        element.src = "images/HeartFilled.svg";
    } else {
        element.src = "images/Heart.svg";
    }
};

// Event listeners for interactive buttons (only heart icons)
document.addEventListener("click", (event) => {
    const target = event.target.closest(".heart-icon");
    if (target) {
        toggleActive(target);
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
        return;
    }

    const activeElement = document.activeElement;
    if (activeElement && activeElement.matches(".heart-icon")) {
        event.preventDefault();
        toggleActive(activeElement);
    }
});

// Account Management  ---------------------------------------------------------------------------------
// Initialize User Settings Modal - main settings panel
const userSettingsModal = initializeModal("user-settings-modal", {
    openButtonSelector: ".open-user-settings", 
    closeButtonSelector: "#close-user-settings"
});

// Initialize Edit Account Modal - shows current account info
const editAccountModal = initializeModal("edit-account-modal", {
    closeButtonSelector: "#close-edit-account",
    onOpen: () => applyProfile(readProfile()) 
});

// Setup Edit Account open button - needs to close settings first
const openEditAccountButtons = document.querySelectorAll(".open-edit-account");
openEditAccountButtons.forEach((button) => {
    button.addEventListener("click", () => {
        closeModal(userSettingsModal.element);
        openModal(editAccountModal.element);
    });
});

// Setup back button - return to settings from edit account
const backEditAccountButton = document.getElementById("back-edit-account");
if (backEditAccountButton) {
    backEditAccountButton.addEventListener("click", () => {
        closeModal(editAccountModal.element);
        openModal(userSettingsModal.element);
    });
}

// Initialize Edit Account Form Modal - actual form to edit
const editAccountFormModal = initializeModal("edit-account-form-modal", {
    closeButtonSelector: "#close-edit-account-form",
    onOpen: () => applyProfile(readProfile())
});

// Setup form open button - goes from view to edit
const openEditAccountFormButton = document.getElementById("open-edit-account-form");
if (openEditAccountFormButton) {
    openEditAccountFormButton.addEventListener("click", () => {
        closeModal(editAccountModal.element);
        openModal(editAccountFormModal.element);
    });
}

// Setup cancel/back buttons on form - return to view mode
const cancelEditAccountFormButton = document.getElementById("cancel-edit-account-form");
const backEditAccountFormButton = document.getElementById("back-edit-account-form");

if (cancelEditAccountFormButton) {
    cancelEditAccountFormButton.addEventListener("click", () => {
        closeModal(editAccountFormModal.element);
        openModal(editAccountModal.element);
    });
}

if (backEditAccountFormButton) {
    backEditAccountFormButton.addEventListener("click", () => {
        closeModal(editAccountFormModal.element);
        openModal(editAccountModal.element);
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
const editAccountUsernameValue = document.getElementById(
    "edit-account-username"
);
const editAccountForm = document.getElementById("edit-account-form");
const editNameInput = document.getElementById("edit-name");
const editUsernameInput = document.getElementById("edit-username");

// Setup form submission - save changes and return to view mode
if (editAccountForm) {
    editAccountForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const current = readProfile();
        const name = (editNameInput?.value || "").trim() || current.name;
        const username =
            (editUsernameInput?.value || "").trim() || current.username;

        saveProfile({ name, username });
        closeModal(editAccountFormModal.element);
        openModal(editAccountModal.element);
    });
}

// Profile helper functions - manage user profile data
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
    if (editAccountUsernameValue) {
        editAccountUsernameValue.textContent = profile.username;
    }
    if (userSettingsTitle) {
    userSettingsTitle.textContent = profile.name?.trim() 
        ? profile.name 
        : profile.username;
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