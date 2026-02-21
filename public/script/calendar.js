import { openModal, closeModal, closeOnOverlayClick, renderDollarSigns, db, getCurrentUser, auth } from "./script.js";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// ============================== DATA MANAGEMENT ==============================

let activeEvent = null;

// Get upcoming dates from Firebase only
const getUpcomingDates = async () => {
    const user = getCurrentUser();
    console.log("Current user in getUpcomingDates:", user);
    if (!user) return [];
    
    try {
        const eventsRef = collection(db, "users", user.uid, "events");
        const eventsSnap = await getDocs(eventsRef);
        console.log("Events snapshot size:", eventsSnap.size);
        return eventsSnap.docs.map(doc => ({
            ...doc.data(),
            firestoreId: doc.id
        }));
    } catch (error) {
        console.error("Error fetching events from Firebase:", error);
        return [];
    }
};

// Add a new event to Firebase
const addEvent = async (event) => {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        const eventsRef = collection(db, "users", user.uid, "events");
        await addDoc(eventsRef, event);
        await renderUpcomingDates();
        if (calendarCurrentMonth) await renderCalendar(calendarCurrentMonth);
    } catch (error) {
        console.error("Error adding event to Firebase:", error);
    }
};

// Update an existing event in Firebase
const updateEvent = async (eventToUpdate, updatedData) => {
    const user = getCurrentUser();
    if (!user || !eventToUpdate.firestoreId) return;
    
    try {
        const eventRef = doc(db, "users", user.uid, "events", eventToUpdate.firestoreId);
        await updateDoc(eventRef, updatedData);
        await renderUpcomingDates();
        if (calendarCurrentMonth) await renderCalendar(calendarCurrentMonth);
    } catch (error) {
        console.error("Error updating event in Firebase:", error);
    }
};

// Remove event by firestoreId from Firebase
const removeEventById = async (eventToRemove) => {
    const user = getCurrentUser();
    if (!user || !eventToRemove.firestoreId) return;
    
    try {
        const eventRef = doc(db, "users", user.uid, "events", eventToRemove.firestoreId);
        await deleteDoc(eventRef);
        await renderUpcomingDates();
        if (calendarCurrentMonth) await renderCalendar(calendarCurrentMonth);
    } catch (error) {
        console.error("Error deleting event from Firebase:", error);
    }
};

// ============================== UTILITY FUNCTIONS ==============================

const formatMonthTitle = (date) =>
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const formatEventDate = (dateString, time) => {
    const date = new Date(`${dateString}T00:00:00`);
    const formatted = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
    
    // Convert 24-hour time to 12-hour with AM/PM
    if (time) {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12; // Convert 0 to 12 for midnight
        const formattedTime = `${hour12}:${minutes} ${ampm}`;
        return `${formatted} at ${formattedTime}`;
    }
    
    return formatted;
};

const normalizeDateInput = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// Create dollar icons HTML
const createDollarHTML = (count) => {
    if (count <= 0) return "";
    return `<div>${renderDollarSigns(count)}</div>`;
};

// Create event card HTML template
const createEventCardHTML = (event) => {
    const dollarsHTML = event.dollars > 0 ? createDollarHTML(event.dollars) : "";
    
    return `
        <div class="card event-card" data-firestore-id="${event.firestoreId}">
            <div class="card-header">
                <div class="event-title">
                    <h3>${event.title}</h3>
                    ${dollarsHTML}
                </div>
                <button type="button" class="edit-icon" data-firestore-id="${event.firestoreId}">
                    <img src="images/Edit.svg" alt="Edit">
                </button>
            </div>
            <div class="event-details">
                <div>
                    <p class="event-time">${formatEventDate(event.date, event.time)}</p>
                    <p class="event-location">${event.location || ""}</p>
                </div>
                <span class="tag">${event.category || ""}</span>
            </div>
        </div>
    `;
};

// ============================== UPCOMING DATES LIST ==============================

const upcomingDatesList = document.getElementById("upcoming-dates-list");

const renderUpcomingDates = async () => {
    if (!upcomingDatesList) return;
    
    const dates = await getUpcomingDates();
    console.log("Upcoming dates:", dates);

    if (dates.length === 0) {
        upcomingDatesList.innerHTML = `
            <h2>Upcoming Dates</h2>
            <p class="instruction-text">No upcoming dates yet. Add one to get started!</p>
        `;
        return;
    }

    const cardsHTML = dates.map(event => createEventCardHTML(event)).join("");
    console.log("Cards HTML:", cardsHTML);
    upcomingDatesList.innerHTML = `
        <h2>Upcoming Dates</h2>
        ${cardsHTML}
    `;
};

