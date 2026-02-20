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

