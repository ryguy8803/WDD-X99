import { openModal, closeModal, initializeModal, auth, db, getCurrentUser } from "./script.js";
import "./auth.js";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// ============================== SHARED ACCOUNT / FAVORITES MODALS ==============================
initializeModal("user-settings-modal", {
    openButtonSelector: ".open-user-settings",
    closeButtonSelector: "#close-user-settings"
});

initializeModal("edit-account-modal", {
    closeButtonSelector: "#close-edit-account"
});

initializeModal("edit-account-form-modal", {
    closeButtonSelector: "#close-edit-account-form"
});

initializeModal("favorites-modal", {
    openButtonSelector: ".open-favorites",
    closeButtonSelector: "#close-favorites"
});

initializeModal("delete-confirm-modal", {
    closeButtonSelector: "#close-delete-confirm"
});

initializeModal("add-event-confirm-modal", {
    closeButtonSelector: "#close-add-event-confirm"
});

initializeModal("save-event-confirm-modal", {
    closeButtonSelector: "#close-save-event-confirm"
});

const openEditAccountButton = document.querySelector(".open-edit-account");
const backEditAccountButton = document.getElementById("back-edit-account");
const openEditAccountFormButton = document.getElementById("open-edit-account-form");
const backEditAccountFormButton = document.getElementById("back-edit-account-form");
const cancelEditAccountFormButton = document.getElementById("cancel-edit-account-form");

const cancelDeleteConfirmButton = document.getElementById("cancel-delete-confirm");
const confirmDeleteEventButton = document.getElementById("confirm-delete-event");
const deleteConfirmMessage = document.getElementById("delete-confirm-message");

const cancelAddEventConfirmButton = document.getElementById("cancel-add-event-confirm");
const confirmAddEventButton = document.getElementById("confirm-add-event");
const addEventConfirmMessage = document.getElementById("add-event-confirm-message");

const cancelSaveEventConfirmButton = document.getElementById("cancel-save-event-confirm");
const confirmSaveEventButton = document.getElementById("confirm-save-event");
const saveEventConfirmMessage = document.getElementById("save-event-confirm-message");

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

// ============================== CALENDAR MODALS ==============================
const addEventModalEl = document.getElementById("add-event-modal");
const editEventModalEl = document.getElementById("edit-event-modal");
const viewEventModalEl = document.getElementById("view-event-modal");
const dayEventsModalEl = document.getElementById("day-events-modal");
const deleteConfirmModalEl = document.getElementById("delete-confirm-modal");
const addEventConfirmModalEl = document.getElementById("add-event-confirm-modal");
const saveEventConfirmModalEl = document.getElementById("save-event-confirm-modal");

initializeModal("add-event-modal", {
    openButtonSelector: "#open-add-event",
    closeButtonSelector: "#close-add-event"
});

initializeModal("edit-event-modal", {
    closeButtonSelector: "#close-edit-event"
});

initializeModal("view-event-modal", {
    closeButtonSelector: "#close-view-event"
});

initializeModal("day-events-modal", {
    closeButtonSelector: "#close-day-events"
});

// ============================== CALENDAR STATE ==============================
const calendarGrid = document.getElementById("calendar-grid");
const monthTitle = document.getElementById("calendar-month-title");
const prevButton = document.getElementById("calendar-prev");
const nextButton = document.getElementById("calendar-next");
const upcomingDatesList = document.getElementById("upcoming-dates-list");
const pastDatesList = document.getElementById("past-dates-list");

const addEventForm = document.getElementById("add-event-form");
const cancelAddEventButton = document.getElementById("cancel-add-event");

const editEventForm = document.getElementById("edit-event-form");
const deleteEditEventButton = document.getElementById("delete-edit-event");
const deleteViewEventButton = document.getElementById("delete-view-event");
const viewEditEventButton = document.getElementById("view-edit-event");

const dayEventsTitle = document.getElementById("day-events-title");
const dayEventsList = document.getElementById("day-events-list");
const dayEventsAddDateButton = document.getElementById("day-events-add-date");

let currentMonth = new Date();
currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

let allEvents = [];
let selectedEventId = null;
let selectedDayDate = null;

