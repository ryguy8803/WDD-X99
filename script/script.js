
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { app } from '../firebase.js';

const db = getFirestore(app);
const auth = getAuth(app);
let allIdeas = [];
let currentUser = null;
let authReady = false;

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const userData = userSnap.data();
        saveProfile(userData);
    }
  }

  const currentPath = window.location.pathname;
  const protectedPaths = ['/c1_home.html', '/c2_randomize.html', '/c3_explore.html', '/c4_calendar.html'];
  const authPaths = ['/a2_login.html', '/a3_register.html'];

  if (!authReady) {
    authReady = true;
    initializeApp();
    if (!user && protectedPaths.some(p => currentPath.endsWith(p))) {
      window.location.href = 'a2_login.html';
    }
  }

  if (user && authPaths.some(p => currentPath.endsWith(p))) {
    if (currentPath.endsWith('/a3_register.html')) {
        window.location.href = 'b1_tutorial_1.html';
    } else {
        window.location.href = 'c1_home.html';
    }
  }
});

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error(error.code, error.message);
            alert(error.message);
        }
    });
}

const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = registerForm.username.value;
        const email = registerForm.email.value;
        const password = registerForm.password.value;
        const confirmPassword = registerForm['confirm-password'].value;

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, "users", user.uid), {
                username: username,
                email: email,
                favorites: []
            });
        } catch (error) {
            console.error(error.code, error.message);
            alert(error.message);
        }
    });
}


// ============================== Utilities ==============================
const createIdeaId = (title) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const getAllIdeas = () => allIdeas;

const getIdeaId = (idea) => idea.id || createIdeaId(idea.title);

async function getLikedIdeas() {
    if (!currentUser) return [];
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().favorites) {
        const favoriteIds = userSnap.data().favorites;
        if (favoriteIds.length === 0) return [];

        const likedIdeas = getAllIdeas().filter(idea => favoriteIds.includes(idea.id));
        return likedIdeas;
    }
    return [];
}

const buildDollarIcons = (count) => {
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < count; index += 1) {
        const icon = document.createElement("img");
        icon.src = "images/Dollar.svg";
        icon.alt = "$";
        fragment.appendChild(icon);
    }
    return fragment;
};

const findIdeaById = (ideaId) =>
    getAllIdeas().find((entry) => getIdeaId(entry) === ideaId);

const resolveIdeaFromStored = (item) => {
    if (typeof item === "string") {
        const idea = findIdeaById(item);
        return idea
            ? {
                  id: item,
                  title: idea.title,
                  description: idea.description,
                  image: idea.images?.[0] || "",
                  category: idea.category,
                  dollars: idea.dollars
              }
            : null;
    }

    if (item && typeof item === "object") {
        const fallback = findIdeaById(item.id);
        return {
            id: item.id,
            title: item.title || fallback?.title || "",
            description: item.description || fallback?.description || "",
            image: item.image || fallback?.images?.[0] || "",
            category: item.category || fallback?.category || "",
            dollars: Number(item.dollars ?? fallback?.dollars ?? 0)
        };
    }

    return null;
};

const setHeroImage = (heroImage, imageUrl, title) => {
    if (!heroImage) return;
    if (imageUrl) {
        heroImage.src = imageUrl;
        heroImage.alt = title || "";
    } else {
        heroImage.src =
            "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10' preserveAspectRatio='none'><rect width='10' height='10' fill='%23d9d9d9'/></svg>";
        heroImage.alt = "";
    }
};

// =========================== DOM References ============================
const modalOverlay = document.getElementById("add-idea-modal");
const openModalButton = document.getElementById("open-add-idea");
const closeModalButton = document.getElementById("close-add-idea");
const addIdeaForm = document.getElementById("add-idea-form");

const favoritesModal = document.getElementById("favorites-modal");
const openFavoritesButtons = document.querySelectorAll(
    "#open-favorites, .open-favorites"
);
const closeFavoritesButton = document.getElementById("close-favorites");

const userSettingsModal = document.getElementById("user-settings-modal");
const openUserSettingsButtons = document.querySelectorAll(".open-user-settings");
const closeUserSettingsButton = document.getElementById("close-user-settings");
const openEditAccountButtons = document.querySelectorAll(".open-edit-account");
const editAccountModal = document.getElementById("edit-account-modal");
const closeEditAccountButton = document.getElementById("close-edit-account");
const openEditAccountFormButton = document.getElementById(
    "open-edit-account-form"
);
const editAccountFormModal = document.getElementById("edit-account-form-modal");
const closeEditAccountFormButton = document.getElementById(
    "close-edit-account-form"
);
const cancelEditAccountFormButton = document.getElementById(
    "cancel-edit-account-form"
);
const deleteAccountButton = document.getElementById("delete-account");
const backEditAccountButton = document.getElementById("back-edit-account");
const backEditAccountFormButton = document.getElementById(
    "back-edit-account-form"
);
const userSettingsTitle = document.getElementById("user-settings-title");
const editAccountNameValue = document.getElementById("edit-account-name");
const editAccountUsernameValue = document.getElementById(
    "edit-account-username"
);
const editAccountForm = document.getElementById("edit-account-form");
const editNameInput = document.getElementById("edit-name");
const editUsernameInput = document.getElementById("edit-username");

