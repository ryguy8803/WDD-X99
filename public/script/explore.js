import { createIdeaCardHTML, toggleLike, getAllIdeas, showIdeaDetail } from "./script.js";
import "./auth.js";

// Elements
const exploreSearchInput = document.querySelector("input[name='search']");
const exploreIdeaList = document.getElementById("idea-list");

// Get selected category tags
const getSelectedTags = () => {
    return Array.from(
        document.querySelectorAll(".tags .tag-button.is-active")
    ).map((button) => button.textContent.trim());
};

// Render idea cards
const renderExploreIdeas = async (ideas) => {
    if (!exploreIdeaList) return;

    if (ideas.length === 0) {
        exploreIdeaList.innerHTML = '<p style="text-align: center; color: var(--gray-50); padding: var(--large-spacing);">No ideas found matching your criteria. Try a different search or filter!</p>';
        return;
    }

    exploreIdeaList.innerHTML = '';

    const cardHTMLPromises = ideas.map(idea => createIdeaCardHTML(idea));
    const cardHTMLs = await Promise.all(cardHTMLPromises);

    const fragment = document.createDocumentFragment();

    cardHTMLs.forEach((cardHTML, index) => {
        const idea = ideas[index];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHTML;
        const card = tempDiv.firstElementChild;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.heart-icon')) return;
            showIdeaDetail(idea);
        });

        fragment.appendChild(card);
    });

    exploreIdeaList.appendChild(fragment);
};


// Filter and display ideas based on search and tags
const filterExploreIdeas = async () => {
    const query = (exploreSearchInput?.value || "").trim().toLowerCase();
    const selectedTags = getSelectedTags();

    // Fetch ideas from Firestore, pre-filtering by category and query on the server
    const ideasFromDB = await getAllIdeas({ categories: selectedTags, query: query });
    
    await renderExploreIdeas(ideasFromDB);
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
