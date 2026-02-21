import { renderDollarSigns, saveLikedIdeas, getLikedIdeas, getAllIdeas } from "./script.js";
import { openModal, closeModal, closeOnOverlayClick } from "./script.js";

// ============================== RANDOMIZE FEATURE ==============================
// Randomize & Preferences Modals
const openRandomizeButton = document.getElementById("open-randomize");
const openPreferencesButton = document.getElementById("open-preferences");
const randomizeModal = document.getElementById("randomize-modal");
const preferencesModal = document.getElementById("preferences-modal");
const closeRandomizeButton = document.getElementById("close-randomize");
const closePreferencesButton = document.getElementById("close-preferences");
const applyPreferencesButton = document.getElementById("apply-preferences");
const randomizeRejectButton = document.getElementById("randomize-reject");
const randomizeFavoriteButton = document.getElementById("randomize-favorite");
const randomizeEmptyMessage = document.getElementById("randomize-empty-message");
const randomizeCard = document.getElementById("randomize-idea-card");
const randomizeActions = document.getElementById("randomize-actions");
const randomizeAddCalendarButton = document.getElementById(
    "randomize-add-calendar"
);
const adjustPreferencesButton = document.getElementById("adjust-preferences-button");
const adjustPreferencesSection = document.getElementById("randomize-adjust-preferences");

let currentRandomIdea = null;
let currentPreferences = null;
let remainingIdeaIds = [];
let allIdeas = []; // Cache for Firestore ideas

// Template for cards
const createRandomizeCardHTML = (idea) => {
    const priceHTML = idea.dollars > 0 
        ? `<div class="price-level">${renderDollarSigns(idea.dollars)}</div>`
        : "";
    
    return `
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
            </section>
        </div>
    `;
};

// Use a random idea
const renderRandomizeIdea = (idea) => {
    if (!idea || !randomizeCard) return;
    randomizeCard.innerHTML = createRandomizeCardHTML(idea);
};

// Add Idea to favorites
const addIdeaToFavorites = async (idea) => {
    if (!idea) return;
    const likedIds = await getLikedIdeas();
    if (likedIds.includes(idea.id)) return;
    
    likedIds.push(idea.id);
    await saveLikedIdeas(likedIds);
};

// Process preferences entered into modal
const getSelectedPreferences = () => {
    const selectedCategories = Array.from(
        preferencesModal.querySelectorAll(".tag-button.is-active")
    ).map((button) => button.textContent.trim().toLowerCase());

    const getCheckedValues = (name) => {
        const inputs = preferencesModal.querySelectorAll(
            `input[name='${name}']:checked`
        );
        return Array.from(inputs).map(input => input.value);
    };

    const requiredTags = [];
    const locations = getCheckedValues("location");
    const energies = getCheckedValues("energy");
    const durations = getCheckedValues("duration");
    const cost = getCheckedValues("cost")[0]; // Cost stays single

    // Add all selected location tags
    locations.forEach(loc => { requiredTags.push(loc === "indoors" ? "indoor" : "outdoor"); });
    
    // Add all selected energy tags
    energies.forEach(energy => { requiredTags.push(energy === "high-energy" ? "high energy" : "lazy"); });
    
    // Add all selected duration tags
    durations.forEach(duration => requiredTags.push(duration));

    if (selectedCategories.length === 0 && requiredTags.length === 0 && !cost) {
        return null;
    }

    return {
        categories: selectedCategories,
        tags: requiredTags,
        cost
    };
};

// Filters ideas from preferences
const getFilteredIdeas = (preferences) => {
    let filtered = allIdeas;

    // Filter categories
    if (preferences?.categories?.length) {
        filtered = filtered.filter((idea) =>
            preferences.categories.includes((idea.category || "").toLowerCase())
        );
    }

    // Filter tags (indoor/outdoor, lazy/high energy, quick/long)
    if (preferences?.tags?.length) {
        filtered = filtered.filter((idea) => {
            const ideaTags = (idea.tags || []).map((tag) => tag.toLowerCase());
            // Idea must have at least one of the selected tags
            return preferences.tags.some((tag) => ideaTags.includes(tag));
        });
    }

    //Filter cost
    if (preferences?.cost) {
        filtered = filtered.filter((idea) => {
            if (preferences.cost === "free") return Number(idea.dollars) === 0;
            return Number(idea.dollars) > 0;
        });
    }

    console.log(preferences);
    return filtered;
};

