import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { app } from '../../firebase.js';

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
    if (!user && protectedPaths.includes(currentPath)) {
      window.location.href = 'a2_login.html';
    }
  } else {
    await renderFavorites();
    await renderHomeFavoritesPreview();
  }

  if (user && (authPaths.includes(currentPath) || currentPath === '/')) {
    window.location.href = 'c1_home.html';
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
            window.location.href = 'c1_home.html';
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
            window.location.href = 'b1_tutorial_1.html';
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


// Modals ----------------------------------------------------------------------------------------------
export const openModal = (modal) => {
    if (!modal) return;
    modal.classList.add("is-open");
};

export const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove("is-open");
};

export const closeOnOverlayClick = (modal) => {
    if (!modal) return;
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
};

// Utilites ----------------------------------------------------------------------------------------------

// Creates dollar sign icons based on price level (1, 2, or 3)
export function renderDollarSigns(count) {
    let dollarHTML = "";
    for (let i = 0; i < count; i++) {
        dollarHTML += `<img src="images/Dollar.svg" alt="$">`;
    }
    return dollarHTML;
}

// Liked Ideas Management ----------------------------------------------------------------------------------------------

// Gets the list of liked idea IDs from localStorage
export function getLikedIdeas() {
    const stored = localStorage.getItem("likedIdeas");
    if (!stored) return [];
    return JSON.parse(stored); // Returns array of ID numbers like [1, 5, 12]
}

// Saves the liked IDs array to localStorage
export function saveLikedIdeas(likedIds) {
    localStorage.setItem("likedIdeas", JSON.stringify(likedIds));
}

// Checks if an idea is liked by the user
export function isIdeaLiked(ideaId) {
    const likedIds = getLikedIdeas();
    return likedIds.includes(ideaId);
}

