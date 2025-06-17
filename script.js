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

  // Load saved username, place ID, taxon, and limit preference from localStorage
  const savedUsername = localStorage.getItem("inatUsername");
  const savedPlaceId = localStorage.getItem("inatPlaceId");
  const savedPlaceName = localStorage.getItem("inatPlaceName");
  const savedTaxon = localStorage.getItem("inatTaxon");
  const savedLimit = localStorage.getItem("inatLimit");

  if (savedUsername) {
    usernameInput.value = savedUsername;
  }

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
    const taxonName = taxonSelect.options[taxonSelect.selectedIndex].text
      .split(" ")[0]
      .toLowerCase();
    speciesGrid.className = `species-grid`;
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

  // Add event listener for taxon selection
  if (taxonSelect) {
    taxonSelect.addEventListener("change", function () {
      const speciesGrid = document.getElementById("speciesGrid");
      speciesGrid.className = "species-grid";
    });
  }

  // Add event listener for limit selection
  const limitSelect = document.getElementById("limitSelect");
  if (limitSelect) {
    limitSelect.addEventListener("change", function () {
      // Save the selected limit to localStorage
      localStorage.setItem("inatLimit", this.value);
    });
  }

  // Add event listener for show missing checkbox
  if (showMissingCheckbox) {
    showMissingCheckbox.addEventListener("change", function () {
      // If we have data loaded, filter it
      const speciesGrid = document.getElementById("speciesGrid");
      if (speciesGrid.children.length > 0) {
        filterSpecies();
      }
    });
  }

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

  searchButton.addEventListener("click", async () => {
    placeId = placeIdInput.value.trim();
    const username = usernameInput.value.trim();
    let taxonId = taxonSelect.value;
    if (taxonIdOverrideInput && taxonIdOverrideInput.value.trim() !== "") {
      taxonId = taxonIdOverrideInput.value.trim();
    }
    showMissingCheckbox.checked = false;

    if (!username) {
      alert("Please enter both place ID and username");
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
  });

  async function getUserObservations(username, placeId, taxonId) {
    const taxonParam = taxonId === "all" ? "" : `&taxon_id=${taxonId}`;
    const captiveParam =
      wildCheckbox && wildCheckbox.checked ? "&captive=false" : "";

    const url = `https://api.inaturalist.org/v1/observations/taxonomy?user_login=${username}&place_id=${placeId}${taxonParam}${captiveParam}`;
    const response = await fetch(url);
    const data = await response.json();

    let allObservationIds = new Set(data.results.map((obs) => obs.id));

    if (includeAllPlacesCheckbox && includeAllPlacesCheckbox.checked) {
      const allPlacesUrl = `https://api.inaturalist.org/v1/observations/taxonomy?user_login=${username}${taxonParam}${captiveParam}`;
      const allPlacesResponse = await fetch(allPlacesUrl);
      const allPlacesData = await allPlacesResponse.json();
      allPlacesData.results.forEach((obs) => allObservationIds.add(obs.id));
    }

    return allObservationIds;
  }

  async function getTopSpecies(placeId, taxonId) {
    const taxonParam = taxonId === "all" ? "" : `&taxon_id=${taxonId}`;
    const captiveParam =
      wildCheckbox && wildCheckbox.checked ? "&captive=false" : "";
    const limit = document.getElementById("limitSelect").value;

    const url = `https://api.inaturalist.org/v1/observations/species_counts?place_id=${placeId}&per_page=${limit}${taxonParam}${captiveParam}`;
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
    const imageUrl =
      specimen.taxon.default_photo?.medium_url ||
      "https://via.placeholder.com/300x200?text=No+Image";

    // Create the iNaturalist URL for this species in the current place
    const inatUrl = `https://www.inaturalist.org/observations?place_id=${placeIdInput.value}&taxon_id=${specimen.taxon.id}`;

    card.innerHTML = `
      <a href="${inatUrl}" target="_blank" class="species-link">
        <img src="${imageUrl}" alt="${specimen.taxon.name}">
        <h3>${specimen.taxon.preferred_common_name || specimen.taxon.name}</h3>
        <p class="scientific-name">${specimen.taxon.name}</p>
        <p class="observations">Observations: ${specimen.count}</p>
      </a>
    `;
    return card;
  }

  function filterSpecies() {
    const showMissingOnly = document.getElementById("showMissingOnly").checked;
    const speciesGrid = document.getElementById("speciesGrid");
    const cards = speciesGrid.getElementsByClassName("species-card");

    for (let card of cards) {
      if (showMissingOnly) {
        card.style.display = card.classList.contains("observed")
          ? "none"
          : "block";
      } else {
        card.style.display = "block";
      }
    }
  }

  // Place search functionality
  const placeInput = document.getElementById("placeNameInput");
  const placeAutocomplete = document.getElementById("placeAutocomplete");
  let placeSearchTimeout;

  placeInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();

    // Clear previous timeout
    if (placeSearchTimeout) {
      clearTimeout(placeSearchTimeout);
    }

    // Clear autocomplete if input is empty
    if (!query) {
      placeAutocomplete.innerHTML = "";
      placeAutocomplete.classList.remove("active");
      return;
    }

    // Set new timeout to prevent too many API calls
    placeSearchTimeout = setTimeout(() => {
      searchPlaces(query);
    }, 300);
  });

  async function searchPlaces(query) {
    await fetch(
      `https://api.inaturalist.org/v1/search?callback=placeAutocompleteCallback&q=${encodeURIComponent(
        query
      )}&sources=places&per_page=10`
    ).then((response) => {
      const reader = response.body.getReader();
      console.log(reader);
    });

    //   const data = await response.json();
    //   console.log(response());

    //   if (data.results && data.results.length > 0) {
    //     displayPlaceSuggestions(data.results);
    //   } else {
    //     placeAutocomplete.innerHTML =
    //       '<div class="place-suggestion">No places found</div>';
    //     placeAutocomplete.classList.add("active");
    //   }
    // } catch (error) {
    //   console.error("Error searching places:", error);
    //   placeAutocomplete.innerHTML =
    //     '<div class="place-suggestion">Error searching places</div>';
    //   placeAutocomplete.classList.add("active");
    // }
  }

  function displayPlaceSuggestions(places) {
    placeAutocomplete.innerHTML = places
      .map(
        (place) => `
        <div class="place-suggestion" data-id="${place.id}">
            <div class="place-name">${place.name}</div>
            <div class="place-details">${
              place.ancestor_place_names
                ? place.ancestor_place_names.join(", ")
                : ""
            }</div>
        </div>
    `
      )
      .join("");

    placeAutocomplete.classList.add("active");

    // Add click handlers to suggestions
    const suggestions = placeAutocomplete.querySelectorAll(".place-suggestion");
    suggestions.forEach((suggestion) => {
      suggestion.addEventListener("click", () => {
        const placeId = suggestion.dataset.id;
        const placeName = suggestion.querySelector(".place-name").textContent;

        // Update input and save to localStorage
        placeNameInput.value = placeName;
        placeIdInput.value = placeId;
        localStorage.setItem("inatPlaceId", placeId);
        localStorage.setItem("inatPlaceName", placeName);

        // Hide autocomplete
        placeAutocomplete.classList.remove("active");
      });
    });
  }

  // Close autocomplete when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !placeInput.contains(e.target) &&
      !placeAutocomplete.contains(e.target)
    ) {
      placeAutocomplete.classList.remove("active");
    }
  });
});
