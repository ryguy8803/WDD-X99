import { createIdeaCardHTML, getLikedIdeas, toggleLike, openModal, closeModal, closeOnOverlayClick, getAllIdeas, db } from "./script.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";


// Main function that renders all idea cards to the home page
async function renderHomeIdeas() {
    // Get the container where cards will go
    const container = document.getElementById("home-idea-list");
    
    // Clear container first
    container.innerHTML = "";
    
    // Fetch ideas from Firestore
    const ideas = await getAllIdeas();
    
    // Loop through all ideas from Firestore
    for (const idea of ideas) {
        // Create the HTML for this card (now async)
        const cardHTML = await createIdeaCardHTML(idea);
        
        // Add it to the container
        container.innerHTML += cardHTML;
    }
}

// Renders the favorites preview section on the home page
async function renderHomeFavoritesPreview() {
    const container = document.getElementById("home-favorites-list");
    const emptyMessage = document.querySelector(".favorites");
    
    // Get liked IDs (now async)
    const likedIds = await getLikedIdeas();
    
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
    
    // Fetch ideas from Firestore and filter to only liked ones
    const allIdeas = await getAllIdeas();
    const likedIdeas = allIdeas.filter(idea => likedIds.includes(idea.id));
    
    // Render each liked idea card
    for (const idea of likedIdeas) {
        const cardHTML = await createIdeaCardHTML(idea);
        container.innerHTML += cardHTML;
    }
}

// Init and Event Listeners ------------------------------------------------------------------------------

// Modal elements
const modalOverlay = document.getElementById("add-idea-modal");
const openModalButton = document.getElementById("open-add-idea");
const closeModalButton = document.getElementById("close-add-idea");
const addIdeaForm = document.getElementById("add-idea-form");

// Run when the page loads
(async () => {
    await renderHomeIdeas();
    await renderHomeFavoritesPreview();
})();

// Listen for clicks on heart icons
document.addEventListener("click", async (event) => {
    // Check if a heart icon was clicked
    const heart = event.target.closest(".heart-icon");
    if (!heart) return; // Not a heart, ignore
    
    // Get the idea ID from the heart (keep as string for Firestore)
    const ideaId = heart.getAttribute("data-idea-id");
    
    // Toggle the like status (now async)
    const isNowLiked = await toggleLike(ideaId);
    
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
    await renderHomeFavoritesPreview();
});

addIdeaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(addIdeaForm);
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const category = String(formData.get("category") || "");    
    const priceValue = Number(formData.get("price") || 0);

    if (!name) {
        return;
    }

    const priceMap = { 0: 0, 1: 20, 2: 50, 3: 100 };
    const average_cost = priceMap[priceValue];

    const newActivity = {
        title: name,
        description: description,
        dollars: priceValue,
        category: category,
        image: "",
        tags: []
    };
    
    try {
        await addDoc(collection(db, "activities"), newActivity);
        
        // Re-render the ideas
        await renderHomeIdeas();
        
        addIdeaForm.reset();
        closeModal(modalOverlay);
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("There was an error adding your date idea. Please try again.");
    }
});

// Add Idea Modal event listeners
if (openModalButton) {
    openModalButton.addEventListener("click", () => openModal(modalOverlay));
}

if (closeModalButton) {
    closeModalButton.addEventListener("click", () => closeModal(modalOverlay));
}

closeOnOverlayClick(modalOverlay);