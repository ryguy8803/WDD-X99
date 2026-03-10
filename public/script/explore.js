import { createIdeaCardHTML, toggleLike, getAllIdeas, showIdeaDetail } from "./script.js";
import "./auth.js";

// Elements
const exploreSearchInput = document.querySelector("input[name='search']");
const exploreIdeaList = document.getElementById("idea-list");

// Get selected category tags
const getSelectedTags = () => {
    return Array.from(
        document.querySelectorAll(".tags .tag-button.is-active")
    ).map((button) => button.textContent.trim()); // Removed .toLowerCase()
};

// Render idea cards
const renderExploreIdeas = async (ideas) => {
    if (!exploreIdeaList) return;

    if (ideas.length === 0) {
        exploreIdeaList.innerHTML = '<p style="text-align: center; color: var(--gray-50); padding: var(--large-spacing);">No ideas found matching your criteria. Try a different search or filter!</p>';
        return;
    }

    exploreIdeaList.innerHTML = '';
    
    // Create and append each card with click listener
    for (const idea of ideas) {
        const cardHTML = await createIdeaCardHTML(idea);
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHTML;
        const card = tempDiv.firstElementChild;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.heart-icon')) return;
            showIdeaDetail(idea);
        });
        
        exploreIdeaList.appendChild(card);
    }
};

// Filter and display ideas based on search and tags
const filterExploreIdeas = async () => {
    const query = (exploreSearchInput?.value || "").trim().toLowerCase();
    const selectedTags = getSelectedTags();

    // Fetch ideas from Firestore, pre-filtering by category on the server
    const ideasFromDB = await getAllIdeas({ categories: selectedTags });
    
    // If there is a search query, perform a client-side search on the filtered results
    const filteredIdeas = query
        ? ideasFromDB.filter((idea) => {
            const title = (idea.title || "").toLowerCase();
            const description = (idea.description || "").toLowerCase();
            const category = (idea.category || "").toLowerCase();

            return title.includes(query) ||
                   description.includes(query) ||
                   category.includes(query);
        })
        : ideasFromDB; // If no query, show all ideas that matched the category filter

    await renderExploreIdeas(filteredIdeas);
};

// Init and Event Listeners ------------------------------------------------------------------------------

// Initial render
filterExploreIdeas();

// Search input listener
if (exploreSearchInput) {
    exploreSearchInput.addEventListener("input", filterExploreIdeas);
}

// Tag button and heart icon click listener
document.addEventListener("click", async (event) => {
    const tagButton = event.target.closest(".tags .tag-button");
    const heart = event.target.closest(".heart-icon");

    if (tagButton) {
        tagButton.classList.toggle("is-active");
        await filterExploreIdeas();
    }
    
    if (heart) {
        const ideaId = heart.getAttribute("data-idea-id");
        if (!ideaId) return;

        const isNowLiked = await toggleLike(ideaId);
        
        // Update ALL heart icons for this idea ID on the page
        const allHeartsForIdea = document.querySelectorAll(`[data-idea-id="${ideaId}"]`);
        allHeartsForIdea.forEach(heartIcon => {
            heartIcon.src = isNowLiked ? "images/HeartFilled.svg" : "images/Heart.svg";
            heartIcon.classList.toggle("is-active", isNowLiked);
        });
    }
});
