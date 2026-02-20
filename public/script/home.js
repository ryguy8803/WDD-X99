import dateIdeas from "./dateIdeas.js";
import { createIdeaCardHTML, getLikedIdeas, toggleLike, closeOnOverlayClick } from "./script.js";


// Main function that renders all idea cards to the home page
function renderHomeIdeas() {
    // Get the container where cards will go
    const container = document.getElementById("home-idea-list");
    
    // Loop through all ideas from ideas.js
    dateIdeas.forEach(idea => {
        // Create the HTML for this card
        const cardHTML = createIdeaCardHTML(idea);
        
        // Add it to the container
        container.innerHTML += cardHTML;
    });
}

// Renders the favorites preview section on the home page
function renderHomeFavoritesPreview() {
    const container = document.getElementById("home-favorites-list");
    const emptyMessage = document.querySelector(".favorites");
    
    // Get liked IDs
    const likedIds = getLikedIdeas();
    
    // Show/hide empty message based on whether there are likes
    if (likedIds.length === 0) {
        if (emptyMessage) emptyMessage.hidden = false;
        container.hidden = true;
        return;
    }
    
    // Hide empty message and show container
    if (emptyMessage) emptyMessage.hidden = true;
    container.hidden = false;
    
    // Clear the container to prevent duplicates
    container.innerHTML = "";
    
    // Filter dateIdeas to only liked ones
    const likedIdeas = dateIdeas.filter(idea => likedIds.includes(idea.id));
    
    // Render each liked idea card
    likedIdeas.forEach(idea => {
        const cardHTML = createIdeaCardHTML(idea);
        container.innerHTML += cardHTML;
    });
}

// Init and Event Listeners ------------------------------------------------------------------------------

// Run when the page loads
renderHomeIdeas();
renderHomeFavoritesPreview();

// Listen for clicks on heart icons
document.addEventListener("click", (event) => {
    // Check if a heart icon was clicked
    const heart = event.target.closest(".heart-icon");
    if (!heart) return; // Not a heart, ignore
    
    // Get the idea ID from the heart
    const ideaId = parseInt(heart.getAttribute("data-idea-id"));
    
    // Toggle the like status
    const isNowLiked = toggleLike(ideaId);
    
    // Update ALL heart icons for this idea ID (in both main and favorites sections)
    const allHeartsForIdea = document.querySelectorAll(`[data-idea-id="${ideaId}"]`);
    allHeartsForIdea.forEach(heartIcon => {
        if (isNowLiked) {
            heartIcon.src = "images/HeartFilled.svg";
            heartIcon.classList.add("is-active");
        } else {
            heartIcon.src = "images/Heart.svg";
            heartIcon.classList.remove("is-active");
        }
    });
    
    // Re-render the favorites preview to reflect the change
    renderHomeFavoritesPreview();
});

// Add Idea Modal
const modalOverlay = document.getElementById("add-idea-modal");
const openModalButton = document.getElementById("open-add-idea");
const closeModalButton = document.getElementById("close-add-idea");

if (openModalButton) {
    openModalButton.addEventListener("click", () => openModal(modalOverlay));
}

if (closeModalButton) {
    closeModalButton.addEventListener("click", () => closeModal(modalOverlay));
}

closeOnOverlayClick(modalOverlay);