const favoritesList = document.getElementById("favorites-list");
const favoritesTemplate = document.getElementById("favorites-card-template");

const openRandomizeButton = document.getElementById("open-randomize");
const openPreferencesButton = document.getElementById("open-preferences");
const randomizeModal = document.getElementById("randomize-modal");
const preferencesModal = document.getElementById("preferences-modal");
const closeRandomizeButton = document.getElementById("close-randomize");
const closePreferencesButton = document.getElementById("close-preferences");
const applyPreferencesButton = document.getElementById("apply-preferences");
const randomizeRejectButton = document.getElementById("randomize-reject");
const randomizeFavoriteButton = document.getElementById("randomize-favorite");
const randomizeCard = document.getElementById("randomize-idea-card");
const randomizeActions = document.getElementById("randomize-actions");
const randomizeEmptyMessage = document.getElementById("randomize-empty-message");
const randomizeHero = document.getElementById("randomize-idea-hero");
const randomizeTitle = document.getElementById("randomize-idea-title");
const randomizeDescription = document.getElementById(
    "randomize-idea-description"
);
const randomizeTag = document.getElementById("randomize-idea-tag");
const randomizePrice = document.getElementById("randomize-idea-price");
const randomizeAddCalendarButton = document.getElementById(
    "randomize-add-calendar"
);

const exploreSearchInput =
    document.getElementById("search") ||
    document.querySelector("input[name='search']");
const exploreSearchButton = document.getElementById("search-button");

const homeIdeaList = document.getElementById("home-idea-list");
const homeIdeaTemplate = document.getElementById("home-card-idea-template");
const homeFavoritesList = document.getElementById("home-favorites-list");
const homeFavoritesEmptyMessage = document.querySelector(".favorites");
const exploreIdeaList = document.getElementById("idea-list");
const exploreIdeaTemplate = document.getElementById("card-idea-template");

const calendarGrid = document.getElementById("calendar-grid");
const calendarMonthTitle = document.getElementById("calendar-month-title");
const calendarPrevButton = document.getElementById("calendar-prev");
const calendarNextButton = document.getElementById("calendar-next");
const upcomingDatesList = document.getElementById("upcoming-dates-list");
const openAddEventButton = document.getElementById("open-add-event");
const addEventModal = document.getElementById("add-event-modal");
const closeAddEventButton = document.getElementById("close-add-event");
const cancelAddEventButton = document.getElementById("cancel-add-event");
const editEventModal = document.getElementById("edit-event-modal");
const closeEditEventButton = document.getElementById("close-edit-event");
const deleteEditEventButton = document.getElementById("delete-edit-event");
const viewEventModal = document.getElementById("view-event-modal");
const closeViewEventButton = document.getElementById("close-view-event");
const deleteViewEventButton = document.getElementById("delete-view-event");
const viewEditEventButton = document.getElementById("view-edit-event");
const viewEventTitle = document.getElementById("view-event-title");
const viewEventCategory = document.getElementById("view-event-category");
const viewEventDate = document.getElementById("view-event-date");
const viewEventTime = document.getElementById("view-event-time");
const viewEventLocation = document.getElementById("view-event-location");
const viewEventNotes = document.getElementById("view-event-notes");
const viewEventPartner = document.getElementById("view-event-partner");
const editEventForm = document.getElementById("edit-event-form");
const editEventTitle = document.getElementById("edit-title");
const editEventDate = document.getElementById("edit-date");
const editEventTime = document.getElementById("edit-time");
const editEventLocation = document.getElementById("edit-location");
const editEventCategory = document.getElementById("edit-category");
const editEventPartner = document.getElementById("edit-partner");
const editEventNotes = document.getElementById("edit-notes");
const addEventForm = document.getElementById("add-event-form");
const addEventTitle = document.getElementById("event-title");
const addEventDate = document.getElementById("event-date");
const addEventTime = document.getElementById("event-time");
const addEventLocation = document.getElementById("event-location");
const addEventCategory = document.getElementById("event-category");
const addEventPartner = document.getElementById("your-date");
const addEventNotes = document.getElementById("event-notes");

const normalizeDateInput = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// ============================== Modals ================================
const openModal = (modal) => {
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
};

const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
};

const closeOnOverlayClick = (modal) => {
    if (!modal) return;
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
};

const readProfile = () => {
    const stored = localStorage.getItem("userProfile");
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (parsed && (parsed.name || parsed.username)) {
                return parsed;
            }
        } catch (error) {
            return null;
        }
    }

    return {
        name: editAccountNameValue?.textContent?.trim() || "",
        username: editAccountUsernameValue?.textContent?.trim() || ""
    };
};

const applyProfile = (profile) => {
    if (!profile) return;
    const name = profile.name || '';
    const username = profile.username || '';
    if (editAccountNameValue) editAccountNameValue.textContent = name;
    if (editAccountUsernameValue) {
        editAccountUsernameValue.textContent = username;
    }
    if (userSettingsTitle) userSettingsTitle.textContent = username;
    if (editNameInput) editNameInput.value = name;
    if (editUsernameInput) editUsernameInput.value = username;
};

const saveProfile = (profile) => {
    localStorage.setItem("userProfile", JSON.stringify(profile));
    applyProfile(profile);
};

applyProfile(readProfile());

