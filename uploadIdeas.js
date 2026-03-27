const { initializeApp, cert, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const { parse } = require("csv-parse/sync");

// Initialize Firebase Admin with application default credentials
// (uses your logged-in Firebase CLI credentials)
initializeApp({
    credential: applicationDefault(),
    projectId: "wdd-x99-86659873-cf284"
});

const db = getFirestore();

function parsePriceToDollars(price) {
    if (!price) return 0;
    const trimmed = price.trim();
    if (trimmed === "0" || trimmed === "") return 0;
    if (trimmed === "$$$") return 3;
    if (trimmed === "$$") return 2;
    if (trimmed === "$") return 1;
    return 0;
}

function parseTags(tagsStr) {
    if (!tagsStr || tagsStr.trim() === "") return [];
    return tagsStr.split(",").map(t => t.trim()).filter(t => t.length > 0);
}

function extractLocation(address) {
    if (!address || address.trim() === "") return "";
    // Try to extract "City, State" from the address
    // Common patterns: "..., Rexburg, ID 83440" or "..., Idaho Falls, ID 83402"
    const parts = address.split(",").map(p => p.trim());
    
    // Look for parts that contain a state abbreviation or state name
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        // Check if this part contains a state + zip pattern like "ID 83440"
        if (/\b(ID|Idaho)\b/i.test(part)) {
            // The city is likely the previous part
            if (i > 0) {
                const city = parts[i - 1].replace(/^(Suite|Ste|Unit|#)\s*.*/i, "").trim();
                // Clean up: if it looks like a street, go one more back
                if (/^\d/.test(city) || /\b(St|Ave|Rd|Dr|Pkwy|Hwy|Lane|Way)\b/i.test(city)) {
                    // This looks like a street part, try the part with the state
                    const stateMatch = part.match(/^([A-Za-z\s]+?)[\s,]*(ID|Idaho)/i);
                    if (stateMatch && stateMatch[1].trim().length > 1) {
                        return `${stateMatch[1].trim()}, ID`;
                    }
                    // Otherwise just use what we have
                    return `${city}, ID`;
                }
                return `${city}, ID`;
            }
        }
    }
    // Fallback: return the whole address
    return address;
}

function cleanValue(val) {
    if (!val || val.trim() === "" || val.trim().toLowerCase() === "n/a") return "";
    return val.trim();
}

async function uploadIdeas() {
    const csvContent = fs.readFileSync("dateideas2.csv", "utf-8");
    
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true
    });

    // Skip the explanatory row (row 2 in the CSV, index 0 after header)
    const dataRows = records.filter(row => {
        const name = row["Date Name"];
        return name && name.trim() !== "";
    });

    console.log(`Found ${dataRows.length} ideas to upload.`);

    const batch = db.batch();
    let count = 0;

    for (const row of dataRows) {
        const title = row["Date Name"]?.trim() || "";
        if (!title) continue;

        const idea = {
            title: title,
            description: cleanValue(row["Notes"]),
            details: cleanValue(row["Details"]),
            address: cleanValue(row["Address"]),
            website: cleanValue(row["Link to their website"]),
            image: row["Link to Picture"]?.trim() || "",
            category: row["Category"]?.trim() || "",
            location: extractLocation(row["Address"]),
            dollars: parsePriceToDollars(row["Price (0, $, $$, or $$$)"]),
            tags: parseTags(row["Tags"])
        };

        const docRef = db.collection("ideas").doc();
        batch.set(docRef, idea);
        count++;
        console.log(`  Queued: ${title}`);
    }

    console.log(`\nCommitting ${count} ideas to Firestore...`);
    await batch.commit();
    console.log("Done! All ideas uploaded to the 'ideas' collection.");
}

uploadIdeas().catch(console.error);
