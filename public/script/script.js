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
        console.error("Error fetching ideas from Firestore:", error);
        return [];
    }
}

// Modals ----------------------------------------------------------------------------------------------

export const openModal = (modal) => {
    if (!modal) return;
    modal.classList.add("is-open");
};

export const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove("is-open");
};

export const closeOnOverlayClick = (modal) => {
    if (!modal) return;
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
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
        console.error("Error loading favorites from Firebase:", error);
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
        console.error("Error saving favorites to Firebase:", error);
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

const favoritesModal = document.getElementById("favorites-modal");
const openFavoritesButtons = document.querySelectorAll(
    "#open-favorites, .open-favorites"
);
const closeFavoritesButton = document.getElementById("close-favorites");

if (openFavoritesButtons.length) {
    openFavoritesButtons.forEach((button) => {
        button.addEventListener("click", async () => {
            openModal(favoritesModal);
            await renderFavoritesList();
        });
    });
}

if (closeFavoritesButton) {
    closeFavoritesButton.addEventListener("click", () =>
        closeModal(favoritesModal)
    );
}

closeOnOverlayClick(favoritesModal);


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
const userSettingsModal = document.getElementById("user-settings-modal");
const openUserSettingsButtons = document.querySelectorAll(".open-user-settings");
const closeUserSettingsButton = document.getElementById("close-user-settings");
const openEditAccountButtons = document.querySelectorAll(".open-edit-account");
const editAccountModal = document.getElementById("edit-account-modal");
const closeEditAccountButton = document.getElementById("close-edit-account");
const backEditAccountButton = document.getElementById("back-edit-account");
const openEditAccountFormButton = document.getElementById(
    "open-edit-account-form"
);
const editAccountFormModal = document.getElementById("edit-account-form-modal");
const closeEditAccountFormButton = document.getElementById(
    "close-edit-account-form"
);
const cancelEditAccountFormButton = document.getElementById(
    "cancel-edit-account-form"
);
const backEditAccountFormButton = document.getElementById(
    "back-edit-account-form"
);
const deleteAccountButton = document.getElementById("delete-account");
const userSettingsTitle = document.getElementById("user-settings-title");
const editAccountNameValue = document.getElementById("edit-account-name");
const editAccountUsernameValue = document.getElementById(
    "edit-account-username"
);
const editAccountForm = document.getElementById("edit-account-form");
const editNameInput = document.getElementById("edit-name");
const editUsernameInput = document.getElementById("edit-username");

if (openUserSettingsButtons.length) {
    openUserSettingsButtons.forEach((button) => {
        button.addEventListener("click", () => openModal(userSettingsModal));
    });
}

if (closeUserSettingsButton) {
    closeUserSettingsButton.addEventListener("click", () =>
        closeModal(userSettingsModal)
    );
}

closeOnOverlayClick(userSettingsModal);

// Edit Account Modal
if (openEditAccountButtons.length) {
    openEditAccountButtons.forEach((button) => {
        button.addEventListener("click", () => {
            applyProfile(readProfile());
            closeModal(userSettingsModal);
            openModal(editAccountModal);
        });
    });
}

if (closeEditAccountButton) {
    closeEditAccountButton.addEventListener("click", () =>
        closeModal(editAccountModal)
    );
}

if (backEditAccountButton) {
    backEditAccountButton.addEventListener("click", () => {
        closeModal(editAccountModal);
        openModal(userSettingsModal);
    });
}

closeOnOverlayClick(editAccountModal);

// Edit Account Form Modal
if (openEditAccountFormButton) {
    openEditAccountFormButton.addEventListener("click", () => {
        applyProfile(readProfile());
        closeModal(editAccountModal);
        openModal(editAccountFormModal);
    });
}

if (closeEditAccountFormButton) {
    closeEditAccountFormButton.addEventListener("click", () =>
        closeModal(editAccountFormModal)
    );
}

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

if (deleteAccountButton) {
    deleteAccountButton.addEventListener("click", () => {
        window.location.href = "a1_perfectdate_start.html";
    });
}

if (editAccountForm) {
    editAccountForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const current = readProfile();
        const name = (editNameInput?.value || "").trim() || current.name;
        const username =
            (editUsernameInput?.value || "").trim() || current.username;

        saveProfile({ name, username });
        closeModal(editAccountFormModal);
        openModal(editAccountModal);
    });
}

closeOnOverlayClick(editAccountFormModal);

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
    if (userSettingsTitle) userSettingsTitle.textContent = profile.username;
    if (editNameInput) editNameInput.value = profile.name;
    if (editUsernameInput) editUsernameInput.value = profile.username;
};

const saveProfile = (profile) => {
    localStorage.setItem("userProfile", JSON.stringify(profile));
    applyProfile(profile);
};

// Initialize profile on page load
applyProfile(readProfile());