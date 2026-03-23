import { createIdeaCardHTML, toggleLike, getAllIdeas, showIdeaDetail, auth, db, openModal, closeModal, initializeModal } from "./script.js";
import { updateDoc, addDoc, collection, serverTimestamp, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
import "./auth.js";

// ============================== SHARED ACCOUNT / FAVORITES MODALS ==============================
const userSettingsModal = initializeModal("user-settings-modal", {
    openButtonSelector: ".open-user-settings",
    closeButtonSelector: "#close-user-settings"
});

const editAccountModal = initializeModal("edit-account-modal", {
    closeButtonSelector: "#close-edit-account"
});

const editAccountFormModal = initializeModal("edit-account-form-modal", {
    closeButtonSelector: "#close-edit-account-form"
});

initializeModal("favorites-modal", {
    openButtonSelector: ".open-favorites",
    closeButtonSelector: "#close-favorites"
});

const openEditAccountButton = document.querySelector(".open-edit-account");
const backEditAccountButton = document.getElementById("back-edit-account");
const openEditAccountFormButton = document.getElementById("open-edit-account-form");
const backEditAccountFormButton = document.getElementById("back-edit-account-form");
const cancelEditAccountFormButton = document.getElementById("cancel-edit-account-form");

if (openEditAccountButton) {
    openEditAccountButton.addEventListener("click", () => {
        closeModal(document.getElementById("user-settings-modal"));
        openModal(document.getElementById("edit-account-modal"));
    });
}

if (backEditAccountButton) {
    backEditAccountButton.addEventListener("click", () => {
        closeModal(document.getElementById("edit-account-modal"));
        openModal(document.getElementById("user-settings-modal"));
    });
}

if (openEditAccountFormButton) {
    openEditAccountButton?.addEventListener;
    openEditAccountFormButton.addEventListener("click", () => {
        closeModal(document.getElementById("edit-account-modal"));
        openModal(document.getElementById("edit-account-form-modal"));
    });
}

if (backEditAccountFormButton) {
    backEditAccountFormButton.addEventListener("click", () => {
        closeModal(document.getElementById("edit-account-form-modal"));
        openModal(document.getElementById("edit-account-modal"));
    });
}

if (cancelEditAccountFormButton) {
    cancelEditAccountFormButton.addEventListener("click", () => {
        closeModal(document.getElementById("edit-account-form-modal"));
        openModal(document.getElementById("edit-account-modal"));
    });
}

// Elements
const exploreSearchInput = document.querySelector("input[name='search']");
const exploreIdeaList = document.getElementById("idea-list");
const generateIdeasButton = document.getElementById('generate-ideas-button');
const locationPromptMessage = document.getElementById('location-prompt-message');
const filterLocationSelect = document.getElementById('filter-location');
const filterPriceSelect = document.getElementById('filter-price');

// ** IMPORTANT: Add your new, valid Gemini API key here, INSIDE the quotes **
const API_KEY = "AIzaSyCqTqGfn6AjJ_7h_YSyiftsqD8qkzz-YHc";

const getSelectedTags = () => {
    return Array.from(
        document.querySelectorAll(".tags .tag-button.is-active")
    ).map((button) => button.textContent.trim());
};

const renderExploreIdeas = async (ideas, method = "replace") => {
    if (!exploreIdeaList) return;

    if (ideas.length === 0 && method === "replace") {
        exploreIdeaList.innerHTML = '<p style="text-align: center; color: var(--gray-50); padding: var(--large-spacing);">No ideas found. Try generating some with AI!</p>';
        return;
    }

    if (method === "replace") {
        exploreIdeaList.innerHTML = "";
    }

    const cardHTMLPromises = ideas.map(idea => createIdeaCardHTML(idea));
    const cardHTMLs = await Promise.all(cardHTMLPromises);

    const fragment = document.createDocumentFragment();

    cardHTMLs.forEach((cardHTML, index) => {
        const idea = ideas[index];
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = cardHTML;
        const card = tempDiv.firstElementChild;

        card.addEventListener("click", (e) => {
            if (e.target.closest(".heart-icon")) return;
            showIdeaDetail(idea);
        });

        fragment.appendChild(card);
    });

    if (method === "prepend") {
        exploreIdeaList.prepend(fragment);
    } else {
        exploreIdeaList.appendChild(fragment);
    }
};


// Populate location dropdown with unique locations from the database
const populateLocationFilter = async () => {
    if (!filterLocationSelect) return;
    const allIdeas = await getAllIdeas();
    const locations = [...new Set(allIdeas.map(i => i.location).filter(Boolean))];
    locations.sort();

    // Keep the "All Locations" default, clear the rest, then add options
    filterLocationSelect.innerHTML = '<option value="">All Locations</option>';
    locations.forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc;
        opt.textContent = loc;
        filterLocationSelect.appendChild(opt);
    });
};

