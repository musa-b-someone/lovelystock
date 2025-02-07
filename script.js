let images = [];
let currentPage = 1;
const imagesPerPage = 100; // 100 images at max

let currentImageList = []; // Store the current image list (search results or all images)

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

    currentImageList = [...loveImages].sort(() => 0.5 - Math.random()); // Update current image list
    currentPage = 1;
    showImages(currentImageList.slice(0, imagesPerPage));
}

// Search images by title (case insensitive)
function searchImages() {
    let query = document.getElementById("searchBox").value.toLowerCase();
    let filteredImages = images.filter(img => img.title.toLowerCase().includes(query));
    currentImageList = filteredImages; // Update current image list
    currentPage = 1;
    showImages(currentImageList);
}

// Handle enter key press in search box
function handleSearchKeyPress(event) {
    if (event.key === "Enter") {
        searchImages();
    }
}

// Go to home page
function goToHomePage() {
    showRandomImages();
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
    updatePagination(imageList);

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

    // Listen for clicks outside the popup content to close it
    popup.addEventListener('click', function(event) {
        if (event.target === popup) {
            closePopup();
        }
    });

    document.body.style.overflow = 'hidden'; // Disable scrolling on the body
}

// Close the image popup
function closePopup() {
    let popup = document.getElementById("imagePopup");
    popup.style.display = "none"; // Hide the popup
    document.body.style.overflow = 'auto'; // Re-enable scrolling on the body
    popup.removeEventListener('click', function(event) {
        if (event.target === popup) {
            closePopup();
        }
    });
}

// Update pagination display
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

// Go to previous page
function goToPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        showImages(currentImageList);
    }
}

// Go to next page
function goToNextPage(totalPages) {
    if (currentPage < totalPages) {
        currentPage++;
        showImages(currentImageList);
    }
}

// Handle enter key press in page jump input
function handlePageJumpKeyPress(event, totalPages) {
    if (event.key === "Enter") {
        let pageNumber = parseInt(document.getElementById("pageNumber").value);
        if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
            currentPage = pageNumber;
            showImages(currentImageList);
        } else {
            alert("Invalid page number. Please enter a number between 1 and " + totalPages);
        }
    }
}

// Load images on page load
window.onload = loadCSV;
