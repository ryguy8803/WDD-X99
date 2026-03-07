import { createIdeaCardHTML, getLikedIdeas, toggleLike, openModal, closeModal, initializeModal, getAllIdeas, db, auth } from "./script.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import "./auth.js";

const storage = getStorage();


// Main function that renders all idea cards to the home page
async function renderHomeIdeas() {
    const container = document.getElementById("home-idea-list");
    
    container.innerHTML = "";
    
    const allIdeas = await getAllIdeas();
    
    const shuffled = allIdeas.sort(() => 0.5 - Math.random());
    const randomIdeas = shuffled.slice(0, 7);
    
    for (const idea of randomIdeas) {
        const cardHTML = await createIdeaCardHTML(idea);
        
        container.innerHTML += cardHTML;
    }
}

// Renders the favorites preview section on the home page
async function renderHomeFavoritesPreview() {
    const container = document.getElementById("home-favorites-list");
    const emptyMessage = document.querySelector(".favorites");
    
    // Clear the container first to prevent duplicates
    container.innerHTML = "";
    
    // Get liked IDs (now async)
    const likedIds = await getLikedIdeas();
    
    // Show/hide empty message based on whether there are likes
    if (likedIds.length === 0) {
        emptyMessage.hidden = false;
        container.hidden = true;
        return;
    }
    
    // Hide empty message and show container
    emptyMessage.hidden = true;
    container.hidden = false;
    
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

// Add Idea Modal - allows users to create custom date ideas
const addIdeaModal = initializeModal("add-idea-modal", {
    openButtonSelector: "#open-add-idea",
    closeButtonSelector: "#close-add-idea"
});

const addIdeaForm = document.getElementById("add-idea-form");

// Run when the page loads
renderHomeIdeas();
renderHomeFavoritesPreview();

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
    const location = String(formData.get("location") || "");
    const energy = String(formData.get("energy") || "");
    const duration = String(formData.get("duration") || "");
    const imageFile = formData.get("image");

    if (!name) {
        alert("Please enter a name for your date idea.");
        return;
    }

    // Build tags array from preferences
    const tags = [];
    if (location) tags.push(location);
    if (energy) tags.push(energy);
    if (duration) tags.push(duration);

    try {
        let imageUrl = "";
        
        // Upload image to Firebase Storage if a file was selected
        if (imageFile && imageFile.size > 0) {
            const timestamp = Date.now();
            const fileName = `${timestamp}_${imageFile.name}`;
            const storageRef = ref(storage, `activity-images/${fileName}`);
            
            await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(storageRef);
        }

        const newActivity = {
            title: name,
            description: description,
            dollars: priceValue,
            category: category,
            image: imageUrl,
            tags: tags
        };
        
        await addDoc(collection(db, "activities"), newActivity);
        
        // Re-render the ideas
        await renderHomeIdeas();
        
        addIdeaForm.reset();
        closeModal(addIdeaModal.element);
    } catch (e) {
        alert("There was an error adding your date idea. Please try again.");
    }
});