if (openModalButton) {
    openModalButton.addEventListener("click", () => openModal(modalOverlay));
}

if (closeModalButton) {
    closeModalButton.addEventListener("click", () => closeModal(modalOverlay));
}

closeOnOverlayClick(modalOverlay);

const mapFirestoreDocToIdea = (doc) => {
    const data = doc.data();
    const id = doc.id;
    let dollars = 0;
    if (data.average_cost > 75) {
        dollars = 3;
    } else if (data.average_cost > 25) {
        dollars = 2;
    } else if (data.average_cost > 0) {
        dollars = 1;
    }

    return {
        id: id,
        title: data.activity_name,
        description: data.description,
        dollars: dollars,
        images: data.images || [],
        category: data.category || '',
        tags: data.tags || []
    }
}

if (addIdeaForm) {
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
            activity_name: name,
            description: description,
            average_cost: average_cost,
            category: category,
            images: [],
            tags: []
        };

        try {
            const docRef = await addDoc(collection(db, "activities"), newActivity);

            const newIdea = mapFirestoreDocToIdea({ id: docRef.id, data: () => newActivity });
            allIdeas.unshift(newIdea);

            document.dispatchEvent(new CustomEvent("ideas:updated"));

            addIdeaForm.reset();
            closeModal(modalOverlay);

        } catch (e) {
            console.error("Error adding document: ", e);
            alert("There was an error adding your date idea. Please try again.");
        }
    });
}

if (openFavoritesButtons.length) {
    openFavoritesButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (userSettingsModal) closeModal(userSettingsModal);
            openModal(favoritesModal);
        });
    });
}

if (closeFavoritesButton) {
    closeFavoritesButton.addEventListener("click", () =>
        closeModal(favoritesModal)
    );
}

closeOnOverlayClick(favoritesModal);

if (openUserSettingsButtons.length) {
    openUserSettingsButtons.forEach((button) => {
        button.addEventListener("click", () => openModal(userSettingsModal));
    });
}

if (closeUserSettingsButton) {
    closeUserSettingsButton.addEventListener("click", () =>
        closeModal(userSettingsModal)
    );
}

closeOnOverlayClick(userSettingsModal);

if (openEditAccountButtons.length) {
    openEditAccountButtons.forEach((button) => {
        button.addEventListener("click", () => {
            applyProfile(readProfile());
            closeModal(userSettingsModal);
            openModal(editAccountModal);
        });
    });
}

if (closeEditAccountButton) {
    closeEditAccountButton.addEventListener("click", () =>
        closeModal(editAccountModal)
    );
}

if (backEditAccountButton) {
    backEditAccountButton.addEventListener("click", () => {
        closeModal(editAccountModal);
        openModal(userSettingsModal);
    });
}

closeOnOverlayClick(editAccountModal);

if (openEditAccountFormButton) {
    openEditAccountFormButton.addEventListener("click", () => {
        applyProfile(readProfile());
        closeModal(editAccountModal);
        openModal(editAccountFormModal);
    });
}

if (closeEditAccountFormButton) {
    closeEditAccountFormButton.addEventListener("click", () =>
        closeModal(editAccountFormModal)
    );
}

if (cancelEditAccountFormButton) {
    cancelEditAccountFormButton.addEventListener("click", () => {
        closeModal(editAccountFormModal);
        openModal(editAccountModal);
    });
}

if (backEditAccountFormButton) {
    backEditAccountFormButton.addEventListener("click", () => {
        closeModal(editAccountFormModal);
        openModal(editAccountModal);
    });
}

if (deleteAccountButton) {
    deleteAccountButton.addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

if (editAccountForm) {
    editAccountForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const current = readProfile();
        const name = (editNameInput?.value || "").trim() || current.name;
        const username =
            (editUsernameInput?.value || "").trim() || current.username;

        saveProfile({ name, username });
        closeModal(editAccountFormModal);
        openModal(editAccountModal);
    });
}

closeOnOverlayClick(editAccountFormModal);

let currentRandomIdea = null;
let currentPreferences = null;
let remainingIdeaIds = [];
let currentPoolKey = "";

const renderRandomizeIdea = (idea) => {
    if (!idea) return;
    setHeroImage(randomizeHero, idea.images?.[0] || "", idea.title);
    if (randomizeTitle) randomizeTitle.textContent = idea.title;
    if (randomizeDescription) {
        randomizeDescription.textContent = idea.description || "";
    }
    if (randomizeTag) randomizeTag.textContent = idea.category || "";

    if (randomizePrice) {
        randomizePrice.innerHTML = "";
        if (idea.dollars > 0) {
            randomizePrice.appendChild(buildDollarIcons(idea.dollars));
        }
    }
};

const addIdeaToFavorites = (idea) => {
    if (!idea || !currentUser) return;
    const ideaId = getIdeaId(idea);
    const userRef = doc(db, "users", currentUser.uid);
    updateDoc(userRef, {
        favorites: arrayUnion(ideaId)
    }).then(() => {
        document.dispatchEvent(new CustomEvent("favorites:updated"));
    });
};