// ============================== CALENDAR GRID ==============================

const calendarGrid = document.getElementById("calendar-grid");
const calendarMonthTitle = document.getElementById("calendar-month-title");
const calendarPrevButton = document.getElementById("calendar-prev");
const calendarNextButton = document.getElementById("calendar-next");

const renderCalendar = async (date) => {
    if (!calendarGrid || !calendarMonthTitle) return;
    
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    calendarMonthTitle.textContent = formatMonthTitle(date);

    // Save header cells and clear grid
    const headerCells = Array.from(calendarGrid.querySelectorAll(".day-name"));
    calendarGrid.innerHTML = "";
    headerCells.forEach((cell) => calendarGrid.appendChild(cell));

    // Add empty cells for days before month starts
    for (let i = 0; i < startWeekday; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-day empty";
        calendarGrid.appendChild(emptyCell);
    }

    // Create event map for quick lookup
    const events = await getUpcomingDates();
    const eventMap = new Map();
    events.forEach((event) => eventMap.set(event.date, event));

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement("div");
        cell.className = "calendar-day";
        
        const dayLabel = document.createElement("span");
        dayLabel.textContent = String(day);
        cell.appendChild(dayLabel);

        const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        // Highlight today
        if (
            year === today.getFullYear() &&
            month === today.getMonth() &&
            day === today.getDate()
        ) {
            dayLabel.classList.add("circle-highlight");
        }

        // Add event pill if there's an event on this day
        if (eventMap.has(dateKey)) {
            const pill = document.createElement("button");
            pill.type = "button";
            pill.className = "event-pill";
            pill.textContent = `${eventMap.get(dateKey).title.slice(0, 2)}...`;
            pill.dataset.firestoreId = eventMap.get(dateKey).firestoreId;
            cell.appendChild(pill);
        }

        calendarGrid.appendChild(cell);
    }
};

// Calendar navigation
let calendarCurrentMonth = null;

// Wait for authentication before rendering calendar
onAuthStateChanged(auth, async (user) => {
    if (user && calendarGrid && calendarMonthTitle) {
        let currentMonth = new Date();
        calendarCurrentMonth = currentMonth;
        await renderCalendar(currentMonth);
        await renderUpcomingDates();
    }
});

if (calendarGrid && calendarMonthTitle) {
    let currentMonth = new Date();
    calendarCurrentMonth = currentMonth;

    if (calendarPrevButton) {
        calendarPrevButton.addEventListener("click", async () => {
            currentMonth = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1
            );
            calendarCurrentMonth = currentMonth;
            await renderCalendar(currentMonth);
        });
    }

    if (calendarNextButton) {
        calendarNextButton.addEventListener("click", async () => {
            currentMonth = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
            );
            calendarCurrentMonth = currentMonth;
            await renderCalendar(currentMonth);
        });
    }
}

// ============================== ADD EVENT MODAL ==============================

const openAddEventButton = document.getElementById("open-add-event");
const addEventModal = document.getElementById("add-event-modal");
const closeAddEventButton = document.getElementById("close-add-event");
const cancelAddEventButton = document.getElementById("cancel-add-event");
const addEventForm = document.getElementById("add-event-form");
const addEventTitle = document.getElementById("event-title");
const addEventDate = document.getElementById("event-date");
const addEventTime = document.getElementById("event-time");
const addEventLocation = document.getElementById("event-location");
const addEventCategory = document.getElementById("event-category");
const addEventPartner = document.getElementById("your-date");
const addEventNotes = document.getElementById("event-notes");

if (openAddEventButton) {
    openAddEventButton.addEventListener("click", () => openModal(addEventModal));
}

if (closeAddEventButton) {
    closeAddEventButton.addEventListener("click", () => closeModal(addEventModal));
}

if (cancelAddEventButton) {
    cancelAddEventButton.addEventListener("click", () => closeModal(addEventModal));
}

if (addEventForm) {
    addEventForm.addEventListener("submit", async (event) => {
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
            dollars: 0
        };

        await addEvent(newEvent);
        await renderUpcomingDates();
        if (calendarCurrentMonth) await renderCalendar(calendarCurrentMonth);
        
        closeModal(addEventModal);
        addEventForm.reset();
    });
}

