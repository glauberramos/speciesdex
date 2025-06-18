document.addEventListener("DOMContentLoaded", function () {
  const placeNameInput = document.getElementById("placeNameInput");
  const placeIdInput = document.getElementById("placeIdInput");
  const usernameInput = document.getElementById("usernameInput");
  const taxonSelect = document.getElementById("taxonSelect");
  const searchButton = document.getElementById("searchButton");
  const speciesGrid = document.getElementById("speciesGrid");
  const loading = document.getElementById("loading");
  const observedCount = document.getElementById("observedCount");
  const totalCount = document.getElementById("totalCount");
  const percentObserved = document.getElementById("percentObserved");
  const progressBar = document.getElementById("progressBar");
  const showMissingCheckbox = document.getElementById("showMissingOnly");
  const showSpottedCheckbox = document.getElementById("showSpottedOnly");
  const advancedOptionsButton = document.getElementById(
    "advancedOptionsButton"
  );
  const advancedOptionsSection = document.getElementById(
    "advancedOptionsSection"
  );
  const taxonIdOverrideInput = document.getElementById("taxonIdOverrideInput");
  const wildCheckbox = document.getElementById("wildCheckbox");
  const includeAllPlacesCheckbox = document.getElementById(
    "includeAllPlacesCheckbox"
  );
  const researchGradeCheckbox = document.getElementById(
    "researchGradeCheckbox"
  );
  const threatenedCheckbox = document.getElementById("threatenedCheckbox");

  // Load saved username, place ID, taxon, and limit preference from localStorage
  const savedUsername = localStorage.getItem("inatUsername");
  const savedPlaceId = localStorage.getItem("inatPlaceId");
  const savedPlaceName = localStorage.getItem("inatPlaceName");
  const savedTaxon = localStorage.getItem("inatTaxon");
  const savedLimit = localStorage.getItem("inatLimit");

  if (savedPlaceId) {
    placeIdInput.value = savedPlaceId;
  }

  if (savedPlaceName) {
    placeNameInput.value = savedPlaceName;
  }

  if (savedTaxon) {
    taxonSelect.value = savedTaxon;
  }

  if (savedLimit) {
    const limitSelect = document.getElementById("limitSelect");
    if (limitSelect) {
      limitSelect.value = savedLimit;
    }
  }

  if (savedUsername) {
    usernameInput.value = savedUsername;
    searchEspecies();
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

  // Save place name when it changes
  placeNameInput.addEventListener("change", () => {
    const placeName = placeNameInput.value.trim();

    if (placeName == "") {
      localStorage.removeItem("inatPlaceName");
      localStorage.removeItem("inatPlaceId");
      placeIdInput.value = "";
      placeNameInput.value = "";
    }
  });

  // Update grid class name when taxon changes
  taxonSelect.addEventListener("change", () => {
    // Save the selected taxon to localStorage
    localStorage.setItem("inatTaxon", taxonSelect.value);

    // Populate the taxonIdOverrideInput with the selected value, or clear if 'all'
    if (taxonIdOverrideInput) {
      if (taxonSelect.value === "all") {
        taxonIdOverrideInput.value = "";
      } else {
        taxonIdOverrideInput.value = taxonSelect.value;
      }
    }
  });

  // Add event listener for limit selection
  const limitSelect = document.getElementById("limitSelect");
  if (limitSelect) {
    limitSelect.addEventListener("change", function () {
      // Save the selected limit to localStorage
      localStorage.setItem("inatLimit", this.value);
    });
  }

  // Add event listeners for checkboxes
  showMissingCheckbox.addEventListener("change", () => {
    if (showMissingCheckbox.checked) {
      showSpottedCheckbox.checked = false;
    }
    filterSpecies();
  });

  showSpottedCheckbox.addEventListener("change", () => {
    if (showSpottedCheckbox.checked) {
      showMissingCheckbox.checked = false;
    }
    filterSpecies();
  });

  if (advancedOptionsButton && advancedOptionsSection) {
    advancedOptionsButton.addEventListener("click", function () {
      if (advancedOptionsSection.style.display === "none") {
        advancedOptionsSection.style.display = "block";
      } else {
        advancedOptionsSection.style.display = "none";
      }
    });
  }

  if (taxonIdOverrideInput) {
    taxonIdOverrideInput.addEventListener("input", function () {
      if (taxonSelect) {
        taxonSelect.value = "all";
      }
    });
  }

  async function searchEspecies() {
    placeId = placeIdInput.value.trim();
    const username = usernameInput.value.trim();
    let taxonId = taxonSelect.value;
    if (taxonIdOverrideInput && taxonIdOverrideInput.value.trim() !== "") {
      taxonId = taxonIdOverrideInput.value.trim();
    }
    showMissingCheckbox.checked = false;
    showSpottedCheckbox.checked = false;

    if (!username) {
      alert("Please enter username");
      return;
    }

    if (!placeId) {
      placeId = "any";
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

      // Then get the top species for the place
      const topSpecies = await getTopSpecies(placeId, taxonId);

      // Display the species
      displaySpecies(topSpecies, userObservations);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while fetching the data");
    } finally {
      loading.style.display = "none";
    }
  }

  searchButton.addEventListener("click", async () => {
    searchEspecies();
  });

  async function getUserObservations(username, placeId, taxonId) {
    const taxonParam = taxonId === "all" ? "" : `&taxon_id=${taxonId}`;
    const captiveParam =
      wildCheckbox && wildCheckbox.checked ? "&captive=false" : "";
    const researchGrade =
      researchGradeCheckbox && researchGradeCheckbox.checked
        ? "&quality_grade=research"
        : "";
    const threatened =
      threatenedCheckbox && threatenedCheckbox.checked
        ? "&threatened=true"
        : "";
    const allPlacesParam =
      includeAllPlacesCheckbox && includeAllPlacesCheckbox.checked
        ? ""
        : `&place_id=${placeId}`;

    const url = `https://api.inaturalist.org/v1/observations/taxonomy?user_login=${username}${allPlacesParam}${taxonParam}${captiveParam}${researchGrade}${threatened}`;
    const response = await fetch(url);
    const data = await response.json();

    let allObservationIds = new Set(data.results.map((obs) => obs.id));

    return allObservationIds;
  }

  async function getTopSpecies(placeId, taxonId) {
    const taxonParam = taxonId === "all" ? "" : `&taxon_id=${taxonId}`;
    const captiveParam =
      wildCheckbox && wildCheckbox.checked ? "&captive=false" : "";
    const researchGrade =
      researchGradeCheckbox && researchGradeCheckbox.checked
        ? "&quality_grade=research"
        : "";
    const threatened =
      threatenedCheckbox && threatenedCheckbox.checked
        ? "&threatened=true"
        : "";
    const limit = document.getElementById("limitSelect").value;

    const url = `https://api.inaturalist.org/v1/observations/species_counts?place_id=${placeId}&per_page=${limit}${taxonParam}${captiveParam}${researchGrade}${threatened}`;
    const response = await fetch(url);
    const data = await response.json();

    return data.results;
  }

  function updateStatus(observed, total) {
    observedCount.textContent = observed;
    totalCount.textContent = total;
    const percent = total > 0 ? Math.round((observed / total) * 100) : 0;
    percentObserved.textContent = percent;
    progressBar.style.width = `${percent}%`;
    percentObserved.textContent = percent;
  }

  function displaySpecies(species, userObservations) {
    let observed = 0;
    const total = species.length;

    species.forEach((specimen) => {
      const isObserved = userObservations.has(specimen.taxon.id);
      if (isObserved) observed++;

      const card = createSpeciesCard(specimen, isObserved);
      speciesGrid.appendChild(card);
    });

    updateStatus(observed, total);
    document.querySelector(".checkbox-container").style.display = "inline-flex";
  }

  function createSpeciesCard(specimen, isObserved) {
    const card = document.createElement("div");
    card.className = `species-card ${isObserved ? "observed" : ""}`;

    // Create the iNaturalist URL for this species in the current place
    const inatUrl = `https://www.inaturalist.org/observations?place_id=${placeIdInput.value}&taxon_id=${specimen.taxon.id}`;

    // Create status labels container
    const statusContainer = document.createElement("div");
    statusContainer.className = "species-status";

    // Add status labels based on taxon properties
    if (specimen.taxon.conservation_status) {
      const threatenedLabel = document.createElement("span");
      threatenedLabel.className = "status-label status-threatened";
      threatenedLabel.textContent = "Threatened";
      statusContainer.appendChild(threatenedLabel);
    }

    if (
      specimen.taxon.establishment_means &&
      specimen.taxon.establishment_means.establishment_means == "introduced"
    ) {
      const introducedLabel = document.createElement("span");
      introducedLabel.className = "status-label status-introduced";
      introducedLabel.textContent = "Introduced";
      statusContainer.appendChild(introducedLabel);
    }

    if (
      specimen.taxon.establishment_means &&
      specimen.taxon.establishment_means.establishment_means == "endemic"
    ) {
      const endemicLabel = document.createElement("span");
      endemicLabel.className = "status-label status-endemic";
      endemicLabel.textContent = "Endemic";
      statusContainer.appendChild(endemicLabel);
    }

    // if (
    //   specimen.taxon.establishment_means &&
    //   specimen.taxon.establishment_means.establishment_means == "native"
    // ) {
    //   const nativeLabel = document.createElement("span");
    //   nativeLabel.className = "status-label status-native";
    //   nativeLabel.textContent = "Native";
    //   statusContainer.appendChild(nativeLabel);
    // }

    const imageUrl =
      specimen.taxon.default_photo?.medium_url ||
      "https://via.placeholder.com/300x200?text=No+Image";

    card.innerHTML = `
      <a href="${inatUrl}" target="_blank" class="species-link">
        <img src="${imageUrl}" alt="${specimen.taxon.name}" />
        <div class="species-info">
          <h3>${
            specimen.taxon.preferred_common_name || specimen.taxon.name
          }</h3>
        <p class="scientific-name">${specimen.taxon.name}</p>
        <p class="observations">Observations: ${specimen.count}</p>
        </div>
      </a>
    `;

    // Insert status labels at the beginning of the card
    card.insertBefore(statusContainer, card.firstChild);

    return card;
  }

  function filterSpecies() {
    const cards = document.querySelectorAll(".species-card");
    const showMissing = showMissingCheckbox.checked;
    const showSpotted = showSpottedCheckbox.checked;

    cards.forEach((card) => {
      if (showMissing) {
        card.style.display = card.classList.contains("observed")
          ? "none"
          : "block";
      } else if (showSpotted) {
        card.style.display = card.classList.contains("observed")
          ? "block"
          : "none";
      } else {
        card.style.display = "block";
      }
    });
  }
});
