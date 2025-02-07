let images = [];
let currentPage = 1;
const imagesPerPage = 100;
let currentImageList = [];
let baseCardWidth = 250;  // Target width for calculations

// Load CSV file and initialize the page
async function loadCSV() {
    try {
        showLoadingIndicator();
        const response = await fetch("images.csv");
        const text = await response.text();
        images = parseCSV(text);
        await showRandomImages(); // Await to ensure images are loaded
        hideLoadingIndicator();
    } catch (error) {
        console.error("Error loading CSV:", error);
        displayErrorMessage("Error loading image data. Please try again later.");
        hideLoadingIndicator(); // Hide in case of error too.
    }
}

function showLoadingIndicator() {
    document.getElementById("loadingIndicator").style.display = "block";
}

function hideLoadingIndicator() {
    document.getElementById("loadingIndicator").style.display = "none";
}

function displayErrorMessage(message) {
    const gallery = document.getElementById("imageGallery");
    gallery.innerHTML = `<p class="error-message">${message}</p>`;
}

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


async function showRandomImages() {
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

    currentImageList = [...loveImages].sort(() => 0.5 - Math.random());
    currentPage = 1;

    document.getElementById('pagination').style.display = 'none';
    document.getElementById('imageGallery').innerHTML = "";

    await showImages(currentImageList, true); // Await to display images

     // Add the message below images
    const imageGallery = document.getElementById("imageGallery")
    const homePageMessage = document.createElement('p');
    homePageMessage.textContent = '100 random images from our collection to showcase that everything in our collection is unique.';
    homePageMessage.classList.add('home-page-message');
    imageGallery.parentNode.insertBefore(homePageMessage, imageGallery.nextSibling);
}

async function searchImages() {
    let query = document.getElementById("searchBox").value.toLowerCase();
    let filteredImages = images.filter(img => img.title.toLowerCase().includes(query));
    currentImageList = filteredImages;
    currentPage = 1;

    document.getElementById('pagination').style.display = 'flex';

    const homePageMessage = document.querySelector('.home-page-message');
    if (homePageMessage) {
        homePageMessage.remove();
    }

    document.getElementById('imageGallery').innerHTML = "";
    await showImages(currentImageList); // Await to display images
}

function handleSearchKeyPress(event) {
    if (event.key === "Enter") {
        searchImages();
    }
}

function goToHomePage() {
    document.getElementById('searchBox').value = '';
    showRandomImages();
}

// New showImages function using Promises and async/await
async function showImages(imageList, isHomePage = false) {
    const gallery = document.getElementById("imageGallery");
    const galleryWidth = gallery.offsetWidth; // Get the actual gallery width

    if (imageList.length === 0) {
        displayErrorMessage("No images found.");
        return;
    }
    const imageLoadPromises = imageList.map(img => {
        return new Promise((resolve) => {
        const div = document.createElement("div");
        div.className = "image-card";
        const imgElement = new Image(); // Create a new Image object
        imgElement.src = img.url;
        imgElement.loading = 'lazy';
        imgElement.alt = img.title;
        imgElement.onclick = () => openPopup(img.url, img.title.replace(/'/g, "\\'"));

        imgElement.onload = () => {
            const aspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
            let cardWidth = baseCardWidth;
            let cardHeight = cardWidth / aspectRatio;

            // Adjust card width based on gallery width
            const numPerRow = Math.floor(galleryWidth / cardWidth);
            const availableWidth = galleryWidth - (numPerRow -1) * 10; // Account for gap
            cardWidth = availableWidth / numPerRow;
            cardHeight = cardWidth / aspectRatio;

            div.style.width = `${cardWidth}px`; // Set width
            div.style.height = `${cardHeight}px`;  //Set height
            imgElement.style.width = '100%';
            imgElement.style.height = '100%';

            div.appendChild(imgElement);
            gallery.appendChild(div);

            resolve(); // Resolve the promise once the image is loaded
        };

        imgElement.onerror = () => {
          console.error(`Error loading image: ${img.url}`);
          resolve(); // Resolve even if there's an error.
        }
    });

});

await Promise.all(imageLoadPromises);


    // Only show pagination if not home page
    if(!isHomePage) {
        updatePagination(imageList);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
