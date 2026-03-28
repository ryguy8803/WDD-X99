// Firebase imports and setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrs8ZXvUypKfF1cRsqLYwgHEcQI6qrev0",
  authDomain: "wdd-x99-86659873-cf284.firebaseapp.com",
  databaseURL: "https://wdd-x99-86659873-cf284-default-rtdb.firebaseio.com",
  projectId: "wdd-x99-86659873-cf284",
  storageBucket: "wdd-x99-86659873-cf284.firebasestorage.app",
  messagingSenderId: "43055830649",
  appId: "1:43055830649:web:3c244e1d5bea6300dfe6a8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

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
        // We fetch all activities and filter client-side for privacy.
        const snapshot = await getDocs(query(activitiesRef));

        const allIdeasRaw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter ideas to only include public ideas (no userId) or ideas owned by the current user.
        const user = getCurrentUser();
        const visibleIdeas = allIdeasRaw.filter(idea => {
            return !idea.userId || (user && idea.userId === user.uid);
        });

        let ideasToDisplay = visibleIdeas;

        // Apply search query filter
        if (filters.query) {
            const q = filters.query.toLowerCase();
            ideasToDisplay = ideasToDisplay.filter(idea => {
                const searchable = [
                    idea.title,
                    idea.description,
                    idea.details,
                    idea.category,
                    idea.location,
                    idea.address
                ].filter(Boolean).join(" ").toLowerCase();
                return searchable.includes(q);
            });
        }

        // Apply category filters if provided
        if (filters.categories && filters.categories.length > 0) {
            const lowerCaseCategories = filters.categories.map(c => c.toLowerCase());
            ideasToDisplay = ideasToDisplay.filter(idea => 
                lowerCaseCategories.includes((idea.category || "").toLowerCase())
            );
        }

        // Apply location filter if provided
        if (filters.location) {
            ideasToDisplay = ideasToDisplay.filter(idea =>
                (idea.location || "") === filters.location
            );
        }

        // Apply price filter if provided
        if (filters.price !== undefined && filters.price !== "") {
            const priceValue = Number(filters.price);
            ideasToDisplay = ideasToDisplay.filter(idea =>
                (idea.dollars || 0) === priceValue
            );
        }
        
        return ideasToDisplay.map(idea => ({
            id: idea.id,
            title: idea.title || "",
            description: idea.description || "",
            details: idea.details || "",
            address: idea.address || "",
            website: idea.website || "",
            category: idea.category || "",
            location: idea.location || "",
            image: idea.image || "",
            dollars: idea.dollars || 0,
            tags: idea.tags || []
        }));

    } catch (error) {
        console.error("Error fetching ideas:", error);
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
        onClose = null,         // Function to run when modal closes
        closeOnOverlay = true
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
        const closeButton = modal.querySelector(closeButtonSelector) || document.querySelector(closeButtonSelector);
        if (closeButton) {
            closeButton.addEventListener("click", () => {
                closeModal(modal);
                if (onClose) onClose(modal);
            });
        }
    }

    // Allow overlay click to close modal
    if (closeOnOverlay) {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeModal(modal);
                if (onClose) onClose(modal);
            }
        });
    }

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

        // Setup add-to-calendar button
        const calendarBtn = content.querySelector('.add-to-calendar-btn');
        if (calendarBtn) {
            calendarBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const addEventModal = document.getElementById('add-event-modal');
                if (!addEventModal) return;

                const titleInput = document.getElementById('event-title');
                const locationInput = document.getElementById('event-location');
                const categoryInput = document.getElementById('event-category');
                const notesInput = document.getElementById('event-notes');
                const ideaIdInput = document.getElementById('event-idea-id');

                if (titleInput) titleInput.value = idea.title || idea.name || '';
                if (locationInput) locationInput.value = idea.location || idea.address || '';
                if (categoryInput) categoryInput.value = idea.category || '';
                if (notesInput) notesInput.value = idea.description || '';
                if (ideaIdInput) ideaIdInput.value = idea.id || '';

                openModal(addEventModal);
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
    const ideaId = idea.id;
    const title = idea.title || idea.name;

    // Handle price display for both database ideas (dollars) and AI ideas (price)
    let priceHTML = '';
    if (idea.dollars) {
        priceHTML = `<div class="price-level">${renderDollarSigns(idea.dollars)}</div>`;
    } else if (idea.price) {
        const dollarCount = idea.price.length;
        priceHTML = `<div class="price-level">${renderDollarSigns(dollarCount)}</div>`;
    }

    const isLiked = await isIdeaLiked(ideaId);
    const heartSrc = isLiked ? "images/HeartFilled.svg" : "images/Heart.svg";
    const heartClass = isLiked ? "heart-icon is-active" : "heart-icon";

    return `
        <div class="card idea-card">
            <img src="${idea.image}" alt="${title}" class="hero">
            <div class="card-body">
                <div class="top-half">
                    <section class="top3rd">
                        <h3>${title}</h3>
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
    const ideaId = idea.id;
    const title = idea.title || idea.name;

    // Handle price display for both database ideas (dollars) and AI ideas (price)
    let priceHTML = '';
    if (idea.dollars) {
        priceHTML = `<div class="price-level">${renderDollarSigns(idea.dollars)}</div>`;
    } else if (idea.price) {
        const dollarCount = idea.price.length;
        priceHTML = `<div class="price-level">${renderDollarSigns(dollarCount)}</div>`;
    }

    const isLiked = await isIdeaLiked(ideaId);
    const heartSrc = isLiked ? "images/HeartFilled.svg" : "images/Heart.svg";
    const heartClass = isLiked ? "heart-icon is-active" : "heart-icon";

    // Conditionally build details, address, and website HTML
    const detailsHTML = idea.details ? `<p>${idea.details}</p>` : '';
    const addressHTML = idea.address ? `<p>${idea.address}</p>` : '';
    const websiteHTML = idea.website ? `<a target="_blank" href="${idea.website}">${title} Website</a>` : '';

    return `
        <div class="idea-card-hero">
            <img src="${idea.image}" alt="${title}" class="hero">
            <button type="button" class="close-overlay" id="close-favorites">
                <img src="images/Xwhite.svg" alt="Close" width="30" height="30">
            </button>
        </div>
        <div class="card-body">
            <div class="top-half">
                <section class="top3rd">
                    <h3>${title}</h3>
                    ${priceHTML}
                </section>
                <p>${idea.location}</p>
            </div>
            <div>
                <p>${idea.description || ''}</p>
                ${detailsHTML ? `<br>${detailsHTML}` : ''}
            </div>
            <div>
                ${addressHTML ? `${addressHTML}<br>` : ''}
                ${websiteHTML}
            </div>
            <section class="bottom3rd">
                <span class="tag">${idea.category || ''}</span>
                <div class="bottom3rd-actions">
                    <button type="button" class="add-to-calendar-btn" data-idea-id="${ideaId}">
                        <img src="images/Calendar.svg" alt="Add to Calendar" width="25" height="25">
                    </button>
                    <img 
                        src="${heartSrc}" 
                        alt="Heart Icon" 
                        class="${heartClass}"
                        data-idea-id="${ideaId}">
                </div>
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
