let images = [];
let currentPage = 1;
const imagesPerPage = 100;

let currentImageList = [];

// Load exactly 3 CSV parts and initialize the page
async function loadCSV() {
  try {
    let combinedCSV = "";
    let firstPart = true;
    
    // Loop through parts 1 to 3
    for (let part = 1; part <= 3; part++) {
      const response = await fetch(`images_${part}.csv`);
      
      if (!response.ok) {
        throw new Error(`images_${part}.csv not found.`);
      }
      
      const text = await response.text();
      
      if (firstPart) {
        // Use the entire first file including its header
        combinedCSV += text;
        firstPart = false;
      } else {
        // Remove the header (first line) for subsequent files
        const lines = text.split("\n");
        if (lines.length > 1) {
          // Append data lines after the header
          combinedCSV += "\n" + lines.slice(1).join("\n");
        }
      }
    }
    
    // Parse the combined CSV data
    images = parseCSV(combinedCSV);
    showRandomImages(); // Initial display
  } catch (error) {
    console.error("Error loading CSV:", error);
    displayErrorMessage("Error loading image data. Please try again later.");
  }
}



function displayErrorMessage(message) {
    const gallery = document.getElementById("imageGallery");
    gallery.innerHTML = `<p class="error-message">${message}</p>`;
}

// Parse CSV data (handles quoted fields and commas within titles)
function parseCSV(data) {
    let rows = data.split('\n'); // Split by newline character
    rows = rows.map(row => row.trim()).filter(row => row.length > 0);  // Remove whitespace and empty lines
    const result = [];

    for (let i = 1; i < rows.length; i++) {
        let row = smartSplit(rows[i]); // Use smartSplit to handle quoted commas
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
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        items.push(currentItem.trim());
        currentItem = '';
      } else {
        currentItem += char;
      }
    }
    items.push(currentItem.trim());  // Push the last item
    return items;
  }


// Show random love-themed images on the home page
function showRandomImages() {
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
    showImages(currentImageList);
}

// Search images by title (case-insensitive)
function searchImages() {
    let query = document.getElementById("searchBox").value.toLowerCase();
    let filteredImages = images.filter(img => img.title.toLowerCase().includes(query));
    currentImageList = filteredImages;
    currentPage = 1;
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
    document.getElementById('searchBox').value = ''; // Clear search box
    showRandomImages(); // Show random images on home page
}


// Display the images for the current page with error handling
function showImages(imageList) {
    const gallery = document.getElementById("imageGallery");
    const pagination = document.getElementById("pagination");

    const start = (currentPage - 1) * imagesPerPage;
    const paginatedImages = imageList.slice(start, start + imagesPerPage);

    gallery.innerHTML = ""; // Clear previous images

    if (paginatedImages.length === 0) {
      // Display "No images found" message
      displayErrorMessage("No images found.");
      pagination.innerHTML = ""; // Clear pagination
      return;
    }

    paginatedImages.forEach(img => {
        const div = document.createElement("div");
        div.className = "image-card";
        div.innerHTML = `<img src="${img.url}" loading="lazy" alt="${img.title}" onclick="openPopup('${img.url}', '${img.title.replace(/'/g, "\\'")}')">`; // Escape single quotes in title
        gallery.appendChild(div);
    });

    updatePagination(imageList); // Update pagination after displaying images

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
