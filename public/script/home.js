import { createIdeaCardHTML, getLikedIdeas, toggleLike, openModal, closeModal, initializeModal, getAllIdeas, db, auth, showIdeaDetail, getCurrentUser, initializeTimeInputs } from "./script.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import "./auth.js";


// -------------------- RENDER FUNCTIONS --------------------

async function renderHomeIdeas() {
    const container = document.getElementById("home-idea-list");
    container.innerHTML = "";

    const allIdeas = await getAllIdeas();
    const shuffled = allIdeas.sort(() => 0.5 - Math.random());
    const randomIdeas = shuffled.slice(0, 7);

    for (const idea of randomIdeas) {
        const cardHTML = await createIdeaCardHTML(idea);

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHTML;
        const card = tempDiv.firstElementChild;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.heart-icon')) return;
            showIdeaDetail(idea);
        });

        container.appendChild(card);
    }
}

async function renderHomeFavoritesPreview() {
    const container = document.getElementById("home-favorites-list");
    const emptyMessage = document.querySelector(".favorites");

    container.innerHTML = "";

    const likedIds = await getLikedIdeas();

    if (likedIds.length === 0) {
        emptyMessage.hidden = false;
        container.hidden = true;
        return;
    }

    emptyMessage.hidden = true;
    container.hidden = false;

    const allIdeas = await getAllIdeas();
    const likedIdeas = allIdeas.filter(idea => likedIds.includes(idea.id));

    for (const idea of likedIdeas) {
        const cardHTML = await createIdeaCardHTML(idea);

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHTML;
        const card = tempDiv.firstElementChild;

        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            if (e.target.closest('.heart-icon')) return;
            showIdeaDetail(idea);
        });

        container.appendChild(card);
    }
}


// -------------------- MODALS --------------------

// Add Idea
const addIdeaModal = initializeModal("add-idea-modal", {
    openButtonSelector: "#open-add-idea",
    closeButtonSelector: "#close-add-idea"
});

const addIdeaConfirmModal = initializeModal("add-idea-confirm-modal", {
    closeButtonSelector: "#close-add-idea-confirm"
});
const addIdeaConfirmModalEl = document.getElementById("add-idea-confirm-modal");
const addIdeaModalEl = document.getElementById("add-idea-modal");

// ✅ USER SETTINGS (FIXED BUG)
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


// -------------------- MODAL NAVIGATION --------------------

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


// -------------------- AUTH --------------------

onAuthStateChanged(auth, (user) => {
    if (user) {
        renderHomeIdeas();
        renderHomeFavoritesPreview();
    }
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        renderHomeFavoritesPreview();
    }
});


// -------------------- HEART HANDLING --------------------

document.addEventListener("click", async (event) => {
    const heart = event.target.closest(".heart-icon");
    if (!heart) return;

    const ideaId = heart.getAttribute("data-idea-id");
    const isNowLiked = await toggleLike(ideaId);

    const allHearts = document.querySelectorAll(`[data-idea-id="${ideaId}"]`);
    allHearts.forEach(icon => {
        if (isNowLiked) {
            icon.src = "images/HeartFilled.svg";
            icon.classList.add("is-active");
        } else {
            icon.src = "images/Heart.svg";
            icon.classList.remove("is-active");
        }
    });

    await renderHomeFavoritesPreview();
});


// -------------------- ADD IDEA --------------------

const addIdeaForm = document.getElementById("add-idea-form");
const addIdeaConfirmMessage = document.getElementById("add-idea-confirm-message");
const cancelAddIdeaConfirmButton = document.getElementById("cancel-add-idea-confirm");
const confirmAddIdeaButton = document.getElementById("confirm-add-idea");

addIdeaForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(addIdeaForm);
    const name = String(formData.get("name") || "").trim();

    if (!name) {
        alert("Please enter a title for your suggestion.");
        return;
    }

    if (addIdeaConfirmMessage) {
        addIdeaConfirmMessage.textContent = `Are you sure you want to submit "${name}" as a suggestion?`;
    }

    closeModal(addIdeaModalEl);
    openModal(addIdeaConfirmModalEl);
});