const dayNamesHTML = `
    <div class="day-name">Sun</div>
    <div class="day-name">Mon</div>
    <div class="day-name">Tue</div>
    <div class="day-name">Wed</div>
    <div class="day-name">Thu</div>
    <div class="day-name">Fri</div>
    <div class="day-name">Sat</div>
`;

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseEventDate(value) {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
}

function formatDisplayDate(value) {
    const date = parseEventDate(value);
    if (!date) return "";
    return date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

function formatShortDisplayDate(value) {
    const date = parseEventDate(value);
    if (!date) return "";
    return date.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

function formatDisplayTime(value) {
    if (!value) return "";
    const [hours, minutes] = value.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;

    const temp = new Date();
    temp.setHours(hours, minutes, 0, 0);

    return temp.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit"
    });
}

function getMonthEvents(year, monthIndex) {
    return allEvents.filter((event) => {
        const date = parseEventDate(event.date);
        return date && date.getFullYear() === year && date.getMonth() === monthIndex;
    });
}

function getEventsByDate(year, monthIndex) {
    const map = new Map();
    const monthEvents = getMonthEvents(year, monthIndex);

    monthEvents.forEach((event) => {
        if (!map.has(event.date)) {
            map.set(event.date, []);
        }
        map.get(event.date).push(event);
    });

    map.forEach((events) => {
        events.sort((a, b) => {
            const aTime = a.time || "00:00";
            const bTime = b.time || "00:00";
            return aTime.localeCompare(bTime);
        });
    });

    return map;
}

function createEventPillsHTML(events) {
    if (!events || events.length === 0) return "";

    const firstEvent = events[0];
    const extraCount = events.length - 1;
    const isMobile = window.matchMedia("(max-width: 799px)").matches;

    if (isMobile) {
        if (events.length <= 3) {
            return `
                <div class="calendar-event-dots">
                    ${events.map(() => `<div class="calendar-event-dot"></div>`).join("")}
                </div>
            `;
        }

        return `
            <div class="calendar-event-count" title="${events.length} events">
                +${events.length}
            </div>
        `;
    }

    return `
        <div class="event-pill" data-event-id="${firstEvent.id}" title="${firstEvent.title}">
            ${firstEvent.title}
        </div>
        ${
            extraCount > 0
                ? `<div class="event-pill event-pill-more" data-open-day-events="true">+${extraCount} more</div>`
                : ""
        }
    `;
}

function buildCalendarGrid(eventsByDate = new Map()) {
    if (!calendarGrid) return;

    const year = currentMonth.getFullYear();
    const monthIndex = currentMonth.getMonth();

    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startWeekday = firstDay.getDay();
    const totalDays = lastDay.getDate();

    monthTitle.textContent = currentMonth.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric"
    });

    let html = dayNamesHTML;

    for (let i = 0; i < startWeekday; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }

    const todayKey = formatDateKey(new Date());

    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, monthIndex, day);
        const dateKey = formatDateKey(date);
        const events = eventsByDate.get(dateKey) || [];

        html += `
            <div class="calendar-day" data-date="${dateKey}">
                <div class="${dateKey === todayKey ? "circle-highlight" : ""}">${day}</div>
                ${createEventPillsHTML(events)}
            </div>
        `;
    }

    calendarGrid.innerHTML = html;

    calendarGrid.querySelectorAll(".calendar-day[data-date]").forEach((dayCell) => {
        dayCell.addEventListener("click", () => {
            const selectedDate = dayCell.dataset.date;
            const dayEvents = eventsByDate.get(selectedDate) || [];
            openDayEvents(selectedDate, dayEvents);
        });
    });
}

function getStartOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function sortEventsByDateTime(events) {
    return [...events].sort((a, b) => {
        const aDate = `${a.date}T${a.time || "00:00"}`;
        const bDate = `${b.date}T${b.time || "00:00"}`;
        return new Date(aDate) - new Date(bDate);
    });
}