// Toggles a like on/off for an idea
export function toggleLike(ideaId) {
    const likedIds = getLikedIdeas();
    
    if (likedIds.includes(ideaId)) {
        // Remove from liked array
        const newLikedIds = likedIds.filter(id => id !== ideaId);
        saveLikedIdeas(newLikedIds);
        return false; // Now unliked
    } else {
        // Add to liked array
        likedIds.push(ideaId);
        saveLikedIdeas(likedIds);
        return true; // Now liked
    }
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

// Card Template ----------------------------------------------------------------
// Creates the HTML for a single idea card
export function createIdeaCardHTML(idea) {
    // Use the ID from the idea object
    const ideaId = idea.id;
    
    // Build the dollar signs HTML if there's a price
    const priceHTML = idea.dollars > 0 
        ? `<div class="price-level">${renderDollarSigns(idea.dollars)}</div>`
        : "";
    
    // Determine which heart icon to show (filled if liked, empty if not)
    const heartSrc = isIdeaLiked(ideaId) ? "images/HeartFilled.svg" : "images/Heart.svg";
    const heartClass = isIdeaLiked(ideaId) ? "heart-icon is-active" : "heart-icon";
    
    // Build the complete card HTML
    return `
        <div class="card idea-card">
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
                    <span class="tag tag-button">${idea.category}</span>
                    <img 
                        src="${heartSrc}" 
                        alt="Heart Icon" 
                        class="${heartClass}"
                        data-idea-id="${ideaId}">
                </section>
            </div>
        </div>
    `;
}

// // ============================== UTILITY FUNCTIONS ==============================
// // ID and string manipulation utilities

// const normalizeDateInput = (value) => {
//     if (!value) return "";
//     const parsed = new Date(value);
//     if (Number.isNaN(parsed.getTime())) return value;
//     const year = parsed.getFullYear();
//     const month = String(parsed.getMonth() + 1).padStart(2, "0");
//     const day = String(parsed.getDate()).padStart(2, "0");
//     return `${year}-${month}-${day}`;
// };
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

// const saveLikedIdeas = (items) => {
//     localStorage.setItem("likedIdeas", JSON.stringify(items));
//     document.dispatchEvent(new CustomEvent("favorites:updated"));
// };

// const saveUserIdeas = (items) => {
//     localStorage.setItem("userIdeas", JSON.stringify(items));
//     document.dispatchEvent(new CustomEvent("ideas:updated"));
// };

// const findIdeaById = (ideaId) =>
//     getAllIdeas().find((entry) => getIdeaId(entry) === ideaId);

// const resolveIdeaFromStored = (item) => {
//     if (typeof item === "string") {
//         const idea = findIdeaById(item);
//         return idea
//             ? {
//                   id: item,
//                   title: idea.title,
//                   description: idea.description,
//                   image: idea.images?.[0] || "",
//                   category: idea.category,
//                   dollars: idea.dollars
//               }
//             : null;
//     }

//     if (item && typeof item === "object") {
//         const fallback = findIdeaById(item.id);
//         return {
//             id: item.id,
//             title: item.title || fallback?.title || "",
//             description: item.description || fallback?.description || "",
//             image: item.image || fallback?.images?.[0] || "",
//             category: item.category || fallback?.category || "",
//             dollars: Number(item.dollars ?? fallback?.dollars ?? 0)
//         };
//     }

//     return null;
// };


// ============================== MODAL MANAGEMENT ==============================


// // ============================== USER PROFILE MANAGEMENT ==============================
// const readProfile = () => {
//     const stored = localStorage.getItem("userProfile");
//     if (stored) {
//         try {
//             const parsed = JSON.parse(stored);
//             if (parsed && (parsed.name || parsed.username)) {
//                 return parsed;
//             }
//         } catch (error) {
//             return null;
//         }
//     }

//     return {
//         name: editAccountNameValue?.textContent?.trim() || "",
//         username: editAccountUsernameValue?.textContent?.trim() || ""
//     };
// };

// const applyProfile = (profile) => {
//     if (!profile) return;
//     if (editAccountNameValue) editAccountNameValue.textContent = profile.name;
//     if (editAccountUsernameValue) {
//         editAccountUsernameValue.textContent = profile.username;
//     }
//     if (userSettingsTitle) userSettingsTitle.textContent = profile.username;
//     if (editNameInput) editNameInput.value = profile.name;
//     if (editUsernameInput) editUsernameInput.value = profile.username;
// };

// const saveProfile = (profile) => {
//     localStorage.setItem("userProfile", JSON.stringify(profile));
//     applyProfile(profile);
// };

// // Initialize profile on page load
// applyProfile(readProfile());

// ============================== ADD IDEA MODAL ==============================


// if (addIdeaForm) {
//     addIdeaForm.addEventListener("submit", (event) => {
//         event.preventDefault();
//         const formData = new FormData(addIdeaForm);
//         const name = String(formData.get("name") || "").trim();
//         const description = String(formData.get("description") || "").trim();
//         const categoryValue = String(formData.get("category") || "");
//         const priceValue = Number(formData.get("price") || 0);

//         if (!name) {
//             return;
//         }

//         const categorySelect = addIdeaForm.querySelector("select[name='category']");
//         const categoryText = categorySelect
//             ? categorySelect.selectedOptions[0]?.textContent?.trim()
//             : "";

//         const userIdeas = readUserIdeas();
//         const baseId = createIdeaId(name);
//         const uniqueId = userIdeas.some((idea) => idea.id === baseId)
//             ? `${baseId}-${Date.now()}`
//             : baseId;

//         userIdeas.unshift({
//             id: uniqueId,
//             title: name,
//             description,
//             dollars: Number.isNaN(priceValue) ? 0 : priceValue,
//             images: [],
//             category: categoryText || categoryValue || "",
//             tags: []
//         });

//         saveUserIdeas(userIdeas);
//         addIdeaForm.reset();
//         closeModal(modalOverlay);
//     });
// }

// ============================== FAVORITES MODAL ==============================
// Favorites Modal
const favoritesModal = document.getElementById("favorites-modal");
const openFavoritesButtons = document.querySelectorAll(
    "#open-favorites, .open-favorites"
);
const closeFavoritesButton = document.getElementById("close-favorites");
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

// // ============================== USER SETTINGS MODALS ==============================
// // User Settings Modals
// const userSettingsModal = document.getElementById("user-settings-modal");
// const openUserSettingsButtons = document.querySelectorAll(".open-user-settings");
// const closeUserSettingsButton = document.getElementById("close-user-settings");
// const openEditAccountButtons = document.querySelectorAll(".open-edit-account");
// const editAccountModal = document.getElementById("edit-account-modal");
// const closeEditAccountButton = document.getElementById("close-edit-account");
// const backEditAccountButton = document.getElementById("back-edit-account");
// const openEditAccountFormButton = document.getElementById(
//     "open-edit-account-form"
// );
// const editAccountFormModal = document.getElementById("edit-account-form-modal");
// const closeEditAccountFormButton = document.getElementById(
//     "close-edit-account-form"
// );
// const cancelEditAccountFormButton = document.getElementById(
//     "cancel-edit-account-form"
// );
// const backEditAccountFormButton = document.getElementById(
//     "back-edit-account-form"
// );
// const deleteAccountButton = document.getElementById("delete-account");
// const userSettingsTitle = document.getElementById("user-settings-title");
// const editAccountNameValue = document.getElementById("edit-account-name");
// const editAccountUsernameValue = document.getElementById(
//     "edit-account-username"
// );
// const editAccountForm = document.getElementById("edit-account-form");
// const editNameInput = document.getElementById("edit-name");
// const editUsernameInput = document.getElementById("edit-username");

// if (openUserSettingsButtons.length) {
//     openUserSettingsButtons.forEach((button) => {
//         button.addEventListener("click", () => openModal(userSettingsModal));
//     });
// }

// if (closeUserSettingsButton) {
//     closeUserSettingsButton.addEventListener("click", () =>
//         closeModal(userSettingsModal)
//     );
// }

// closeOnOverlayClick(userSettingsModal);

// // Edit Account Modal
// if (openEditAccountButtons.length) {
//     openEditAccountButtons.forEach((button) => {
//         button.addEventListener("click", () => {
//             applyProfile(readProfile());
//             closeModal(userSettingsModal);
//             openModal(editAccountModal);
//         });
//     });
// }

// if (closeEditAccountButton) {
//     closeEditAccountButton.addEventListener("click", () =>
//         closeModal(editAccountModal)
//     );
// }

// if (backEditAccountButton) {
//     backEditAccountButton.addEventListener("click", () => {
//         closeModal(editAccountModal);
//         openModal(userSettingsModal);
//     });
// }

// closeOnOverlayClick(editAccountModal);

// // Edit Account Form Modal
// if (openEditAccountFormButton) {
//     openEditAccountFormButton.addEventListener("click", () => {
//         applyProfile(readProfile());
//         closeModal(editAccountModal);
//         openModal(editAccountFormModal);
//     });
// }

// if (closeEditAccountFormButton) {
//     closeEditAccountFormButton.addEventListener("click", () =>
//         closeModal(editAccountFormModal)
//     );
// }

// if (cancelEditAccountFormButton) {
//     cancelEditAccountFormButton.addEventListener("click", () => {
//         closeModal(editAccountFormModal);
//         openModal(editAccountModal);
//     });
// }

// if (backEditAccountFormButton) {
//     backEditAccountFormButton.addEventListener("click", () => {
//         closeModal(editAccountFormModal);
//         openModal(editAccountModal);
//     });
// }

// if (deleteAccountButton) {
//     deleteAccountButton.addEventListener("click", () => {
//         window.location.href = "a1_perfectdate_start.html";
//     });
// }

// if (editAccountForm) {
//     editAccountForm.addEventListener("submit", (event) => {
//         event.preventDefault();
//         const current = readProfile();
//         const name = (editNameInput?.value || "").trim() || current.name;
//         const username =
//             (editUsernameInput?.value || "").trim() || current.username;

//         saveProfile({ name, username });
//         closeModal(editAccountFormModal);
//         openModal(editAccountModal);
//     });
// }

// closeOnOverlayClick(editAccountFormModal);


// // ============================== INTERACTIVE BUTTONS (TAGS & HEARTS) ==============================
// const toggleActive = (element) => {
//     const isActive = element.classList.toggle("is-active");

//     if (!element.classList.contains("heart-icon")) return;

//     const defaultSrc = element.getAttribute("data-src");
//     const activeSrc = element.getAttribute("data-active-src");
//     const ideaId = element.getAttribute("data-idea-id");

//     if (defaultSrc && activeSrc) {
//         element.src = isActive ? activeSrc : defaultSrc;
//     }

//     if (!ideaId) return;

//     const likedIdeas = normalizeLikedIdeas(readLikedIdeasRaw());
//     const withoutCurrent = likedIdeas.filter((item) => item.id !== ideaId);

//     if (isActive) {
//         withoutCurrent.push({
//             id: ideaId,
//             title: element.getAttribute("data-title") || "",
//             description: element.getAttribute("data-description") || "",
//             image: element.getAttribute("data-image") || "",
//             category: element.getAttribute("data-category") || "",
//             dollars: Number(element.getAttribute("data-dollars") || 0)
//         });
//     }

//     saveLikedIdeas(withoutCurrent);
// };

// // Event listeners for interactive buttons
// document.addEventListener("click", (event) => {
//     const target = event.target.closest(".tag-button, .heart-icon");
//     if (target) {
//         toggleActive(target);
//     }
// });

// document.addEventListener("keydown", (event) => {
//     if (event.key !== "Enter" && event.key !== " ") {
//         return;
//     }

//     const activeElement = document.activeElement;
//     if (activeElement && activeElement.matches(".tag-button, .heart-icon")) {
//         event.preventDefault();
//         toggleActive(activeElement);
//     }
// });
