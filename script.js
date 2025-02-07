let images = [];
let currentPage = 1;
const imagesPerPage = 50;

// Load CSV file dynamically
async function loadCSV() {
    const response = await fetch("images.csv");
    const text = await response.text();
    images = parseCSV(text);
    showRandomImages();
}

// Parse CSV data into an array (handles ANY format)
function parseCSV(data) {
    let rows = data.split("\n").map(row => row.trim()).filter(row => row.length > 0);
    let result = [];

    for (let i = 1; i < rows.length; i++) {
        let row = smartSplit(rows[i]);
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
            inQuotes = !inQuotes;
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

// Show random images with a love theme
function showRandomImages() {
    const loveKeywords = ['love', 'romance', 'valentines', 'heart', 'couple', 'kiss', 'wedding', 'flowers', 'affection', 'passion', 'date', 'relationship'];
    let loveImages = images.filter(img => {
        const titleLower = img.title.toLowerCase();
        return loveKeywords.some(keyword => titleLower.includes(keyword));
    });

    if (loveImages.length < imagesPerPage) {
        let remaining = imagesPerPage - loveImages.length;
        let otherImages = images.filter(img => !loveImages.includes(img));
        let shuffled = [...otherImages].sort(() => 0.5 - Math.random());
        loveImages = loveImages.concat(shuffled.slice(0, remaining));
    }

    let shuffledLoveImages = [...loveImages].sort(() => 0.5 - Math.random());
    showImages(shuffledLoveImages.slice(0, imagesPerPage));
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

    gallery.innerHTML = "";
    paginatedImages.forEach(img => {
        let div = document.createElement("div");
        div.className = "image-card";
        div.innerHTML = `<img src="${img.url}" loading="lazy" alt="${img.title}" onclick="openPopup('${img.url}', '${img.title}')">`;
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

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Open the image popup
function openPopup(imageUrl, title) {
    let popup = document.getElementById("imagePopup");
    let popupImage = document.getElementById("popupImage");
    let popupTitle = document.getElementById("popupTitle");
    let popupDownload = document.getElementById("popupDownload");

    popupImage.src = imageUrl;
    popupTitle.innerText = title;
    popupDownload.href = imageUrl; // Set the download link

    popup.style.display = "flex"; // Show the popup
    document.body.style.overflow = 'hidden'; // Disable scrolling on the body
}

// Close the image popup
function closePopup() {
    let popup = document.getElementById("imagePopup");
    popup.style.display = "none"; // Hide the popup
    document.body.style.overflow = 'auto'; // Re-enable scrolling on the body
}

// Load images on page load
window.onload = loadCSV;