function attachEventCardListeners(container) {
    if (!container) return;

    container.querySelectorAll(".event-card").forEach((card) => {
        card.addEventListener("click", (event) => {
            const editButton = event.target.closest(".edit-icon");
            const eventId = card.dataset.eventId;
            const eventData = allEvents.find((item) => item.id === eventId);

            if (!eventData) return;

            if (editButton) {
                openEditEvent(eventData);
                return;
            }

            openViewEvent(eventData);
        });
    });
}

function renderUpcomingDates() {
    if (!upcomingDatesList) return;

    const today = getStartOfToday();

    const upcoming = sortEventsByDateTime(
        allEvents.filter((event) => {
            const date = parseEventDate(event.date);
            return date && date >= today;
        })
    );

    if (upcoming.length === 0) {
        upcomingDatesList.innerHTML = `<p class="no-dates">No upcoming dates yet.</p>`;
        return;
    }

    upcomingDatesList.innerHTML = upcoming.map((event) => `
        <div class="card event-card" data-event-id="${event.id}">
            <div class="card-header">
                <h3>${event.title || "Untitled Event"}</h3>
                <button type="button" class="edit-icon" data-event-id="${event.id}">
                    <img src="images/Edit.svg" alt="Edit">
                </button>
            </div>
            <div class="event-details">
                <div>
                    <p>${formatDisplayDate(event.date)}</p>
                    <p>${formatDisplayTime(event.time)}</p>
                </div>
                <div>
                    <p>${event.location || "No location"}</p>
                    <p>${event.category || ""}</p>
                </div>
            </div>
        </div>
    `).join("");

    attachEventCardListeners(upcomingDatesList);
}

function renderPastDates() {
    if (!pastDatesList) return;

    const today = getStartOfToday();

    const past = sortEventsByDateTime(
        allEvents.filter((event) => {
            const date = parseEventDate(event.date);
            return date && date < today;
        })
    ).reverse();

    if (past.length === 0) {
        pastDatesList.innerHTML = `<p class="no-dates">No past dates yet.</p>`;
        return;
    }

    pastDatesList.innerHTML = past.map((event) => `
        <div class="card event-card past-event-card" data-event-id="${event.id}">
            <div class="card-header">
                <h3>${event.title || "Untitled Event"}</h3>
                <button type="button" class="edit-icon" data-event-id="${event.id}">
                    <img src="images/Edit.svg" alt="Edit">
                </button>
            </div>
            <div class="event-details">
                <div>
                    <p>${formatDisplayDate(event.date)}</p>
                    <p>${formatDisplayTime(event.time)}</p>
                </div>
                <div>
                    <p>${event.location || "No location"}</p>
                    <p>${event.category || ""}</p>
                </div>
            </div>
        </div>
    `).join("");

    attachEventCardListeners(pastDatesList);
}

async function loadEvents() {
    const user = getCurrentUser();
    if (!user) {
        allEvents = [];
        renderUpcomingDates();
        renderPastDates();
        buildCalendarGrid(new Map());
        return;
    }

    try {
        const eventsRef = collection(db, "users", user.uid, "events");
        const snapshot = await getDocs(eventsRef);

        allEvents = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
        }));

        renderUpcomingDates();
        renderPastDates();
        buildCalendarGrid(getEventsByDate(currentMonth.getFullYear(), currentMonth.getMonth()));
    } catch (error) {
        console.error("Error loading events:", error);
    }
}

function openAddEventForDate(dateString) {
    const dateInput = document.getElementById("event-date");
    if (dateInput) {
        dateInput.value = dateString;
    }
    openModal(addEventModalEl);
}

function openViewEvent(eventData) {
    selectedEventId = eventData.id;

    document.getElementById("view-event-title").textContent = eventData.title || "Untitled Event";
    document.getElementById("view-event-category").textContent = eventData.category || "";
    document.getElementById("view-event-date").textContent = formatDisplayDate(eventData.date);
    document.getElementById("view-event-time").textContent = formatDisplayTime(eventData.time);
    document.getElementById("view-event-location").textContent = eventData.location || "No location";
    document.getElementById("view-event-notes").textContent = eventData.notes || "No notes";
    document.getElementById("view-event-partner").textContent = eventData.partner || "Not set";

    openModal(viewEventModalEl);
}

