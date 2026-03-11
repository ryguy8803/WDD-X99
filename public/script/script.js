// Firebase imports and setup
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
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
        const protectedPages = ['tutorial.html', 'home.html', 'randomize.html', 'explore.html', 'calendar.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
    }
});

// Fetch date ideas from Firestore, with optional filters
export async function getAllIdeas(filters = {}) {
    try {
        const activitiesRef = collection(db, "activities");
        let q;

        // If there are category filters, build a query
        if (filters.categories && filters.categories.length > 0) {
            // Note: Firestore 'in' query is limited to 10 values.
            // If you have more categories, you'll need to perform multiple queries.
            q = query(activitiesRef, where("category", "in", filters.categories));
        } else {
            // Otherwise, create a query for all activities
            q = query(activitiesRef);
        }
        
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title || "",
            description: doc.data().description || "",
            details: doc.data().details || "",
            address: doc.data().address || "",
            website: doc.data().website || "",
            category: doc.data().category || "",
            location: doc.data().location || 0,
            image: doc.data().image || "",
            dollars: doc.data().dollars || 0,
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
    if (!modal) return;

    modal.addEventListener("click", (event) => {
        // Only close if the overlay itself is clicked
        if (event.target === modal) {
            closeModal(modal);
        }
    });
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

// Show Idea Detail Overlay
export async function showIdeaDetail(idea) {
    const modal = document.getElementById('idea-detail-modal');
    const content = document.getElementById('idea-detail-content')
    
    if (!modal || !content) return;
    
    // Function to render content and setup listeners
    const renderContent = async () => {
        // Generate the overlay HTML
        content.innerHTML = await createIdeaOverlayHTML(idea);
        
        // Setup close button
        const closeBtn = content.querySelector('.close-overlay');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.classList.remove('is-open');
                document.body.style.overflow = '';
            };
        }
        
        // Setup heart icon click
        const heartIcon = content.querySelector('.heart-icon');
        if (heartIcon) {
            heartIcon.addEventListener('click', async (e) => {
                e.stopPropagation();
                await toggleLike(idea.id);
                // Refresh the overlay and re-setup listeners
                await renderContent();
            });
        }
    };
    
    // Initial render
    await renderContent();
    
    // Show the modal
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
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
        
        // Dispatch event to update all hearts
        window.dispatchEvent(new CustomEvent('favoritesChanged', { 
            detail: { ideaId, isLiked: false } 
        }));
        
        return false; // Now unliked
    } else {
        // Add to liked array
        likedIds.push(ideaId);
        await saveLikedIdeas(likedIds);
        
        // Dispatch event to update all hearts
        window.dispatchEvent(new CustomEvent('favoritesChanged', { 
            detail: { ideaId, isLiked: true } 
        }));
        
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
                    <p>${idea.location}</p>
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

// Creates the HTML for a single idea card overlay
export async function createIdeaOverlayHTML(idea) {
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
        <div class="idea-card-hero">
            <img src="${idea.image}" alt="${idea.title}" class="hero">
            <button type="button" class="close-overlay" id="close-favorites">
                <img src="images/Xwhite.svg" alt="Close" width="30" height="30">
            </button>
        </div>
        <div class="card-body">
            <div class="top-half">
                <section class="top3rd">
                    <h3>${idea.title}</h3>
                    ${priceHTML}
                </section>
                <p>${idea.location}</p>
            </div>
            <div>
                <p>${idea.description}</p>
                <br>
                <p>${idea.details}</p>
            </div>
            <div>
                <p>${idea.address}</p>
                <br>
                <a target=_blank href="${idea.website}">${idea.title} Website</a>
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
    `;
}

// Favorites  ----------------------------------------------------------------

// Function to render favorites list in modal
export async function renderFavoritesList() {
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
    
    // Clear existing content
    favoritesList.innerHTML = '';
    
    // Render each favorite card with click listeners
    for (const idea of likedIdeas) {
        const cardHTML = await createIdeaCardHTML(idea);
        const cardElement = document.createElement('div');
        cardElement.innerHTML = cardHTML;
        const card = cardElement.firstElementChild;
        
        // Add click listener
        card.addEventListener('click', (e) => {
            // Don't open overlay if clicking heart icon
            if (e.target.closest('.heart-icon')) return;
            showIdeaDetail(idea);
        });
        
        favoritesList.appendChild(card);
    }
}

initializeModal("favorites-modal", {
    openButtonSelector: "#open-favorites, .open-favorites",  
    closeButtonSelector: "#close-favorites",                  
    closeOnOverlay: false,                                    
    onOpen: async () => {
        await renderFavoritesList();
    }
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
document.addEventListener("click", async (event) => {
    const target = event.target.closest(".heart-icon");
    if (target) {
        await toggleActive(target);
        
        // Check if we're inside the favorites modal
        const favoritesModal = document.getElementById("favorites-modal");
        if (favoritesModal && favoritesModal.classList.contains("is-open")) {
            // We're in the favorites overlay, so refresh the list
            await renderFavoritesList();
        }
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

// Global listener to update all heart icons when favorites change
window.addEventListener('favoritesChanged', (event) => {
    const { ideaId, isLiked } = event.detail;
    
    // Find all heart icons for this idea
    const heartIcons = document.querySelectorAll(`.heart-icon[data-idea-id="${ideaId}"]`);
    
    heartIcons.forEach(heart => {
        if (isLiked) {
            heart.src = "images/HeartFilled.svg";
            heart.classList.add('is-active');
        } else {
            heart.src = "images/Heart.svg";
            heart.classList.remove('is-active');
        }
    });
});