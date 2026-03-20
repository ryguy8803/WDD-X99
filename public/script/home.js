import { createIdeaCardHTML, getLikedIdeas, toggleLike, openModal, closeModal, initializeModal, getAllIdeas, db, auth, showIdeaDetail } from "./script.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import "./auth.js";

const storage = getStorage();


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

    const tags = [];
    if (location) tags.push(location);
    if (energy) tags.push(energy);
    if (duration) tags.push(duration);

    try {
        let imageUrl = "";

        if (imageFile && imageFile.size > 0) {
            const fileName = `${Date.now()}_${imageFile.name}`;
            const storageRef = ref(storage, `activity-images/${fileName}`);

            await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(storageRef);
        }

        const newActivity = {
            title: name,
            description,
            dollars: priceValue,
            category,
            image: imageUrl,
            tags
        };

        await addDoc(collection(db, "activities"), newActivity);

        await renderHomeIdeas();

        addIdeaForm.reset();
        closeModal(addIdeaModal.element);

    } catch (e) {
        alert("There was an error adding your date idea.");
    }
});