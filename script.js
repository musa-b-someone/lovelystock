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

// Parse CSV data into an array
function parseCSV(data) {
    let rows = data.split("\n").slice(1); // Remove header
    return rows.map(row => {
        let [url, title] = row.split(",");
        return { url: url.trim(), title: title.trim() };
    }).filter(img => img.url && img.title);
}

// Show random 100 images on homepage
function showRandomImages() {
    let shuffled = [...images].sort(() => 0.5 - Math.random());
    showImages(shuffled.slice(0, imagesPerPage));
}

// Search images by title
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
                         <p>${img.title}</p>`;
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

// Load images on page load
window.onload = loadCSV;