const getSelectedPreferences = () => {
    if (!preferencesModal) return null;

    const selectedCategories = Array.from(
        preferencesModal.querySelectorAll(".tag-button.is-active")
    ).map((button) => button.textContent.trim().toLowerCase());

    const getCheckedValue = (name) => {
        const input = preferencesModal.querySelector(
            `input[name='${name}']:checked`
        );
        return input ? input.value : "";
    };

    const requiredTags = [];
    const location = getCheckedValue("location");
    const energy = getCheckedValue("energy");
    const duration = getCheckedValue("duration");
    const cost = getCheckedValue("cost");

    if (location) {
        requiredTags.push(location === "indoors" ? "indoor" : "outdoor");
    }
    if (energy) {
        requiredTags.push(energy === "high-energy" ? "high energy" : "lazy");
    }
    if (duration) requiredTags.push(duration);

    if (selectedCategories.length === 0 && requiredTags.length === 0 && !cost) {
        return null;
    }

    return {
        categories: selectedCategories,
        tags: requiredTags,
        cost
    };
};

const getPoolIdeas = (preferences) => {
    let filtered = getAllIdeas();

    if (preferences?.categories?.length) {
        filtered = filtered.filter((idea) =>
            preferences.categories.includes((idea.category || "").toLowerCase())
        );
    }

    if (preferences?.tags?.length) {
        filtered = filtered.filter((idea) => {
            const ideaTags = (idea.tags || []).map((tag) => tag.toLowerCase());
            return preferences.tags.every((tag) => ideaTags.includes(tag));
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

const getPoolKey = (preferences) => {
    if (!preferences) return "all";
    const categories = [...(preferences.categories || [])].sort().join(",");
    const tags = [...(preferences.tags || [])].sort().join(",");
    const cost = preferences.cost || "";
    return `categories:${categories}|tags:${tags}|cost:${cost}`;
};

const showEmptyState = (message) => {
    if (randomizeEmptyMessage) {
        randomizeEmptyMessage.textContent = message;
        randomizeEmptyMessage.hidden = false;
    }
    if (randomizeCard) randomizeCard.hidden = true;
    if (randomizeActions) randomizeActions.hidden = true;
};

const showIdeaState = () => {
    if (randomizeEmptyMessage) randomizeEmptyMessage.hidden = true;
    if (randomizeCard) randomizeCard.hidden = false;
    if (randomizeActions) randomizeActions.hidden = false;
};

const showNextIdea = () => {
    const poolIdeas = getPoolIdeas(currentPreferences);
    const poolKey = getPoolKey(currentPreferences);

    if (poolKey !== currentPoolKey) {
        currentPoolKey = poolKey;
        remainingIdeaIds = poolIdeas.map((idea) => getIdeaId(idea));
    }

    const remainingIdeas = poolIdeas.filter((idea) =>
        remainingIdeaIds.includes(getIdeaId(idea))
    );

    if (remainingIdeas.length === 0) {
        const message = currentPreferences
            ? "You're all out of ideas that match your preferences. Try adjusting your filters."
            : "You're all out of date ideas for now. Try again later or add your own!";
        showEmptyState(message);
        currentRandomIdea = null;
        return;
    }

    const next =
        remainingIdeas[Math.floor(Math.random() * remainingIdeas.length)];
    currentRandomIdea = next;
    const nextId = getIdeaId(next);
    remainingIdeaIds = remainingIdeaIds.filter((id) => id !== nextId);
    showIdeaState();
    renderRandomizeIdea(next);
};

if (openRandomizeButton) {
    openRandomizeButton.addEventListener("click", () => {
        currentPreferences = null;
        currentPoolKey = "";
        remainingIdeaIds = [];
        openModal(randomizeModal);
        showNextIdea();
    });
}

if (openPreferencesButton) {
    openPreferencesButton.addEventListener("click", () =>
        openModal(preferencesModal)
    );
}

if (closeRandomizeButton) {
    closeRandomizeButton.addEventListener("click", () =>
        closeModal(randomizeModal)
    );
}

if (closePreferencesButton) {
    closePreferencesButton.addEventListener("click", () =>
        closeModal(preferencesModal)
    );
}

if (applyPreferencesButton) {
    applyPreferencesButton.addEventListener("click", () => {
        currentPreferences = getSelectedPreferences();
        closeModal(preferencesModal);
        openModal(randomizeModal);
        showNextIdea();
    });
}

if (randomizeRejectButton) {
    randomizeRejectButton.addEventListener("click", () => {
        showNextIdea();
    });
}

if (randomizeFavoriteButton) {
    randomizeFavoriteButton.addEventListener("click", () => {
        randomizeFavoriteButton.classList.remove("heart-flash");
        void randomizeFavoriteButton.offsetWidth;
        randomizeFavoriteButton.classList.add("heart-flash");
        window.setTimeout(() => {
            randomizeFavoriteButton.classList.remove("heart-flash");
        }, 600);
        addIdeaToFavorites(currentRandomIdea);
        showNextIdea();
    });
}

if (randomizeAddCalendarButton) {
    randomizeAddCalendarButton.addEventListener("click", () => {
        closeModal(randomizeModal);
        if (!currentRandomIdea) return;

        const pendingEvent = {
            title: currentRandomIdea.title,
            category: currentRandomIdea.category || "",
            dollars: currentRandomIdea.dollars || 0
        };

        localStorage.setItem(
            "pendingCalendarEvent",
            JSON.stringify(pendingEvent)
        );

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
}

closeOnOverlayClick(randomizeModal);
closeOnOverlayClick(preferencesModal);

// ======================= Toggleable Buttons ===========================
const toggleActive = async (element) => {
    const isActive = element.classList.toggle("is-active");
    element.setAttribute("aria-pressed", String(isActive));

    if (!element.classList.contains("heart-icon")) return;

    const defaultSrc = element.getAttribute("data-src");
    const activeSrc = element.getAttribute("data-active-src");
    if (defaultSrc && activeSrc) {
        element.src = isActive ? activeSrc : defaultSrc;
    }

    const ideaId = element.getAttribute("data-idea-id");
    if (!ideaId) return;

    if (!currentUser) {
        alert("Please log in to save your favorites.");
        element.classList.remove("is-active");
        element.setAttribute("aria-pressed", "false");
        if (defaultSrc) element.src = defaultSrc;
        return;
    }

    const userRef = doc(db, "users", currentUser.uid);

    try {
        if (isActive) {
            await updateDoc(userRef, {
                favorites: arrayUnion(ideaId)
            });
        } else {
            await updateDoc(userRef, {
                favorites: arrayRemove(ideaId)
            });
        }
        document.dispatchEvent(new CustomEvent("favorites:updated"));
    } catch (e) {
        console.error("Error updating favorites: ", e);
    }
};

document.addEventListener("click", (event) => {
    const target = event.target.closest(".tag-button, .heart-icon");
    if (target) {
        toggleActive(target);
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
        return;
    }

    const activeElement = document.activeElement;
    if (activeElement && activeElement.matches(".tag-button, .heart-icon")) {
        event.preventDefault();
        toggleActive(activeElement);
    }
});

// ========================== Favorites List ============================
const renderFavorites = async () => {
    if (!favoritesList || !favoritesTemplate) return;

    favoritesList.innerHTML = "";
    const likedIdeas = await getLikedIdeas();

    if (likedIdeas.length === 0) {
        const emptyState = document.createElement("p");
        emptyState.className = "favorites-empty";
        emptyState.textContent = "No favorites yet. Tap a heart to save one.";
        favoritesList.appendChild(emptyState);
        return;
    }

    likedIdeas.forEach((idea) => {
        if (!idea) return;

        const card = favoritesTemplate.content.cloneNode(true);
        const heroImage = card.querySelector(".hero");
        const title = card.querySelector("h3");
        const description = card.querySelector("p");
        const tag = card.querySelector(".tag");
        const priceLevel = card.querySelector(".price-level");
        const heartIcon = card.querySelector(".heart-icon");

        setHeroImage(heroImage, idea.image, idea.title);
        if (_title) _title.textContent = idea.title;
        if (description) description.textContent = idea.description;
        if (tag) tag.textContent = idea.category;

        if (priceLevel) {
            if (idea.dollars > 0) {
                priceLevel.appendChild(buildDollarIcons(idea.dollars));
            } else {
                priceLevel.remove();
            }
        }

        if (heartIcon) {
            heartIcon.setAttribute("data-idea-id", idea.id);
            heartIcon.setAttribute("data-title", idea.title);
            heartIcon.setAttribute("data-description", idea.description);
            heartIcon.setAttribute("data-image", idea.image);
            heartIcon.setAttribute("data-category", idea.category);
            heartIcon.setAttribute("data-dollars", String(idea.dollars));
            heartIcon.classList.add("is-active");
            heartIcon.setAttribute("aria-pressed", "true");
            heartIcon.src = heartIcon.getAttribute("data-active-src");
        }

        favoritesList.appendChild(card);
    });
};


// =========================== Idea Cards ===============================
const renderIdeaCards = (listElement, templateElement) => {
    renderIdeaCardsFromIdeas(listElement, templateElement, getAllIdeas());
};

const renderIdeaCardsFromIdeas = async (listElement, templateElement, ideas) => {
    if (!listElement || !templateElement) return;

    listElement.innerHTML = "";
    const likedIdeaIds = new Set((await getLikedIdeas()).map(idea => idea.id));

    ideas.forEach((idea) => {
        const ideaId = getIdeaId(idea);
        const card = templateElement.content.cloneNode(true);
        const heroImage = card.querySelector(".hero");
        const title = card.querySelector("h3");
        const description = card.querySelector("p");
        const tag = card.querySelector(".tag");
        const priceLevel = card.querySelector(".price-level");
        const heartIcon = card.querySelector(".heart-icon");

        setHeroImage(heroImage, idea.images?.[0] || "", idea.title);
        if (title) title.textContent = idea.title;
        if (description) description.textContent = idea.description;
        if (tag) tag.textContent = idea.category;

        if (priceLevel) {
            if (idea.dollars > 0) {
                priceLevel.appendChild(buildDollarIcons(idea.dollars));
            } else {
                priceLevel.remove();
            }
        }

        if (heartIcon) {
            heartIcon.setAttribute("data-idea-id", ideaId);
            heartIcon.setAttribute("data-title", idea.title);
            heartIcon.setAttribute("data-description", idea.description);
            heartIcon.setAttribute("data-image", idea.images?.[0] || "");
            heartIcon.setAttribute("data-category", idea.category);
            heartIcon.setAttribute("data-dollars", String(idea.dollars));
            if (likedIdeaIds.has(ideaId)) {
                heartIcon.classList.add("is-active");
                heartIcon.setAttribute("aria-pressed", "true");
                heartIcon.src = heartIcon.getAttribute("data-active-src");
            }
        }

        listElement.appendChild(card);
    });
};

const getExploreSelectedTags = () => {
    if (!exploreIdeaList) return [];
    const tags = Array.from(
        document.querySelectorAll(".tags .tag-button.is-active")
    ).map((button) => button.textContent.trim().toLowerCase());
    return tags;
};

const filterExploreIdeas = () => {
    if (!exploreIdeaList || !exploreIdeaTemplate) return;

    const query = (exploreSearchInput?.value || "").trim().toLowerCase();
    const selectedTags = getExploreSelectedTags();

    const filtered = getAllIdeas().filter((idea) => {
        const category = (idea.category || "").toLowerCase();
        const title = (idea.title || "").toLowerCase();
        const description = (idea.description || "").toLowerCase();

        const matchesQuery = query
            ? title.includes(query) ||
              description.includes(query) ||
              category.includes(query)
            : true;

        const matchesTags = selectedTags.length
            ? selectedTags.includes(category)
            : true;

        return matchesQuery && matchesTags;
    });

    renderIdeaCardsFromIdeas(exploreIdeaList, exploreIdeaTemplate, filtered);
};

document.addEventListener("ideas:updated", () => {
    renderIdeaCards(homeIdeaList, homeIdeaTemplate);
    renderIdeaCards(exploreIdeaList, exploreIdeaTemplate);
    filterExploreIdeas();
    renderHomeFavoritesPreview();
});

const defaultUpcomingDates = [];

const getEventId = (event) => `${event.date}-${event.title}`;

let activeEvent = null;

const readUpcomingDates = () => {
    const stored = localStorage.getItem("upcomingDates");
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        } catch (error) {
            return defaultUpcomingDates;
        }
    }
    return defaultUpcomingDates;
};

const saveUpcomingDates = (dates) => {
    localStorage.setItem("upcomingDates", JSON.stringify(dates));
};

const removeEventById = (eventId) => {
    if (!eventId) return;
    const filtered = readUpcomingDates().filter(
        (item) => getEventId(item) !== eventId
    );
    saveUpcomingDates(filtered);
    renderUpcomingDates();
    if (calendarCurrentMonth) {
        renderCalendar(calendarCurrentMonth);
    }
};

const formatMonthTitle = (date) =>
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const formatEventDate = (dateString, time) => {
    const date = new Date(`${dateString}T00:00:00`);
    const formatted = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
    return time ? `${formatted} at ${time}` : formatted;
};

const openViewEvent = (event) => {
    if (!event) return;
    activeEvent = event;
    if (viewEventTitle) viewEventTitle.textContent = event.title;
    if (viewEventCategory) viewEventCategory.textContent = event.category || "";
    if (viewEventDate) viewEventDate.textContent = formatEventDate(event.date);
    if (viewEventTime) viewEventTime.textContent = event.time || "";
    if (viewEventLocation) viewEventLocation.textContent = event.location || "";
    if (viewEventNotes) viewEventNotes.textContent = event.notes || "";
    if (viewEventPartner) viewEventPartner.textContent = event.partner || "";
    openModal(viewEventModal);
};

const openEditEvent = (event) => {
    if (!event) return;
    activeEvent = event;
    if (editEventTitle) editEventTitle.value = event.title;
    if (editEventDate) editEventDate.value = event.date;
    if (editEventTime) editEventTime.value = event.time || "";
    if (editEventLocation) editEventLocation.value = event.location || "";
    if (editEventCategory) {
        editEventCategory.value = (event.category || "").toLowerCase();
    }
    if (editEventPartner) editEventPartner.value = event.partner || "";
    if (editEventNotes) editEventNotes.value = event.notes || "";
    openModal(editEventModal);
};

const renderUpcomingDates = () => {
    if (!upcomingDatesList) return;
    const dates = readUpcomingDates();
    upcomingDatesList.innerHTML = "<h2>Upcoming Dates</h2>";

    if (dates.length === 0) {
        const empty = document.createElement("p");
        empty.className = "instruction-text";
        empty.textContent = "No upcoming dates yet. Add one to get started!";
        upcomingDatesList.appendChild(empty);
        return;
    }

    dates.forEach((event) => {
        const eventId = getEventId(event);
        const card = document.createElement("div");
        card.className = "card event-card";

        const header = document.createElement("div");
        header.className = "card-header";

        const titleWrap = document.createElement("div");
        titleWrap.className = "event-title";

        const title = document.createElement("h3");
        title.textContent = event.title;
        titleWrap.appendChild(title);

        if (event.dollars > 0) {
            titleWrap.appendChild(buildDollarIcons(event.dollars));
        }

        header.appendChild(titleWrap);

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-icon";
        editButton.setAttribute("aria-label", "Edit event");
        editButton.dataset.eventId = eventId;
        const editIcon = document.createElement("img");
        editIcon.src = "images/Edit.svg";
        editIcon.alt = "Edit";
        editButton.appendChild(editIcon);
        header.appendChild(editButton);
        card.appendChild(header);

        const details = document.createElement("div");
        details.className = "event-details";

        const textWrap = document.createElement("div");
        const timeEl = document.createElement("p");
        timeEl.className = "event-time";
        timeEl.textContent = formatEventDate(event.date, event.time);
        const locationEl = document.createElement("p");
        locationEl.className = "event-location";
        locationEl.textContent = event.location || "";
        textWrap.appendChild(timeEl);
        textWrap.appendChild(locationEl);

        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = event.category || "";

        details.appendChild(textWrap);
        details.appendChild(tag);
        card.appendChild(details);

        upcomingDatesList.appendChild(card);
    });
};

const renderCalendar = (date) => {
    if (!calendarGrid || !calendarMonthTitle) return;
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    calendarMonthTitle.textContent = formatMonthTitle(date);

    const headerCells = Array.from(
        calendarGrid.querySelectorAll(".day-name")
    );
    calendarGrid.innerHTML = "";
    headerCells.forEach((cell) => calendarGrid.appendChild(cell));

    for (let index = 0; index < startWeekday; index += 1) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-day empty";
        calendarGrid.appendChild(emptyCell);
    }

    const events = readUpcomingDates();
    const eventMap = new Map();
    events.forEach((event) => {
        eventMap.set(event.date, event);
    });

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day += 1) {
        const cell = document.createElement("div");
        cell.className = "calendar-day";
        const dayLabel = document.createElement("span");
        dayLabel.textContent = String(day);
        cell.appendChild(dayLabel);

        const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
            day
        ).padStart(2, "0")}`;

        if (
            year === today.getFullYear() &&
            month === today.getMonth() &&
            day === today.getDate()
        ) {
            dayLabel.classList.add("circle-highlight");
        }

        if (eventMap.has(dateKey)) {
            const pill = document.createElement("button");
            pill.type = "button";
            pill.className = "event-pill";
            pill.textContent = `${eventMap.get(dateKey).title.slice(0, 2)}...`;
            pill.dataset.eventId = getEventId(eventMap.get(dateKey));
            cell.appendChild(pill);
        }

        calendarGrid.appendChild(cell);
    }
};

let calendarCurrentMonth = null;

if (calendarGrid && calendarMonthTitle) {
    let currentMonth = new Date();
    calendarCurrentMonth = currentMonth;
    renderCalendar(currentMonth);
    renderUpcomingDates();

    if (calendarPrevButton) {
        calendarPrevButton.addEventListener("click", () => {
            currentMonth = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1
            );
            calendarCurrentMonth = currentMonth;
            renderCalendar(currentMonth);
        });
    }

    if (calendarNextButton) {
        calendarNextButton.addEventListener("click", () => {
            currentMonth = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
            );
            calendarCurrentMonth = currentMonth;
            renderCalendar(currentMonth);
        });
    }
}

if (openAddEventButton) {
    openAddEventButton.addEventListener("click", () => openModal(addEventModal));
}

if (closeAddEventButton) {
    closeAddEventButton.addEventListener("click", () =>
        closeModal(addEventModal)
    );
}

if (cancelAddEventButton) {
    cancelAddEventButton.addEventListener("click", () =>
        closeModal(addEventModal)
    );
}

if (addEventForm) {
    addEventForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const title = (addEventTitle?.value || "").trim();
        const rawDate = (addEventDate?.value || "").trim();
        const date = normalizeDateInput(rawDate);
        if (!title || !date) return;

        const newEvent = {
            title,
            date,
            time: (addEventTime?.value || "").trim(),
            location: (addEventLocation?.value || "").trim(),
            category: (addEventCategory?.value || "").trim(),
            partner: (addEventPartner?.value || "").trim(),
            notes: (addEventNotes?.value || "").trim(),
            dollars: currentRandomIdea?.dollars || 0
        };

        const updated = [...readUpcomingDates(), newEvent];
        saveUpcomingDates(updated);
        renderUpcomingDates();
        if (calendarCurrentMonth) {
            renderCalendar(calendarCurrentMonth);
        }
        closeModal(addEventModal);
        addEventForm.reset();
    });
}

if (editEventForm) {
    editEventForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!activeEvent) return;

        const title = (editEventTitle?.value || "").trim();
        const rawDate = (editEventDate?.value || "").trim();
        const date = normalizeDateInput(rawDate);
        if (!title || !date) return;

        const updatedEvent = {
            ...activeEvent,
            title,
            date,
            time: (editEventTime?.value || "").trim(),
            location: (editEventLocation?.value || "").trim(),
            category: (editEventCategory?.value || "").trim(),
            partner: (editEventPartner?.value || "").trim(),
            notes: (editEventNotes?.value || "").trim()
        };

        const eventId = getEventId(activeEvent);
        const updated = readUpcomingDates().map((item) =>
            getEventId(item) === eventId ? updatedEvent : item
        );
        saveUpcomingDates(updated);
        renderUpcomingDates();
        if (calendarCurrentMonth) {
            renderCalendar(calendarCurrentMonth);
        }
        activeEvent = updatedEvent;
        closeModal(editEventModal);
    });
}

if (addEventModal) {
    const pending = localStorage.getItem("pendingCalendarEvent");
    if (pending) {
        try {
            const parsed = JSON.parse(pending);
            openModal(addEventModal);
            if (addEventTitle) addEventTitle.value = parsed.title || "";
            if (addEventCategory) {
                addEventCategory.value = (parsed.category || "")
                    .toLowerCase()
                    .replace(/\s+/g, "-");
            }
        } catch (error) {
            // ignore
        }
        localStorage.removeItem("pendingCalendarEvent");
    }
}

if (closeEditEventButton) {
    closeEditEventButton.addEventListener("click", () =>
        closeModal(editEventModal)
    );
}

if (deleteEditEventButton) {
    deleteEditEventButton.addEventListener("click", () => {
        if (!activeEvent) return;
        removeEventById(getEventId(activeEvent));
        activeEvent = null;
        closeModal(editEventModal);
    });
}

if (closeViewEventButton) {
    closeViewEventButton.addEventListener("click", () =>
        closeModal(viewEventModal)
    );
}

if (deleteViewEventButton) {
    deleteViewEventButton.addEventListener("click", () => {
        if (!activeEvent) return;
        removeEventById(getEventId(activeEvent));
        activeEvent = null;
        closeModal(viewEventModal);
    });
}

if (viewEditEventButton) {
    viewEditEventButton.addEventListener("click", () => {
        closeModal(viewEventModal);
        openEditEvent(activeEvent);
    });
}

closeOnOverlayClick(addEventModal);
closeOnOverlayClick(editEventModal);
closeOnOverlayClick(viewEventModal);

if (upcomingDatesList) {
    upcomingDatesList.addEventListener("click", (event) => {
        const button = event.target.closest(".edit-icon");
        if (!button) return;
        const eventId = button.dataset.eventId;
        const match = readUpcomingDates().find(
            (item) => getEventId(item) === eventId
        );
        if (match) {
            openEditEvent(match);
        }
    });
}

if (calendarGrid) {
    calendarGrid.addEventListener("click", (event) => {
        const pill = event.target.closest(".event-pill");
        if (!pill) return;
        const eventId = pill.dataset.eventId;
        const match = readUpcomingDates().find(
            (item) => getEventId(item) === eventId
        );
        if (match) {
            openViewEvent(match);
        }
    });
}

if (exploreSearchInput) {
    exploreSearchInput.addEventListener("input", () => {
        filterExploreIdeas();
    });
}

if (exploreSearchButton) {
    exploreSearchButton.addEventListener("click", () => {
        filterExploreIdeas();
    });
}

document.addEventListener("click", (event) => {
    if (event.target.closest(".tags .tag-button")) {
        filterExploreIdeas();
    }
});

// ====================== Home Favorites Preview ========================
const renderHomeFavoritesPreview = async () => {
    if (!homeFavoritesList || !homeIdeaTemplate) return;

    homeFavoritesList.innerHTML = "";
    const likedIdeas = await getLikedIdeas();

    if (likedIdeas.length === 0) {
        homeFavoritesList.hidden = true;
        if (homeFavoritesEmptyMessage) {
            homeFavoritesEmptyMessage.hidden = false;
        }
        return;
    }

    homeFavoritesList.hidden = false;
    if (homeFavoritesEmptyMessage) {
        homeFavoritesEmptyMessage.hidden = true;
    }

    likedIdeas.forEach((idea) => {
        if (!idea) return;

        const card = homeIdeaTemplate.content.cloneNode(true);
        const heroImage = card.querySelector(".hero");
        const title = card.querySelector("h3");
        const description = card.querySelector("p");
        const tag = card.querySelector(".tag");
        const priceLevel = card.querySelector(".price-level");
        const heartIcon = card.querySelector(".heart-icon");

        setHeroImage(heroImage, idea.image, idea.title);
        if (title) title.textContent = idea.title;
        if (description) description.textContent = idea.description;
        if (tag) tag.textContent = idea.category;

        if (priceLevel) {
            if (idea.dollars > 0) {
                priceLevel.appendChild(buildDollarIcons(idea.dollars));
            } else {
                priceLevel.remove();
            }
        }

        if (heartIcon) {
            heartIcon.setAttribute("data-idea-id", idea.id);
            heartIcon.setAttribute("data-title", idea.title);
            heartIcon.setAttribute("data-description", idea.description);
            heartIcon.setAttribute("data-image", idea.image);
            heartIcon.setAttribute("data-category", idea.category);
            heartIcon.setAttribute("data-dollars", String(idea.dollars));
            heartIcon.classList.add("is-active");
            heartIcon.setAttribute("aria-pressed", "true");
            heartIcon.src = heartIcon.getAttribute("data-active-src");
        }

        homeFavoritesList.appendChild(card);
    });
};

document.addEventListener("favorites:updated", async () => { 
    await renderFavorites();
    await renderHomeFavoritesPreview();
});

async function initializeApp() {
    try {
        const activitiesCol = collection(db, 'activities');
        const activitySnapshot = await getDocs(activitiesCol);
        allIdeas = activitySnapshot.docs.map(mapFirestoreDocToIdea);
    } catch(e) {
        console.error("Error fetching ideas from Firestore: ", e);
    }

    renderFavorites();
    renderHomeFavoritesPreview();
    renderIdeaCards(homeIdeaList, homeIdeaTemplate);
    renderIdeaCards(exploreIdeaList, exploreIdeaTemplate);
    filterExploreIdeas();
}