// Filter and display ideas based on search, tags, location, and price
const filterExploreIdeas = async () => {
    const query = (exploreSearchInput?.value || "").trim().toLowerCase();
    const selectedTags = getSelectedTags();

    let ideas = await getAllIdeas({ categories: selectedTags, query: query });

    // Filter by location dropdown
    const selectedLocation = filterLocationSelect?.value || '';
    if (selectedLocation) {
        ideas = ideas.filter(idea => idea.location === selectedLocation);
    }

    // Filter by price dropdown
    const selectedPrice = filterPriceSelect?.value || '';
    if (selectedPrice !== '') {
        const priceNum = Number(selectedPrice);
        ideas = ideas.filter(idea => idea.dollars === priceNum);
    }

    await renderExploreIdeas(ideas);
};

async function generateIdeas() {
    const user = auth.currentUser;

    if (!user) {
        locationPromptMessage.textContent = "Please log in to generate ideas with AI.";
        locationPromptMessage.classList.remove("hidden-style");
        return;
    }

    if (!API_KEY || API_KEY === "YOUR_API_KEY") {
        locationPromptMessage.textContent = "API key not found. Please add your valid API key to script/explore.js.";
        locationPromptMessage.classList.remove("hidden-style");
        return;
    }

    if (!navigator.geolocation) {
        locationPromptMessage.textContent = "Geolocation is not supported by this browser.";
        locationPromptMessage.classList.remove("hidden-style");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { location: { latitude, longitude } });

            locationPromptMessage.textContent = "Generating ideas near you...";
            locationPromptMessage.classList.remove("hidden-style");

            try {
                const genAI = new GoogleGenerativeAI(API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                const prompt = `
                    Suggest 10 unique date ideas near latitude: ${latitude}, longitude: ${longitude}.
                    For each idea, provide a name, location, description, category, price (using $, $$, or $$$), a link to the website, and an image URL.
                    For the image URL, use "images/Logo_wide.jpg".
                    Use only the following categories: Fitness, Food & Drink, Creative, Games, Learning & Culture, Nature.
                    Use the following pricing system: $ for 5-10 dollars per person, $$ for 10-20 dollars per person, and $$$ for above 20 dollars per person.
                    Return the response as a valid JSON array of objects. Do not include any text outside of the JSON array.
                `;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                const regex = /\`\`\`json\n([\s\S]*?)\n\`\`\`/;
                const match = text.match(regex);
                const jsonText = match ? match[1].trim() : text.trim();
                const generatedIdeas = JSON.parse(jsonText);

                const savedIdeas = [];
                const activitiesCollection = collection(db, "activities");

                for (const idea of generatedIdeas) {
                    const newActivity = {
                        title: idea.name,
                        description: idea.description,
                        dollars: idea.price.length,
                        category: idea.category,
                        image: idea.image,
                        website: idea.website,
                        location: idea.location,
                        tags: [],
                        userId: user.uid,
                        createdAt: serverTimestamp(),
                        likedBy: []
                    };

                    const docRef = await addDoc(activitiesCollection, newActivity);

                    savedIdeas.push({
                        ...idea,
                        id: docRef.id,
                        likedBy: []
                    });
                }

                await renderExploreIdeas(savedIdeas, "prepend");
                locationPromptMessage.textContent = "Success! Here are your new ideas.";
            } catch (error) {
                console.error("AI generation error:", error);
                locationPromptMessage.textContent = "Sorry, we couldn't generate ideas. Check the console for errors.";
            } finally {
                setTimeout(() => {
                    locationPromptMessage.classList.add("hidden-style");
                }, 3000);
            }
        },
        () => {
            locationPromptMessage.textContent = "Please enable location to generate ideas with AI.";
            locationPromptMessage.classList.remove("hidden-style");
        }
    );
}

// Populate location filter then do initial render
populateLocationFilter();
filterExploreIdeas();

if (exploreSearchInput) {
    exploreSearchInput.addEventListener("input", filterExploreIdeas);
}

if (generateIdeasButton) {
    generateIdeasButton.addEventListener("click", generateIdeas);
}

// Dropdown filter listeners
if (filterLocationSelect) {
    filterLocationSelect.addEventListener('change', filterExploreIdeas);
}
if (filterPriceSelect) {
    filterPriceSelect.addEventListener('change', filterExploreIdeas);
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

        const allHeartsForIdea = document.querySelectorAll(`[data-idea-id="${ideaId}"]`);
        allHeartsForIdea.forEach(heartIcon => {
            heartIcon.src = isNowLiked ? "images/HeartFilled.svg" : "images/Heart.svg";
            heartIcon.classList.toggle("is-active", isNowLiked);
        });
    }
});