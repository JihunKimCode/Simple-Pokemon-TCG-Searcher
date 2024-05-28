// Year in Footer
var currentYear = new Date().getFullYear();
document.getElementById("year").innerHTML = currentYear;
document.getElementById("year2").innerHTML = currentYear;

const scrollTopButton = document.getElementById("scrollTop");

// Set Scroll up Button
scrollTopButton.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});  

// Search button
document.getElementById('fetchButton').addEventListener('click', fetchCards);
document.getElementById('searchQuery').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        fetchCards();
    }
});
document.getElementById('sortOrder').addEventListener('change', fetchCards);
document.getElementById('rarityFilter').addEventListener('change', fetchCards);

// Search options buttons
const pokemonNameBtn = document.getElementById('pokemonNameBtn');
const artistNameBtn = document.getElementById('artistNameBtn');
const setListBtn = document.getElementById('setListBtn');

pokemonNameBtn.addEventListener('click', function() {
    setActiveButton(pokemonNameBtn);
    setSearchPlaceholder("Enter Card name");
});
artistNameBtn.addEventListener('click', function() {
    setActiveButton(artistNameBtn);
    setSearchPlaceholder("Enter Artist name");
});
setListBtn.addEventListener('click', function() {
    setActiveButton(setListBtn);
    setSearchPlaceholder("Enter Set List");
});

const rarityOrder = {
    "Common": 1,
    "Uncommon": 2,
    "Rare": 3,
    "Radiant Rare": 3,
    "Amazing Rare": 4,
    "Double Rare": 4,
    "Rare Holo": 5,
    "Rare ACE": 5,
    "Ultra Rare": 6,
    "Rare Ultra": 6,
    "Rare Holo Star": 6,
    "Rare Prism Star": 6,
    "Rare Holo LV.X": 6,
    "LEGEND": 6,
    "Rare BREAK": 6,
    "Rare Prime": 6,
    "Rare Holo EX": 6,
    "Rare Holo GX": 6,
    "Rare Holo V": 6,
    "Rare Holo VSTAR": 6,
    "Rare Holo VMAX": 6,
    "Rare Secret": 7,
    "Trainer Gallery Rare Holo": 7,
    "Rare Rainbow": 7,
    "Rare Shining": 7,
    "Rare Shiny": 7,
    "Rare Shiny GX": 7,
    "ACE SPEC Rare": 7,
    "Illustration Rare": 8,
    "Special Illustration Rare": 8,
    "Hyper Rare": 9,
    "Promo": 9,
};

function populateRarityOptions(cards) {
    const rarities = new Set(cards.map(card => card.rarity).filter(rarity => rarity));
    const rarityFilter = document.getElementById('rarityFilter');
    const existingOptions = new Set(Array.from(rarityFilter.options).map(option => option.value));

    rarities.forEach(rarity => {
        if (!existingOptions.has(rarity)) {
            const option = document.createElement('option');
            option.value = rarity;
            option.textContent = rarity;
            rarityFilter.appendChild(option);
        }
    });
}

// Get price of the card
const getPrice = (card) => {
    const priceAttributes = ['unlimited', '1stEdition', 'unlimitedHolofoil', '1stEditionHolofoil', 'normal', 'holofoil', 'reverseHolofoil'];
    for (const attr of priceAttributes) {
        const price = card.tcgplayer?.prices?.[attr]?.mid;
        if (price !== undefined) {
            return price;
        }
    }
    return undefined;
};

// Get information about the card
function fetchCards() {
    const query = document.getElementById('searchQuery').value.trim();
    const sortOrder = document.getElementById('sortOrder').value;
    const rarityFilter = document.getElementById('rarityFilter').value;
    if (!query) {
        alert('Please enter a search query.');
        return;
    }

    // Determine the search type based on the active button
    let url;
    if (pokemonNameBtn.classList.contains('active')) {
        url = `https://api.pokemontcg.io/v2/cards?q=name:${query}`;
    } else if (artistNameBtn.classList.contains('active')) {
        url = `https://api.pokemontcg.io/v2/cards?q=artist:${query}`;
    } else if (setListBtn.classList.contains('active')) {
        url = `https://api.pokemontcg.io/v2/cards?q=set.name:${query}`;
    }

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const outputDiv = document.getElementById('output');
            outputDiv.innerHTML = '';

            if (data.data.length === 0) {
                outputDiv.innerHTML = '<p class="error">No cards found for this query.</p>';
                return;
            }

            populateRarityOptions(data.data);

            let filteredData = data.data;
            if (rarityFilter) {
                filteredData = filteredData.filter(card => card.rarity === rarityFilter);
            }

            const sortedData = filteredData.sort((a, b) => {
                if (sortOrder === 'oldest' || sortOrder === 'newest') {
                    const dateA = new Date(a.set.releaseDate);
                    const dateB = new Date(b.set.releaseDate);
                    return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
                } else if (sortOrder === 'highRarity') {
                    return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
                } else if (sortOrder === 'lowRarity') {
                    return (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0);
                } else if (sortOrder === 'highPrice') {
                    const priceA = parseFloat(getPrice(a) || 0);
                    const priceB = parseFloat(getPrice(b) || 0);
                    return priceB - priceA;
                } else if (sortOrder === 'lowPrice') {
                    const priceA = parseFloat(getPrice(a) || 0);
                    const priceB = parseFloat(getPrice(b) || 0);
                    return priceA - priceB;
                }
            });

            sortedData.forEach(card => {
                outputDiv.innerHTML += `
                    <div class="card">
                        <h3>${card.name}</h3>
                        <img src="${card.images.small}" alt="${card.name}" onclick="showPopup('${card.images.large}', '${card.name}')" style="cursor: zoom-in">
                        <img src="${card.set.images.logo}" alt="${card.name}" style="width: 100px; cursor: default">
                        <p><b>${card.set.name}</b></p>
                        <p>${card.set.releaseDate || 'N/A'}</p>
                        <p>${card.rarity || 'N/A'}</p>
                        <p>Avg $${getPrice(card) || 'N/A'}</p>
                    </div>
                `;
            });
        })
        .catch(error => {
            const outputDiv = document.getElementById('output');
            outputDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
            console.error('There has been a problem with your fetch operation:', error);
        });
}

function showPopup(imageUrl, name) {
    const popup = document.getElementById('popup');
    const popupImage = document.getElementById('popupImage');
    const caption = document.getElementById('caption');

    popup.style.display = "block";
    popupImage.src = imageUrl;
    caption.innerText = name;

    const close = document.getElementsByClassName('close')[0];
    close.onclick = function() {
        popup.style.display = "none";
    };

    window.onclick = function(event) {
        if (event.target == popup) {
            popup.style.display = "none";
        }
    };
}

function setActiveButton(activeButton) {
    const buttons = document.querySelectorAll('.search-options button');
    buttons.forEach(button => button.classList.remove('active'));
    activeButton.classList.add('active');
}

function setSearchPlaceholder(placeholderText) {
    document.getElementById('searchQuery').placeholder = placeholderText;
}
