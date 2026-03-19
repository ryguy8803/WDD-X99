import { createIdeaCardHTML, toggleLike, getAllIdeas, showIdeaDetail, auth, db } from "./script.js";
import { getDoc, doc, updateDoc, addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// Elements
const exploreSearchInput = document.querySelector("input[name='search']");
const exploreIdeaList = document.getElementById("idea-list");
const generateIdeasButton = document.getElementById('generate-ideas-button');
const locationPromptMessage = document.getElementById('location-prompt-message');

// ** IMPORTANT: Add your new, valid Gemini API key here, INSIDE the quotes **
const API_KEY = "AIzaSyCKPnIjprdO4G-dtwJMFmBSQ-Kc53b6qgo";

// Get selected category tags
const getSelectedTags = () => {
    return Array.from(
        document.querySelectorAll(".tags .tag-button.is-active")
    ).map((button) => button.textContent.trim());
};

// Render idea cards
const renderExploreIdeas = async (ideas, method = 'replace') => {
    if (!exploreIdeaList) return;

    if (ideas.length === 0 && method === 'replace') {
        exploreIdeaList.innerHTML = '<p style="text-align: center; color: var(--gray-50); padding: var(--large-spacing);">No ideas found. Try generating some with AI!</p>';
        return;
    }

    if (method === 'replace') {
        exploreIdeaList.innerHTML = '';
    }

    const cardHTMLPromises = ideas.map(idea => createIdeaCardHTML(idea));
    const cardHTMLs = await Promise.all(cardHTMLPromises);

    const fragment = document.createDocumentFragment();

    cardHTMLs.forEach((cardHTML, index) => {
        const idea = ideas[index];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHTML;
        const card = tempDiv.firstElementChild;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.heart-icon')) return;
            showIdeaDetail(idea);
        });

        fragment.appendChild(card);
    });

    if (method === 'prepend') {
        exploreIdeaList.prepend(fragment);
    } else { // 'append' or 'replace' (since replace clears first)
        exploreIdeaList.appendChild(fragment);
    }
};


// Filter and display ideas based on search and tags
const filterExploreIdeas = async () => {
    const query = (exploreSearchInput?.value || "").trim().toLowerCase();
    const selectedTags = getSelectedTags();

    const ideasFromDB = await getAllIdeas({ categories: selectedTags, query: query });
    
    await renderExploreIdeas(ideasFromDB);
};

async function generateIdeas() {
    const user = auth.currentUser;
    if (!user) {
        locationPromptMessage.textContent = 'Please log in to generate ideas with AI.';
        locationPromptMessage.classList.remove('hidden-style');
        return;
    }

    if (!API_KEY || API_KEY === "YOUR_API_KEY") {
        console.error("API key not found. Please add your API key to script/explore.js.");
        locationPromptMessage.textContent = 'API key not found. Please add your valid API key to script/explore.js.';
        locationPromptMessage.classList.remove('hidden-style');
        return;
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, { location: { latitude, longitude } });

                locationPromptMessage.textContent = 'Generating ideas near you...';
                locationPromptMessage.classList.remove('hidden-style');

                try {
                    const genAI = new GoogleGenerativeAI(API_KEY);
                    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash"});

                    const prompt = `
                        Suggest 10 unique date ideas near latitude: ${latitude}, longitude: ${longitude}.
                        For each idea, provide a name, location, description, category, price (using $, $$, or $$$), a link to the website, and an image URL.
                        For the image URL, use "images/Logo_wide.jpg".
                        Use only the following categories: Fitness, Food & Drink, Creative, Games, Learning & Culture, Nature.
                        Use the following pricing system: $ for 5-10 dollars per person, $$ for 10-20 dollars per person, and $$$ for above 20 dollars per person.
                        Return the response as a valid JSON array of objects. Do not include any text outside of the JSON array.
                        Example format:
                        [
                          {
                            "name": "Fire and Fizz",
                            "location": "Rexburg, Idaho",
                            "description": "A fun, welcoming space for families and friends to create and relax with pottery painting and a custom soda bar.",
                            "category": "Creative",
                            "price": "$$",
                            "image": "images/Logo_wide.jpg",
                            "website": "https://www.fireandfizz.co/"
                          }
                        ]
                    `;

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    let text = response.text();

                    const regex = /\`\`\`json\n([\s\S]*?)\n\`\`\`/;
                    const match = text.match(regex);

                    const jsonText = match ? match[1].trim() : text.trim();
                    const generatedIdeas = JSON.parse(jsonText);

                    const savedIdeas = [];
                    const activitiesCollection = collection(db, 'activities');

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

                        const ideaForRendering = {
                            ...idea,
                            id: docRef.id,
                            likedBy: [],
                        };
                        savedIdeas.push(ideaForRendering);
                    }

                    await renderExploreIdeas(savedIdeas, 'prepend');
                    locationPromptMessage.textContent = 'Success! Here are your new ideas.';

                } catch (error) {
                    console.error("AI generation error:", error);
                    locationPromptMessage.textContent = 'Sorry, we couldn\'t generate ideas. Check the console for errors.';
                } finally {
                    setTimeout(() => {
                        locationPromptMessage.classList.add('hidden-style');
                    }, 3000);
                }
            },
            () => {
                locationPromptMessage.textContent = 'Please enable location to generate ideas with AI.';
                locationPromptMessage.classList.remove('hidden-style');
            }
        );
    } else {
        locationPromptMessage.textContent = 'Geolocation is not supported by this browser.';
        locationPromptMessage.classList.remove('hidden-style');
    }
}


// Init and Event Listeners

// Initial render
filterExploreIdeas();

// Search input listener
if (exploreSearchInput) {
    exploreSearchInput.addEventListener("input", filterExploreIdeas);
}

if (generateIdeasButton) {
    generateIdeasButton.addEventListener('click', generateIdeas);
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