if (cancelAddIdeaConfirmButton) {
    cancelAddIdeaConfirmButton.addEventListener("click", () => {
        closeModal(addIdeaConfirmModalEl);
        openModal(addIdeaModalEl);
    });
}

if (confirmAddIdeaButton) {
    confirmAddIdeaButton.addEventListener("click", async () => {
        const user = getCurrentUser();
        if (!user) {
            alert("Please log in to submit a suggestion.");
            return;
        }

        const formData = new FormData(addIdeaForm);

        const title = String(formData.get("name") || "").trim();
        const website = String(formData.get("website") || "").trim();
        const notes = String(formData.get("notes") || "").trim();

        try {
            await addDoc(collection(db, "suggestions"), {
                title,
                website,
                notes,
                userId: user.uid,
                createdAt: new Date().toISOString()
            });

            addIdeaForm.reset();
            closeModal(addIdeaConfirmModalEl);

            alert("Your suggestion has been submitted for review!");

        } catch (e) {
            console.error("Error submitting suggestion:", e);
            alert("There was an error submitting your suggestion.");
        }
    });
}

// ============================== ADD EVENT TO CALENDAR ==============================
const addEventModal = initializeModal("add-event-modal", {
    closeButtonSelector: "#close-add-event"
});
const addEventModalEl = document.getElementById("add-event-modal");
const addEventForm = document.getElementById("add-event-form");
const cancelAddEventBtn = document.getElementById("cancel-add-event");

const addEventConfirmModalEl = document.getElementById("add-event-confirm-modal");
const addEventConfirmMsg = document.getElementById("add-event-confirm-message");
const cancelAddEventConfirmBtn = document.getElementById("cancel-add-event-confirm");
const confirmAddEventBtn = document.getElementById("confirm-add-event");

initializeModal("add-event-confirm-modal", {
    closeButtonSelector: "#close-add-event-confirm"
});

const addTimeInputs = initializeTimeInputs(
    "event-time",
    "event-hour",
    "event-minute",
    "event-period"
);

if (cancelAddEventBtn) {
    cancelAddEventBtn.addEventListener("click", () => {
        closeModal(addEventModalEl);
        if (addEventForm) addEventForm.reset();
    });
}

if (addEventForm) {
    addEventForm.addEventListener("submit", (event) => {
        event.preventDefault();

        addTimeInputs?.syncHiddenValue();

        const title = (document.getElementById("event-title")?.value || "").trim();
        const date = (document.getElementById("event-date")?.value || "").trim();
        if (!title || !date) return;

        if (addEventConfirmMsg) {
            addEventConfirmMsg.textContent = `Are you sure you want to add "${title}" to your calendar?`;
        }

        closeModal(addEventModalEl);
        openModal(addEventConfirmModalEl);
    });
}

if (cancelAddEventConfirmBtn) {
    cancelAddEventConfirmBtn.addEventListener("click", () => {
        closeModal(addEventConfirmModalEl);
        openModal(addEventModalEl);
    });
}

if (confirmAddEventBtn) {
    confirmAddEventBtn.addEventListener("click", async () => {
        const user = getCurrentUser();
        if (!user) return;

        const newEvent = {
            title: (document.getElementById("event-title")?.value || "").trim(),
            date: (document.getElementById("event-date")?.value || "").trim(),
            time: (document.getElementById("event-time")?.value || "").trim(),
            location: (document.getElementById("event-location")?.value || "").trim(),
            category: (document.getElementById("event-category")?.value || "").trim(),
            partner: (document.getElementById("your-date")?.value || "").trim(),
            notes: (document.getElementById("event-notes")?.value || "").trim()
        };

        const ideaId = (document.getElementById("event-idea-id")?.value || "").trim();
        if (ideaId) newEvent.ideaId = ideaId;

        try {
            await addDoc(collection(db, "users", user.uid, "events"), newEvent);
            closeModal(addEventConfirmModalEl);
            if (addEventForm) addEventForm.reset();
        } catch (error) {
            console.error("Error adding event:", error);
        }
    });
}