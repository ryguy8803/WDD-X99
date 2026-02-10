const tagButtons = document.querySelectorAll(".tag-button");
const heartIcons = document.querySelectorAll(".heart-icon");

const toggleActive = (element) => {
    const isActive = element.classList.toggle("is-active");
    element.setAttribute("aria-pressed", String(isActive));

    if (element.classList.contains("heart-icon")) {
        const defaultSrc = element.getAttribute("data-src");
        const activeSrc = element.getAttribute("data-active-src");
        if (defaultSrc && activeSrc) {
            element.src = isActive ? activeSrc : defaultSrc;
        }
    }
};

tagButtons.forEach((button) => {
    button.addEventListener("click", () => toggleActive(button));
});

heartIcons.forEach((icon) => {
    icon.addEventListener("click", () => toggleActive(icon));
    icon.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleActive(icon);
        }
    });
});