function openEditEvent(eventData) {
    selectedEventId = eventData.id;

    document.getElementById("edit-event-title").value = eventData.title || "";
    document.getElementById("edit-event-date").value = eventData.date || "";
    document.getElementById("edit-event-time").value = eventData.time || "";
    document.getElementById("edit-event-location").value = eventData.location || "";
    document.getElementById("edit-event-category").value = eventData.category || "Active";
    document.getElementById("edit-your-date").value = eventData.partner || "";
    document.getElementById("edit-event-notes").value = eventData.notes || "";

    openModal(editEventModalEl);
}

function openDayEvents(dateString, events) {
    if (!dayEventsTitle || !dayEventsList) return;

    selectedDayDate = dateString;
    dayEventsTitle.textContent = formatShortDisplayDate(dateString);

    const sortedEvents = [...events].sort((a, b) => {
        const aTime = a.time || "00:00";
        const bTime = b.time || "00:00";
        return aTime.localeCompare(bTime);
    });

    if (sortedEvents.length === 0) {
        dayEventsList.innerHTML = `
            <p class="no-dates" style="margin-top: 8px;">
                No dates planned for this day yet.
            </p>
        `;
    } else {
        dayEventsList.innerHTML = `
            <div class="explore-card-list">
                ${sortedEvents.map((event) => `
                    <div class="card event-card day-event-card" data-event-id="${event.id}">
                        <div class="card-header">
                            <h3>${event.title || "Untitled Event"}</h3>
                            <button type="button" class="edit-icon" data-edit-event-id="${event.id}">
                                <img src="images/Edit.svg" alt="Edit">
                            </button>
                        </div>
                        <div class="event-details">
                            <div>
                                <p>${formatDisplayTime(event.time) || "No time"}</p>
                                <p>${event.category || ""}</p>
                            </div>
                            <div>
                                <p>${event.location || "No location"}</p>
                                <p>${event.partner || ""}</p>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;

        dayEventsList.querySelectorAll(".day-event-card").forEach((card) => {
            card.addEventListener("click", (event) => {
                const editButton = event.target.closest("[data-edit-event-id]");
                const eventId = card.dataset.eventId;
                const eventData = allEvents.find((item) => item.id === eventId);

                if (!eventData) return;

                closeModal(dayEventsModalEl);

                if (editButton) {
                    openEditEvent(eventData);
                    return;
                }

                openViewEvent(eventData);
            });
        });
    }

    openModal(dayEventsModalEl);
}

function openDeleteConfirmModal() {
    if (!selectedEventId) return;

    const eventData = allEvents.find((item) => item.id === selectedEventId);
    const eventTitle = eventData?.title?.trim() || "this event";

    if (deleteConfirmMessage) {
        deleteConfirmMessage.textContent = `Are you sure you want to delete "${eventTitle}"? This cannot be undone.`;
    }

    openModal(deleteConfirmModalEl);
}

async function deleteSelectedEvent() {
    const user = getCurrentUser();
    if (!user || !selectedEventId) return;

    try {
        await deleteDoc(doc(db, "users", user.uid, "events", selectedEventId));
        closeModal(deleteConfirmModalEl);
        closeModal(viewEventModalEl);
        closeModal(editEventModalEl);
        selectedEventId = null;
        await loadEvents();
    } catch (error) {
        console.error("Error deleting event:", error);
    }
}

if (dayEventsAddDateButton) {
    dayEventsAddDateButton.addEventListener("click", () => {
        if (!selectedDayDate) return;
        closeModal(dayEventsModalEl);
        openAddEventForDate(selectedDayDate);
    });
}

if (prevButton) {
    prevButton.addEventListener("click", () => {
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        buildCalendarGrid(getEventsByDate(currentMonth.getFullYear(), currentMonth.getMonth()));
    });
}

if (nextButton) {
    nextButton.addEventListener("click", () => {
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        buildCalendarGrid(getEventsByDate(currentMonth.getFullYear(), currentMonth.getMonth()));
    });
}

if (cancelAddEventButton) {
    cancelAddEventButton.addEventListener("click", () => {
        closeModal(addEventModalEl);
        addEventForm?.reset();
    });
}

