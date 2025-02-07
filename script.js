let images = [];
let currentPage = 1;
const imagesPerPage = 100;

let currentImageList = []; // Holds either search results or random images

// Load CSV file and initialize the page
async function loadCSV() {
    const response = await fetch("images.csv");
    const text = await response.text();
    images = parseCSV(text);
    showRandomImages(); // Initial display
}

// Parse CSV data (handles quoted fields and commas within titles)
function parseCSV(data) {
    let rows = data.split("\n").map(row => row.trim()).filter(row => row.length > 0);
    let result = [];

    for (let i = 1; i < rows.length; i++) { // Start from 1 to skip header
        let row = smartSplit(rows[i]);
        if (row.length >= 2) { // Ensure at least URL and title
            result.push({ url: row[0].trim(), title: row.slice(1).join(", ").trim() });
        }
    }
    return result;
}

// Smartly split CSV rows, handling commas within quoted fields.
function smartSplit(row) {
    let output = [];
    let current = "";
    let inQuotes = false;

    for (let char of row) {
        if (char === '"' && (current.length === 0 || current[current.length - 1] !== "\\")) {
            inQuotes = !inQuotes;  // Toggle quote state ONLY if not escaped
        } else if (char === "," && !inQuotes) {
            output.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    output.push(current.trim()); // Add the last part
    return output;
}

// Show random love-themed images on the home page
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

    currentImageList = [...loveImages].sort(() => 0.5 - Math.random()); // Shuffle and update currentImageList
    currentPage = 1; // Reset to page 1
    showImages(currentImageList);  // Use currentImageList for initial display
}

// Search images by title (case-insensitive)
function searchImages() {
    let query = document.getElementById("searchBox").value.toLowerCase();
    let filteredImages = images.filter(img => img.title.toLowerCase().includes(query));
    currentImageList = filteredImages; // Update currentImageList with search results
    currentPage = 1; // Reset to page 1 after search
    showImages(currentImageList);
}

// Handle Enter key press in the search box
function handleSearchKeyPress(event) {
    if (event.key === "Enter") {
        searchImages();
    }
}

// Go to the home page (show random images)
function goToHomePage() {
    showRandomImages(); // Call showRandomImages to reset to initial state
}

// Display the images for the current page
function showImages(imageList) {
    let gallery = document.getElementById("imageGallery");
    let pagination = document.getElementById("pagination");

    let start = (currentPage - 1) * imagesPerPage;
    let paginatedImages = imageList.slice(start, start + imagesPerPage);

    gallery.innerHTML = ""; // Clear previous images
    paginatedImages.forEach(img => {
        let div = document.createElement("div");
        div.className = "image-card";
        // Simplified image display, relying on CSS for centering and aspect ratio
        div.innerHTML = `<img src="${img.url}" loading="lazy" alt="${img.title}" onclick="openPopup('${img.url}', '${img.title}')">`;
        gallery.appendChild(div);
    });

    updatePagination(imageList); // Update pagination *after* displaying images

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

    // Close popup if clicking outside the content area
    popup.onclick = function(event) {
        if (event.target === popup) {
            closePopup();
        }
    };

    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Close the image popup
function closePopup() {
    let popup = document.getElementById("imagePopup");
    popup.style.display = "none"; // Hide the popup
    document.body.style.overflow = 'auto'; // Restore background scrolling
    popup.onclick = null; // Remove the click listener
}

// Update the pagination display
function updatePagination(imageList) {
    let pagination = document.getElementById("pagination");
    let totalPages = Math.ceil(imageList.length / imagesPerPage);

    let paginationHTML = `<div class="pagination-info">
                            ${currentPage} out of ${totalPages}
                            <button class="page-button" onclick="goToPreviousPage()" ${currentPage === 1 ? 'disabled' : ''}>< Back</button>
                            <button class="page-button" onclick="goToNextPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>Forward ></button>
                         </div>
                         <div class="page-jump">
                            Go to | <input type="number" id="pageNumber" min="1" max="${totalPages}" placeholder="${currentPage}" onkeypress="handlePageJumpKeyPress(event, ${totalPages})"> | page
                         </div>`;

    pagination.innerHTML = paginationHTML;
}

// Go to the previous page
function goToPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        showImages(currentImageList); // Use currentImageList for navigation
    }
}

// Go to the next page
function goToNextPage(totalPages) {
    if (currentPage < totalPages) {
        currentPage++;
        showImages(currentImageList); // Use currentImageList for navigation
    }
}

// Handle Enter key press in the page jump input
function handlePageJumpKeyPress(event, totalPages) {
    if (event.key === "Enter") {
        let pageNumber = parseInt(document.getElementById("pageNumber").value);
        if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
            currentPage = pageNumber;
            showImages(currentImageList); // Use currentImageList for navigation
        } else {
            document.getElementById("pageNumber").value = ""; // Clear invalid entry
        }
    }
}

// Load images when the page is loaded
window.onload = loadCSV;
