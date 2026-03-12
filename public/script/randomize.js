import { renderDollarSigns, saveLikedIdeas, getLikedIdeas, getAllIdeas, showIdeaDetail } from "./script.js";
import { openModal, closeModal, initializeModal } from "./script.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { db, getCurrentUser } from "./script.js";
import "./auth.js";

// ============================== RANDOMIZE FEATURE ==============================
const randomizeModal = initializeModal("randomize-modal", {
    closeButtonSelector: "#close-randomize"
});

const preferencesModal = initializeModal("preferences-modal", {
    closeButtonSelector: "#close-preferences",
    onOpen: () => {
        if (typeof loadPreferences === "function") {
            loadPreferences();
        }
    }
});

// Button references
const openRandomizeButton = document.getElementById("open-randomize");
const openPreferencesButton = document.getElementById("open-preferences");
const applyPreferencesButton = document.getElementById("apply-preferences");
const randomizeRejectButton = document.getElementById("randomize-reject");
const randomizeFavoriteButton = document.getElementById("randomize-favorite");
const randomizeEmptyState = document.getElementById("randomize-empty-state");
const randomizeEmptyMessage = document.getElementById("randomize-empty-message");
const randomizeCard = document.getElementById("randomize-idea-card");
const randomizeSwipeStage = document.getElementById("randomize-swipe-stage");
const randomizeActions = document.getElementById("randomize-actions");
const randomizeAddCalendarButton = document.getElementById("randomize-add-calendar");
const adjustPreferencesButton = document.getElementById("adjust-preferences-button");
const adjustPreferencesSection = document.getElementById("randomize-adjust-preferences");

// Add Event Modal elements
const addEventModal = document.getElementById("add-event-modal");
const addEventForm = document.getElementById("add-event-form");
const addEventTitle = document.getElementById("event-title");
const addEventDate = document.getElementById("event-date");
const addEventTime = document.getElementById("event-time");
const addEventLocation = document.getElementById("event-location");
const addEventCategory = document.getElementById("event-category");
const addEventPartner = document.getElementById("your-date");
const addEventNotes = document.getElementById("event-notes");
const cancelAddEventButton = document.getElementById("cancel-add-event");

