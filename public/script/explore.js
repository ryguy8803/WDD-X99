import { createIdeaCardHTML, toggleLike, getAllIdeas } from "./script.js";

// Elements
const exploreSearchInput = document.querySelector("input[name='search']");
const exploreIdeaList = document.getElementById("idea-list");

// Get selected category tags
const getSelectedTags = () => {
    const tags = Array.from(
        document.querySelectorAll(".tags .tag-button.is-active")
    ).map((button) => button.textContent.trim().toLowerCase());
    return tags;
};

// Render all idea cards
const renderExploreIdeas = async (ideas) => {
    if (!exploreIdeaList) return;
    
    // Clear the container
    exploreIdeaList.innerHTML = "";
    
    // Render each idea card
    for (const idea of ideas) {
        const cardHTML = await createIdeaCardHTML(idea);
        exploreIdeaList.innerHTML += cardHTML;
    }
};

// Filter and display ideas based on search and tags
const filterExploreIdeas = async () => {
    const query = (exploreSearchInput?.value || "").trim().toLowerCase();
    const selectedTags = getSelectedTags();

    // Fetch ideas from Firestore
    const allIdeas = await getAllIdeas();
    
    const filtered = allIdeas.filter((idea) => {
        const category = (idea.category || "").toLowerCase();
        const title = (idea.title || "").toLowerCase();
        const description = (idea.description || "").toLowerCase();

        // Check if matches search query
        const matchesQuery = query
            ? title.includes(query) ||
              description.includes(query) ||
              category.includes(query)
            : true;

        // Check if matches selected category tags
        const matchesTags = selectedTags.length
            ? selectedTags.includes(category)
            : true;

        return matchesQuery && matchesTags;
    });

    await renderExploreIdeas(filtered);
};

// Init and Event Listeners ------------------------------------------------------------------------------

// Initial render
filterExploreIdeas();

// Search input listener
if (exploreSearchInput) {
    exploreSearchInput.addEventListener("input", () => {
        filterExploreIdeas();
    });
}

// Tag button click listener
document.addEventListener("click", async (event) => {
    const tagButton = event.target.closest(".tags .tag-button");
    if (tagButton) {
        tagButton.classList.toggle("is-active");
        await filterExploreIdeas();
    }
    
    // Heart icon click listener
    const heart = event.target.closest(".heart-icon");
    if (heart) {
        const ideaId = heart.getAttribute("data-idea-id");
        const isNowLiked = await toggleLike(ideaId);
        
        // Update ALL heart icons for this idea ID
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
    }
});