// Handle pending events from randomize feature
// NOTE: Disabled localStorage - need to implement Firebase-based solution
// if (addEventModal) {
//     const pending = localStorage.getItem("pendingCalendarEvent");
//     if (pending) {
//         try {
//             const parsed = JSON.parse(pending);
//             openModal(addEventModal);
//             if (addEventTitle) addEventTitle.value = parsed.title || "";
//             if (addEventCategory) {
//                 addEventCategory.value = (parsed.category || "")
//                     .toLowerCase()
//                     .replace(/\s+/g, "-");
//             }
//         } catch {
//             // Ignore parse errors
//         }
//         localStorage.removeItem("pendingCalendarEvent");
//     }
// }

closeOnOverlayClick(addEventModal);

// ============================== EDIT EVENT MODAL ==============================

const editEventModal = document.getElementById("edit-event-modal");
const closeEditEventButton = document.getElementById("close-edit-event");
const deleteEditEventButton = document.getElementById("delete-edit-event");
const editEventForm = document.getElementById("edit-event-form");
const editEventTitle = document.getElementById("edit-event-title");
const editEventDate = document.getElementById("edit-event-date");
const editEventTime = document.getElementById("edit-event-time");
const editEventLocation = document.getElementById("edit-event-location");
const editEventCategory = document.getElementById("edit-event-category");
const editEventPartner = document.getElementById("edit-your-date");
const editEventNotes = document.getElementById("edit-event-notes");

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

if (editEventForm) {
    editEventForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!activeEvent) return;

        const title = (editEventTitle?.value || "").trim();
        const rawDate = (editEventDate?.value || "").trim();
        const date = normalizeDateInput(rawDate);
        if (!title || !date) return;

        const updatedData = {
            title,
            date,
            time: (editEventTime?.value || "").trim(),
            location: (editEventLocation?.value || "").trim(),
            category: (editEventCategory?.value || "").trim(),
            partner: (editEventPartner?.value || "").trim(),
            notes: (editEventNotes?.value || "").trim()
        };

        await updateEvent(activeEvent, updatedData);
        await renderUpcomingDates();
        if (calendarCurrentMonth) await renderCalendar(calendarCurrentMonth);
        
        activeEvent = { ...activeEvent, ...updatedData };
        closeModal(editEventModal);
    });
}

if (closeEditEventButton) {
    closeEditEventButton.addEventListener("click", () => closeModal(editEventModal));
}

if (deleteEditEventButton) {
    deleteEditEventButton.addEventListener("click", async () => {
        if (!activeEvent) return;
        await removeEventById(activeEvent);
        activeEvent = null;
        closeModal(editEventModal);
    });
}

closeOnOverlayClick(editEventModal);

// ============================== VIEW EVENT MODAL ==============================

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

if (closeViewEventButton) {
    closeViewEventButton.addEventListener("click", () => closeModal(viewEventModal));
}

if (deleteViewEventButton) {
    deleteViewEventButton.addEventListener("click", async () => {
        if (!activeEvent) return;
        await removeEventById(activeEvent);
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

closeOnOverlayClick(viewEventModal);

// ============================== EVENT INTERACTIONS ==============================

// Edit button clicks from upcoming dates list
if (upcomingDatesList) {
    upcomingDatesList.addEventListener("click", async (event) => {
        // Check if edit icon was clicked
        const editButton = event.target.closest(".edit-icon");
        if (editButton) {
            const firestoreId = editButton.dataset.firestoreId;
            const events = await getUpcomingDates();
            const match = events.find((item) => item.firestoreId === firestoreId);
            if (match) openEditEvent(match);
            return;
        }
        
        // Otherwise, check if event card was clicked
        const eventCard = event.target.closest(".event-card");
        if (eventCard) {
            const firestoreId = eventCard.dataset.firestoreId;
            const events = await getUpcomingDates();
            const match = events.find((item) => item.firestoreId === firestoreId);
            if (match) openViewEvent(match);
        }
    });
}

// Event pill clicks from calendar grid
if (calendarGrid) {
    calendarGrid.addEventListener("click", async (event) => {
        const pill = event.target.closest(".event-pill");
        if (!pill) return;
        const firestoreId = pill.dataset.firestoreId;
        const events = await getUpcomingDates();
        const match = events.find((item) => item.firestoreId === firestoreId);
        if (match) openViewEvent(match);
    });
}