if (addEventForm) {
    addEventForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const user = getCurrentUser();
        if (!user) return;

        const title = document.getElementById("event-title").value.trim();
        const date = document.getElementById("event-date").value.trim();

        if (!title || !date) return;

        if (addEventConfirmMessage) {
            addEventConfirmMessage.textContent = `Are you sure you want to add "${title}" to your calendar?`;
        }

        closeModal(addEventModalEl);
        openModal(addEventConfirmModalEl);
    });
}

if (cancelAddEventConfirmButton) {
    cancelAddEventConfirmButton.addEventListener("click", () => {
        closeModal(addEventConfirmModalEl);
        openModal(addEventModalEl);
    });
}

if (confirmAddEventButton) {
    confirmAddEventButton.addEventListener("click", async () => {
        const user = getCurrentUser();
        if (!user) return;

        const newEvent = {
            title: document.getElementById("event-title").value.trim(),
            date: document.getElementById("event-date").value.trim(),
            time: document.getElementById("event-time").value.trim(),
            location: document.getElementById("event-location").value.trim(),
            category: document.getElementById("event-category").value.trim(),
            partner: document.getElementById("your-date").value.trim(),
            notes: document.getElementById("event-notes").value.trim()
        };

        try {
            await addDoc(collection(db, "users", user.uid, "events"), newEvent);
            closeModal(addEventConfirmModalEl);
            addEventForm.reset();
            await loadEvents();
        } catch (error) {
            console.error("Error adding event:", error);
        }
    });
}

if (viewEditEventButton) {
    viewEditEventButton.addEventListener("click", () => {
        const eventData = allEvents.find((item) => item.id === selectedEventId);
        if (!eventData) return;

        closeModal(viewEventModalEl);
        openEditEvent(eventData);
    });
}

if (editEventForm) {
    editEventForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const user = getCurrentUser();
        if (!user || !selectedEventId) return;

        const title = document.getElementById("edit-event-title").value.trim();

        if (saveEventConfirmMessage) {
            saveEventConfirmMessage.textContent = `Are you sure you want to save your changes to "${title || "this event"}"?`;
        }

        closeModal(editEventModalEl);
        openModal(saveEventConfirmModalEl);
    });
}

if (cancelSaveEventConfirmButton) {
    cancelSaveEventConfirmButton.addEventListener("click", () => {
        closeModal(saveEventConfirmModalEl);
        openModal(editEventModalEl);
    });
}

if (confirmSaveEventButton) {
    confirmSaveEventButton.addEventListener("click", async () => {
        const user = getCurrentUser();
        if (!user || !selectedEventId) return;

        const updatedEvent = {
            title: document.getElementById("edit-event-title").value.trim(),
            date: document.getElementById("edit-event-date").value.trim(),
            time: document.getElementById("edit-event-time").value.trim(),
            location: document.getElementById("edit-event-location").value.trim(),
            category: document.getElementById("edit-event-category").value.trim(),
            partner: document.getElementById("edit-your-date").value.trim(),
            notes: document.getElementById("edit-event-notes").value.trim()
        };

        try {
            await updateDoc(doc(db, "users", user.uid, "events", selectedEventId), updatedEvent);
            closeModal(saveEventConfirmModalEl);
            await loadEvents();
        } catch (error) {
            console.error("Error updating event:", error);
        }
    });
}

if (deleteEditEventButton) {
    deleteEditEventButton.addEventListener("click", openDeleteConfirmModal);
}

if (deleteViewEventButton) {
    deleteViewEventButton.addEventListener("click", openDeleteConfirmModal);
}

if (cancelDeleteConfirmButton) {
    cancelDeleteConfirmButton.addEventListener("click", () => {
        closeModal(deleteConfirmModalEl);
    });
}

if (confirmDeleteEventButton) {
    confirmDeleteEventButton.addEventListener("click", deleteSelectedEvent);
}

// Render shell immediately
buildCalendarGrid(new Map());

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        allEvents = [];
        renderUpcomingDates();
        renderPastDates();
        buildCalendarGrid(new Map());
        return;
    }

    await loadEvents();
});