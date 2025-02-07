let images = [];
let currentPage = 1;
const imagesPerPage = 100;

let currentImageList = [];
let baseCardWidth = 250;  // Base width for calculations (adjust as needed)

// Load CSV file and initialize the page
async function loadCSV() {
    try {
        const response = await fetch("images.csv");
        const text = await response.text();
        images = parseCSV(text);
        showRandomImages();
    } catch (error) {
        console.error("Error loading CSV:", error);
        displayErrorMessage("Error loading image data. Please try again later.");
        document.body.classList.remove('loading'); // End loading state on error
    }
}

// Display a loading Indicator
function showLoadingIndicator() {
  document.getElementById('loadingIndicator').style.display = 'block';
}

// Hide the loading Indicator
function hideLoadingIndicator() {
  document.getElementById('loadingIndicator').style.display = 'none';
}

function displayErrorMessage(message) {
    const gallery = document.getElementById("imageGallery");
    gallery.innerHTML = `<p class="error-message">${message}</p>`;
    hideLoadingIndicator();
}

// Parse CSV data (handles quoted fields and commas within titles)
function parseCSV(data) {
    let rows = data.split('\n');
    rows = rows.map(row => row.trim()).filter(row => row.length > 0);
    const result = [];

    for (let i = 1; i < rows.length; i++) {
        let row = smartSplit(rows[i]);
        if (row.length >= 2) {
            result.push({ url: row[0].trim(), title: row.slice(1).join(',').trim() });
        }
    }
    return result;
}

// Smartly split CSV rows, handling commas within quoted fields
function smartSplit(row) {
    const items = [];
    let currentItem = '';
    let inQuotes = false;

    for (let char of row) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            items.push(currentItem.trim());
            currentItem = '';
        } else {
            currentItem += char;
        }
    }
    items.push(currentItem.trim());
    return items;
}


// Show random love-themed images on the home page
async function showRandomImages() {
    const loveKeywords = ['love', 'romance', 'valentines', 'heart', 'couple', 'kiss', 'wedding', 'flowers', 'affection', 'passion', 'date', 'relationship'];
    let loveImages = images.filter(img => {
        const titleLower = img.title.toLowerCase();
        return loveKeywords.some(keyword => titleLower.includes(keyword));
    });

    // Supplement with random images if not enough love-themed images
    if (loveImages.length < imagesPerPage) {
        let remaining = imagesPerPage - loveImages.length;
        let otherImages = images.filter(img => !loveImages.includes(img));
        let shuffled = [...otherImages].sort(() => 0.5 - Math.random());
        loveImages = loveImages.concat(shuffled.slice(0, remaining));
    }

    currentImageList = [...loveImages].sort(() => 0.5 - Math.random());
    currentPage = 1;

    // Hide pagination on the home page
    document.getElementById('pagination').style.display = 'none';

    const imageGallery = document.getElementById('imageGallery');
    imageGallery.innerHTML = ""; // Clear the gallery before adding images

    // Show the loading Indicator
    showLoadingIndicator();
    await showImages(currentImageList, true);


    hideLoadingIndicator(); // Hide after images are loaded
}

// Search images by title (case-insensitive)
async function searchImages() {
    let query = document.getElementById("searchBox").value.toLowerCase();
    let filteredImages = images.filter(img => img.title.toLowerCase().includes(query));
    currentImageList = filteredImages;
    currentPage = 1;

    // Show pagination on search results page
    document.getElementById('pagination').style.display = 'flex';

    // Remove home page message if it exists
    const homePageMessage = document.querySelector('.home-page-message');
    if (homePageMessage) {
        homePageMessage.remove();
    }

    // Show the loading Indicator
    showLoadingIndicator();
    await showImages(currentImageList);

    hideLoadingIndicator(); // Hide after images are loaded
}

// Handle Enter key press in the search box
function handleSearchKeyPress(event) {
    if (event.key === "Enter") {
        searchImages();
    }
}


// Go to the home page (show random images)
function goToHomePage() {
    document.getElementById('searchBox').value = '';  // Clear the search box
    showRandomImages();
}


// Display images with optional home page message
async function showImages(imageList, isHomePage = false) {
  return new Promise((resolve) => {
    const gallery = document.getElementById("imageGallery");
    gallery.innerHTML = "";
    let loadedCount = 0;
    const totalImages = imageList.length;


    if (imageList.length === 0) {
        displayErrorMessage("No images found.");
        return;
    }

    const imageLoadPromises = imageList.map(img => {
        return new Promise((resolveImage) => {
            const div = document.createElement("div");
            div.className = "image-card";

            const imgElement = document.createElement('img');
            imgElement.src = img.url;
            imgElement.loading = 'lazy';
            imgElement.alt = img.title;

            imgElement.onload = function() {
                const aspectRatio = this.naturalWidth / this.naturalHeight;
                this.style.width = '100%';
                div.style.flexBasis = `${baseCardWidth * aspectRatio}px`;
                imgElement.onclick = () => openPopup(img.url, img.title.replace(/'/g, "\\'"));

                div.appendChild(imgElement);
                gallery.appendChild(div);
                resolveImage(); // Resolve the promise for this image
            };

            imgElement.onerror = function() {
                console.warn("Error loading image:", img.url);
                resolveImage(); // Resolve the promise even if there's an error
            };
        });
    });


        Promise.all(imageLoadPromises).then(() => {
            if (!isHomePage) {
                updatePagination(imageList);
                document.getElementById('pagination').style.display = 'flex';
            }
            document.body.classList.remove('loading');  // Remove the loading class from the body
            resolve();
        });
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
    popupDownload.href = imageUrl;

    popup.style.display = "flex";

    popup.onclick = function(event) {
        if (event.target === popup) {
            closePopup();
        }
    };

    document.body.style.overflow = 'hidden';
}

// Close the image popup
function closePopup() {
    let popup = document.getElementById("imagePopup");
    popup.style.display = "none";
    document.body.style.overflow = 'auto';
    popup.onclick = null;
}



function updatePagination(imageList) {
    const pagination = document.getElementById("pagination");
    const totalPages = Math.ceil(imageList.length / imagesPerPage);

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
        showImages(currentImageList);
    }
}

// Go to the next page
function goToNextPage(totalPages) {
    if (currentPage < totalPages) {
        currentPage++;
        showImages(currentImageList);
    }
}

// Handle Enter key press in the page jump input
function handlePageJumpKeyPress(event, totalPages) {
    if (event.key === "Enter") {
        let pageNumber = parseInt(document.getElementById("pageNumber").value);
        if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
            currentPage = pageNumber;
            showImages(currentImageList);
        } else {
            document.getElementById("pageNumber").value = currentPage;
        }
    }
}


// Load images when the page is loaded
window.onload = loadCSV;
