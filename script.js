document.addEventListener("DOMContentLoaded", function () {
  const placeIdInput = document.getElementById("placeIdInput");
  const usernameInput = document.getElementById("usernameInput");
  const taxonSelect = document.getElementById("taxonSelect");
  const searchButton = document.getElementById("searchButton");
  const speciesGrid = document.getElementById("birdsGrid");
  const loading = document.getElementById("loading");
  const observedCount = document.getElementById("observedCount");
  const totalCount = document.getElementById("totalCount");
  const progressBar = document.getElementById("progressBar");

  // Load saved username, place ID, and taxon from localStorage
  const savedUsername = localStorage.getItem("inatUsername");
  const savedPlaceId = localStorage.getItem("inatPlaceId");
  const savedTaxon = localStorage.getItem("inatTaxon");

  if (savedUsername) {
    usernameInput.value = savedUsername;
  }
  if (savedPlaceId) {
    placeIdInput.value = savedPlaceId;
  }
  if (savedTaxon) {
    taxonSelect.value = savedTaxon;
    // Trigger the change event to update the grid class
    const event = new Event("change");
    taxonSelect.dispatchEvent(event);
  }

  // Save username when it changes
  usernameInput.addEventListener("change", () => {
    const username = usernameInput.value.trim();
    if (username) {
      localStorage.setItem("inatUsername", username);
    } else {
      localStorage.removeItem("inatUsername");
    }
  });

  // Update grid class name when taxon changes
  taxonSelect.addEventListener("change", () => {
    const taxonName = taxonSelect.options[taxonSelect.selectedIndex].text
      .split(" ")[0]
      .toLowerCase();
    speciesGrid.className = `${taxonName}-grid`;
    // Save the selected taxon to localStorage
    localStorage.setItem("inatTaxon", taxonSelect.value);
  });

  searchButton.addEventListener("click", async () => {
    const placeId = placeIdInput.value.trim();
    const username = usernameInput.value.trim();
    const taxonId = taxonSelect.value;

    if (!placeId || !username) {
      alert("Please enter both place ID and username");
      return;
    }

    try {
      loading.style.display = "block";
      speciesGrid.innerHTML = "";
      updateStatus(0, 0); // Reset status

      // First, get the user's observations
      const userObservations = await getUserObservations(
        username,
        placeId,
        taxonId
      );

      console.log(userObservations);

      // Then get the top 100 species for the place
      const topSpecies = await getTopSpecies(placeId, taxonId);

      console.log(topSpecies);

      // Display the species
      displaySpecies(topSpecies, userObservations);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while fetching the data");
    } finally {
      loading.style.display = "none";
    }
  });

  async function getUserObservations(username, placeId, taxonId) {
    const taxonParam = taxonId === "all" ? "" : `&taxon_id=${taxonId}`;
    const response = await fetch(
      `https://api.inaturalist.org/v1/observations?user_login=${username}&place_id=${placeId}&per_page=200${taxonParam}`
    );
    const data = await response.json();
    return new Set(data.results.map((obs) => obs.taxon.id));
  }

  async function getTopSpecies(placeId, taxonId) {
    const taxonParam = taxonId === "all" ? "" : `&taxon_id=${taxonId}`;
    const response = await fetch(
      `https://api.inaturalist.org/v1/observations/species_counts?place_id=${placeId}&per_page=100${taxonParam}`
    );
    const data = await response.json();
    return data.results;
  }

  function updateStatus(observed, total) {
    observedCount.textContent = observed;
    totalCount.textContent = total;
    const percent = total > 0 ? Math.round((observed / total) * 100) : 0;
    progressBar.style.width = `${percent}%`;
  }

  function displaySpecies(species, userObservations) {
    let observed = 0;
    const total = species.length;

    species.forEach((specimen) => {
      const isObserved = userObservations.has(specimen.taxon.id);
      if (isObserved) observed++;

      const card = document.createElement("div");
      card.className = `species-card ${isObserved ? "observed" : ""}`;

      const imageUrl =
        specimen.taxon.default_photo?.medium_url ||
        "https://via.placeholder.com/300x200?text=No+Image";

      card.innerHTML = `
                <img src="${imageUrl}" alt="${specimen.taxon.name}">
                <h3>${
                  specimen.taxon.preferred_common_name || specimen.taxon.name
                }</h3>
                <p class="scientific-name">${specimen.taxon.name}</p>
                <p class="observations">Observations: ${specimen.count}</p>
            `;

      speciesGrid.appendChild(card);
    });

    updateStatus(observed, total);
  }

  // Add event listener for taxon selection
  if (taxonSelect) {
    taxonSelect.addEventListener("change", function () {
      const speciesGrid = document.getElementById("speciesGrid");
      if (speciesGrid) {
        const selectedTaxon = this.options[this.selectedIndex].text
          .toLowerCase()
          .split(" ")[0];
        speciesGrid.className =
          selectedTaxon === "all" ? "species-grid" : `${selectedTaxon}-grid`;
      }
    });
  }
});