// Functions to toggle between empty state and idea display
// Show if empty
const showEmptyState = (message) => {
    randomizeEmptyMessage.textContent = message;
    randomizeEmptyMessage.hidden = false;
    randomizeCard.hidden = true;
    randomizeActions.style.display = "none";
    
    // Show adjust preferences button only if using preferences
    if (adjustPreferencesSection) {
        if (currentPreferences) {
            adjustPreferencesSection.style.display = "flex";
        } else {
            adjustPreferencesSection.style.display = "none";
        }
    }
};
// Show if there are more ideas
const showIdeaState = () => {
    randomizeEmptyMessage.hidden = true;
    randomizeCard.hidden = false;
    randomizeActions.style.display = "flex";
    if (adjustPreferencesSection) {
        adjustPreferencesSection.style.display = "none";
    }
};
// Use showEmptyState or showIdeaState
const showNextIdea = () => {
    const filteredIdeas = getFilteredIdeas(currentPreferences);
    const remainingIdeas = filteredIdeas.filter((idea) =>
        !remainingIdeaIds.includes(idea.id)
    );

    // No more ideas available
    if (remainingIdeas.length === 0) {
        const message = currentPreferences
            ? "You're all out of ideas that match your preferences. Try adjusting your filters."
            : "You're all out of date ideas for now. Try again later or add your own!";
        showEmptyState(message);
        currentRandomIdea = null;
        return;
    }

    // Pick a random idea from remaining ones
    const randomIndex = Math.floor(Math.random() * remainingIdeas.length);
    currentRandomIdea = remainingIdeas[randomIndex];
    remainingIdeaIds.push(currentRandomIdea.id);
    
    showIdeaState();
    renderRandomizeIdea(currentRandomIdea);
};

// Randomize Modal Event Listeners
openRandomizeButton.addEventListener("click", async () => {
    currentPreferences = null;
    remainingIdeaIds = [];
    if (adjustPreferencesSection) {
        adjustPreferencesSection.style.display = "none";
    }
    
    // Load ideas from Firestore
    allIdeas = await getAllIdeas();
    
    openModal(randomizeModal);
    showNextIdea();
});
closeRandomizeButton.addEventListener("click", () =>
    closeModal(randomizeModal)
);
randomizeRejectButton.addEventListener("click", () => {
    // Animate the button
    randomizeRejectButton.classList.remove("btn-click-animate");
    void randomizeRejectButton.offsetWidth;
    randomizeRejectButton.classList.add("btn-click-animate");
    
    // Wait for animation to complete, then show next idea
    window.setTimeout(() => {
        randomizeRejectButton.classList.remove("btn-click-animate");
        showNextIdea();
    }, 300);
});
randomizeFavoriteButton.addEventListener("click", async () => {
    // Add to favorites (now async)
    await addIdeaToFavorites(currentRandomIdea);
    
    // Get the heart SVG path element
    const heartPath = randomizeFavoriteButton.querySelector("svg path");
    
    // Fill the heart
    heartPath.setAttribute("fill", "rgb(62,0,84)");
    
    // Animate the button
    randomizeFavoriteButton.classList.remove("btn-click-animate");
    void randomizeFavoriteButton.offsetWidth;
    randomizeFavoriteButton.classList.add("btn-click-animate");
    
    // Wait for animation to complete, then unfill and show next idea
    window.setTimeout(() => {
        heartPath.setAttribute("fill", "none");
        randomizeFavoriteButton.classList.remove("btn-click-animate");
        showNextIdea();
    }, 300);
});
randomizeAddCalendarButton.addEventListener("click", () => {
    closeModal(randomizeModal);
    if (!currentRandomIdea) return;

    const pendingEvent = {
        title: currentRandomIdea.title,
        category: currentRandomIdea.category || "",
        dollars: currentRandomIdea.dollars || 0
    };

    // NOTE: Disabled localStorage - need to implement Firebase-based solution
    // localStorage.setItem(
    //     "pendingCalendarEvent",
    //     JSON.stringify(pendingEvent)
    // );

    if (addEventModal) {
        openModal(addEventModal);
        if (addEventTitle) addEventTitle.value = pendingEvent.title;
        if (addEventCategory) {
            addEventCategory.value = pendingEvent.category
                .toLowerCase()
                .replace(/\s+/g, "-");
        }
    } else {
        window.location.href = "c4_calendar.html";
    }
});

// Preferences Modal Event Listeners
openPreferencesButton.addEventListener("click", () => openModal(preferencesModal));
closePreferencesButton.addEventListener("click", () => closeModal(preferencesModal));
applyPreferencesButton.addEventListener("click", async () => {
    currentPreferences = getSelectedPreferences();
    remainingIdeaIds = []; // Reset the seen ideas when applying preferences
    
    // Load ideas from Firestore
    allIdeas = await getAllIdeas();
    
    closeModal(preferencesModal);
    openModal(randomizeModal);
    showNextIdea();
});

// Toggle tag buttons active state in preferences modal
preferencesModal.addEventListener("click", (event) => {
    const tagButton = event.target.closest(".tag-button");
    if (tagButton) {
        tagButton.classList.toggle("is-active");
    }
});

// Adjust preferences button opens preferences modal
if (adjustPreferencesButton) {
    adjustPreferencesButton.addEventListener("click", () => {
        closeModal(randomizeModal);
        openModal(preferencesModal);
    });
}

closeOnOverlayClick(randomizeModal);
closeOnOverlayClick(preferencesModal);