let currentRandomIdea = null;
let currentPreferences = null;
let remainingIdeaIds = [];
let allIdeas = [];
let isSwipingCard = false;
let swipeBoundIdeaId = null;

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
                <p>${idea.location}</p>
            </div>
            <section class="bottom3rd">
                <span class="tag">${idea.category}</span>
            </section>
        </div>
    `;
};

const flashSwipeFeedback = (direction) => {
    if (!randomizeCard) return;

    randomizeCard.classList.remove(
        "is-swiping-left",
        "is-swiping-right",
        "swipe-confirm-like",
        "swipe-confirm-nope"
    );

    if (direction === "left") {
        randomizeCard.classList.add("is-swiping-left", "swipe-confirm-nope");
    } else if (direction === "right") {
        randomizeCard.classList.add("is-swiping-right", "swipe-confirm-like");
    }
};

const animateCardEntrance = () => {
    if (!randomizeCard) return;

    const isDesktop = window.matchMedia("(min-width: 800px)").matches;
    const duration = isDesktop ? 0.42 : 0.28;
    const startScale = isDesktop ? 0.96 : 0.94;

    randomizeCard.style.transition = "none";
    randomizeCard.style.opacity = "0";
    randomizeCard.style.transform = `translateX(0) translateY(0) scale(${startScale})`;

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            randomizeCard.style.transition = `transform ${duration}s ease, opacity ${duration}s ease`;
            randomizeCard.style.transform = "translateX(0) translateY(0) scale(1)";
            randomizeCard.style.opacity = "1";
        });
    });
};

const resetCardPosition = () => {
    if (!randomizeCard) return;

    randomizeCard.style.transition = "";
    randomizeCard.style.transform = "";
    randomizeCard.style.opacity = "";
    randomizeCard.classList.remove(
        "is-dragging",
        "is-swiping-left",
        "is-swiping-right",
        "swipe-confirm-like",
        "swipe-confirm-nope"
    );
};

const setSwipeVisual = (offsetX) => {
    if (!randomizeCard) return;

    const rotation = offsetX * 0.06;
    const normalized = Math.min(Math.abs(offsetX) / 120, 1);

    randomizeCard.style.transform = `translateX(${offsetX}px) rotate(${rotation}deg) scale(${1 + normalized * 0.02})`;
    randomizeCard.style.opacity = `${1 - normalized * 0.18}`;

    if (offsetX > 35) {
        randomizeCard.classList.add("is-swiping-right");
        randomizeCard.classList.remove("is-swiping-left");
    } else if (offsetX < -35) {
        randomizeCard.classList.add("is-swiping-left");
        randomizeCard.classList.remove("is-swiping-right");
    } else {
        randomizeCard.classList.remove("is-swiping-left", "is-swiping-right");
    }
};

const animateSwipeOut = async (direction) => {
    if (!randomizeCard || !currentRandomIdea) return;

    const isRight = direction === "right";
    const isDesktop = window.matchMedia("(min-width: 800px)").matches;

    const endX = isRight ? window.innerWidth * 1.15 : -window.innerWidth * 1.15;
    const duration = isDesktop ? 460 : 340;

    flashSwipeFeedback(direction);

    randomizeCard.style.transition = `transform ${duration}ms cubic-bezier(.22,.9,.31,1), opacity ${duration}ms ease`;
    randomizeCard.style.transform = `translateX(${endX}px) rotate(${isRight ? 24 : -24}deg) scale(1.06)`;
    randomizeCard.style.opacity = "0";

    if (isRight) {
        await addIdeaToFavorites(currentRandomIdea);
    }

    window.setTimeout(() => {
        showNextIdea();
    }, duration);
};

const initializeSwipeableCard = (idea) => {
    if (!randomizeCard || !idea) return;

    swipeBoundIdeaId = idea.id;
    resetCardPosition();

    let startX = 0;
    let currentX = 0;
    let pointerMoved = false;

    const isMobileViewport = () => window.matchMedia("(max-width: 799px)").matches;

    const onTouchStart = (event) => {
        if (!isMobileViewport() || swipeBoundIdeaId !== currentRandomIdea?.id) return;
        if (!event.touches || event.touches.length !== 1) return;

        startX = event.touches[0].clientX;
        currentX = 0;
        pointerMoved = false;
        isSwipingCard = false;

        randomizeCard.classList.add("is-dragging");
        randomizeCard.style.transition = "none";
    };

    const onTouchMove = (event) => {
        if (!isMobileViewport() || !event.touches || event.touches.length !== 1) return;
        if (!randomizeCard.classList.contains("is-dragging")) return;

        currentX = event.touches[0].clientX - startX;

        if (Math.abs(currentX) > 8) {
            pointerMoved = true;
            isSwipingCard = true;
        }

        if (!pointerMoved) return;

        setSwipeVisual(currentX);
    };

    const onTouchEnd = async () => {
        if (!randomizeCard.classList.contains("is-dragging")) return;

        randomizeCard.classList.remove("is-dragging");
        randomizeCard.style.transition = "transform 0.22s ease, opacity 0.22s ease";

        const threshold = 110;

        if (currentX > threshold) {
            await animateSwipeOut("right");
        } else if (currentX < -threshold) {
            await animateSwipeOut("left");
        } else {
            resetCardPosition();
            window.setTimeout(() => {
                isSwipingCard = false;
            }, 50);
        }
    };

    randomizeCard.ontouchstart = onTouchStart;
    randomizeCard.ontouchmove = onTouchMove;
    randomizeCard.ontouchend = onTouchEnd;
    randomizeCard.ontouchcancel = onTouchEnd;
};

// Use a random idea
const renderRandomizeIdea = (idea) => {
    if (!idea || !randomizeCard) return;

    resetCardPosition();
    randomizeCard.innerHTML = createRandomizeCardHTML(idea);

    randomizeCard.onclick = (e) => {
        if (e.target.closest(".icon-action-btn")) return;
        if (isSwipingCard) return;
        showIdeaDetail(idea);
    };

    initializeSwipeableCard(idea);
    animateCardEntrance();
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
        const inputs = preferencesModal.querySelectorAll(`input[name='${name}']:checked`);
        return Array.from(inputs).map(input => input.value);
    };

    const requiredTags = [];
    const locations = getCheckedValues("location");
    const energies = getCheckedValues("energy");
    const durations = getCheckedValues("duration");
    const cost = getCheckedValues("cost")[0];

    locations.forEach(loc => {
        requiredTags.push(loc === "indoors" ? "indoor" : "outdoor");
    });

    energies.forEach(energy => {
        requiredTags.push(energy === "high-energy" ? "high energy" : "lazy");
    });

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

    if (preferences?.categories?.length) {
        filtered = filtered.filter((idea) =>
            preferences.categories.includes((idea.category || "").toLowerCase())
        );
    }

    if (preferences?.tags?.length) {
        filtered = filtered.filter((idea) => {
            const ideaTags = (idea.tags || []).map((tag) => tag.toLowerCase());
            return preferences.tags.some((tag) => ideaTags.includes(tag));
        });
    }

    if (preferences?.cost) {
        filtered = filtered.filter((idea) => {
            if (preferences.cost === "free") return Number(idea.dollars) === 0;
            return Number(idea.dollars) > 0;
        });
    }

    return filtered;
};

// Functions to toggle between empty state and idea display
const showEmptyState = (message) => {
    resetCardPosition();

    if (randomizeEmptyMessage) {
        randomizeEmptyMessage.textContent = message;
        randomizeEmptyMessage.hidden = false;
    }

    if (randomizeEmptyState) {
        randomizeEmptyState.hidden = false;
    }

    if (randomizeSwipeStage) {
        randomizeSwipeStage.hidden = true;
    }

    if (randomizeCard) {
        randomizeCard.hidden = true;
    }

    if (randomizeActions) {
        randomizeActions.style.display = "none";
    }

    if (adjustPreferencesSection) {
        adjustPreferencesSection.style.display = currentPreferences ? "flex" : "none";
    }
};

const showIdeaState = () => {
    if (randomizeEmptyState) {
        randomizeEmptyState.hidden = true;
    }

    if (randomizeSwipeStage) {
        randomizeSwipeStage.hidden = false;
    }

    if (randomizeEmptyMessage) {
        randomizeEmptyMessage.hidden = true;
    }

    if (randomizeCard) {
        randomizeCard.hidden = false;
    }

    if (randomizeActions) {
        randomizeActions.style.display = "flex";
    }

    if (adjustPreferencesSection) {
        adjustPreferencesSection.style.display = "none";
    }
};

const showNextIdea = () => {
    const filteredIdeas = getFilteredIdeas(currentPreferences);
    const remainingIdeas = filteredIdeas.filter((idea) =>
        !remainingIdeaIds.includes(idea.id)
    );

    if (remainingIdeas.length === 0) {
        const message = currentPreferences
            ? "You're all out of ideas that match your preferences. Try adjusting your filters."
            : "You're all out of date ideas for now. Try again later or add your own!";

        showEmptyState(message);
        currentRandomIdea = null;
        return;
    }

    const randomIndex = Math.floor(Math.random() * remainingIdeas.length);
    currentRandomIdea = remainingIdeas[randomIndex];
    remainingIdeaIds.push(currentRandomIdea.id);
    isSwipingCard = false;

    showIdeaState();
    renderRandomizeIdea(currentRandomIdea);
};

// Randomize Modal Event Listeners
openRandomizeButton.addEventListener("click", async () => {
    currentPreferences = null;
    remainingIdeaIds = [];
    isSwipingCard = false;

    if (adjustPreferencesSection) {
        adjustPreferencesSection.style.display = "none";
    }

    allIdeas = await getAllIdeas();

    openModal(randomizeModal);
    showNextIdea();
});

randomizeRejectButton.addEventListener("click", () => {
    randomizeRejectButton.classList.remove("btn-click-animate");
    void randomizeRejectButton.offsetWidth;
    randomizeRejectButton.classList.add("btn-click-animate");

    flashSwipeFeedback("left");

    window.setTimeout(() => {
        randomizeRejectButton.classList.remove("btn-click-animate");
        animateSwipeOut("left");
    }, 140);
});

randomizeFavoriteButton.addEventListener("click", async () => {
    const heartPath = randomizeFavoriteButton.querySelector("svg path");

    if (heartPath) {
        heartPath.setAttribute("fill", "rgb(62,0,84)");
    }

    randomizeFavoriteButton.classList.remove("btn-click-animate");
    void randomizeFavoriteButton.offsetWidth;
    randomizeFavoriteButton.classList.add("btn-click-animate");

    flashSwipeFeedback("right");

    window.setTimeout(async () => {
        if (heartPath) {
            heartPath.setAttribute("fill", "none");
        }

        randomizeFavoriteButton.classList.remove("btn-click-animate");
        await animateSwipeOut("right");
    }, 140);
});
randomizeAddCalendarButton.addEventListener("click", () => {
    closeModal(randomizeModal);
    if (!currentRandomIdea) return;

    if (addEventTitle) addEventTitle.value = currentRandomIdea.title;
    if (addEventCategory) addEventCategory.value = currentRandomIdea.category || "";
    if (addEventLocation) addEventLocation.value = currentRandomIdea.address || "";

    if (addEventModal) {
        openModal(addEventModal);
    }
});

// Handle add event modal
if (cancelAddEventButton) {
    cancelAddEventButton.addEventListener("click", () => {
        closeModal(addEventModal);
        if (addEventForm) addEventForm.reset();
    });
}

if (addEventForm) {
    addEventForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const user = getCurrentUser();
        if (!user) return;

        const title = (addEventTitle?.value || "").trim();
        const date = (addEventDate?.value || "").trim();
        if (!title || !date) return;

        const newEvent = {
            title,
            date,
            time: (addEventTime?.value || "").trim(),
            location: (addEventLocation?.value || "").trim(),
            category: (addEventCategory?.value || "").trim(),
            partner: (addEventPartner?.value || "").trim(),
            notes: (addEventNotes?.value || "").trim(),
            dollars: 0
        };

        try {
            const eventsRef = collection(db, "users", user.uid, "events");
            await addDoc(eventsRef, newEvent);
            closeModal(addEventModal);
            if (addEventForm) addEventForm.reset();
        } catch (error) {
            console.error("Error adding event:", error);
        }
    });
}

// Preferences Modal
openPreferencesButton.addEventListener("click", () => {
    openModal(preferencesModal);
});

applyPreferencesButton.addEventListener("click", async () => {
    currentPreferences = getSelectedPreferences();
    remainingIdeaIds = [];
    isSwipingCard = false;

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