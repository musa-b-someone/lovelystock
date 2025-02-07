let images = [];
let currentPage = 1;
const imagesPerPage = 100;

// Load CSV file dynamically
async function loadCSV() {
    const response = await fetch("images.csv");
    const text = await response.text();
    images = parseCSV(text);
    showRandomImages(); // Load random images on home page
}

// Parse CSV data into an array (handles ANY format)
function parseCSV(data) {
    let rows = data.split("\n").map(row => row.trim()).filter(row => row.length > 0); // Remove empty lines
    let result = [];

    for (let i = 1; i < rows.length; i++) {  // Skip header row
        let row = smartSplit(rows[i]); // Use the smart splitting function
        if (row.length >= 2) {
            result.push({ url: row[0].trim(), title: row.slice(1).join(", ").trim() });
        }
    }

    return result;
}

// Smartly split CSV rows, handling commas inside descriptions
function smartSplit(row) {
    let output = [];
    let current = "";
    let inQuotes = false;

    for (let char of row) {
        if (char === '"' && (current.length === 0 || current[current.length - 1] !== "\\")) {
            inQuotes = !inQuotes; // Toggle quote state
        } else if (char === "," && !inQuotes) {
            output.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    output.push(current.trim());
    return output;
}

// Show random 100 images on homepage
function showRandomImages() {
    let shuffled = [...images].sort(() => 0.5 - Math.random());
    showImages(shuffled.slice(0, imagesPerPage));
}

// Search images by title (case insensitive)
function searchImages() {
    let query = document.getElementById("searchBox").value.toLowerCase();
    let filteredImages = images.filter(img => img.title.toLowerCase().includes(query));
    currentPage = 1;
    showImages(filteredImages);
}

// Show images with pagination
function showImages(imageList) {
    let gallery = document.getElementById("imageGallery");
    let pagination = document.getElementById("pagination");

    let start = (currentPage - 1) * imagesPerPage;
    let paginatedImages = imageList.slice(start, start + imagesPerPage);

    // Clear gallery
    gallery.innerHTML = "";
    paginatedImages.forEach(img => {
        let div = document.createElement("div");
        div.className = "image-card";
        div.innerHTML = `<a href="${img.url}" target="_blank">
                            <img src="${img.url}" loading="lazy" alt="${img.title}">
                         </a>
                         <p>${truncateText(img.title, 100)}</p>`;
        gallery.appendChild(div);
    });

    // Pagination
    pagination.innerHTML = "";
    let totalPages = Math.ceil(imageList.length / imagesPerPage);
    for (let i = 1; i <= totalPages; i++) {
        let btn = document.createElement("button");
        btn.className = "page-button " + (i === currentPage ? "active" : "");
        btn.innerText = i;
        btn.onclick = () => {
            currentPage = i;
            showImages(imageList);
        };
        pagination.appendChild(btn);
    }
}

// Truncate long descriptions
function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

// Load images on page load
window.onload = loadCSV;
