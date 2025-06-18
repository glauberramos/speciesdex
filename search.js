document.addEventListener("DOMContentLoaded", function () {
  // Place search functionality
  const placeInput = document.getElementById("placeNameInput");
  const placeAutocomplete = document.getElementById("placeAutocomplete");
  let placeSearchTimeout;

  // Username search functionality
  const usernameInput = document.getElementById("usernameInput");
  let usernameSearchTimeout;

  // Create username autocomplete container
  const usernameAutocomplete = document.createElement("div");
  usernameAutocomplete.id = "usernameAutocomplete";
  usernameAutocomplete.className = "username-autocomplete";
  usernameInput.parentNode.appendChild(usernameAutocomplete);

  usernameInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();

    // Clear previous timeout
    if (usernameSearchTimeout) {
      clearTimeout(usernameSearchTimeout);
    }

    // Clear autocomplete if input is empty
    if (!query) {
      usernameAutocomplete.innerHTML = "";
      usernameAutocomplete.classList.remove("active");
      return;
    }

    // Set new timeout to prevent too many API calls
    usernameSearchTimeout = setTimeout(() => {
      searchUsernames(query);
    }, 300);
  });

  async function searchUsernames(query) {
    try {
      const response = await fetch(
        `https://api.inaturalist.org/v1/users/autocomplete?q=${encodeURIComponent(
          query
        )}&per_page=10`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        displayUsernameSuggestions(data.results);
      } else {
        usernameAutocomplete.innerHTML =
          '<div class="username-suggestion">No users found</div>';
        usernameAutocomplete.classList.add("active");
      }
    } catch (error) {
      console.error("Error searching usernames:", error);
      usernameAutocomplete.innerHTML =
        '<div class="username-suggestion">Error searching users</div>';
      usernameAutocomplete.classList.add("active");
    }
  }

  function displayUsernameSuggestions(users) {
    usernameAutocomplete.innerHTML = users
      .map((user) => {
        return `
          <div class="username-suggestion" data-username="${user.login}">
            <div class="username-name">${user.login}</div>
            <div class="username-info">${user.name || ""}</div>
          </div>
        `;
      })
      .join("");

    usernameAutocomplete.classList.add("active");

    // Add click handlers to suggestions
    const suggestions = usernameAutocomplete.querySelectorAll(
      ".username-suggestion"
    );
    suggestions.forEach((suggestion) => {
      suggestion.addEventListener("click", () => {
        const username = suggestion.dataset.username;
        const usernameName =
          suggestion.querySelector(".username-name").textContent;

        // Update input and save to localStorage
        usernameInput.value = usernameName;
        localStorage.setItem("inatUsername", usernameName);

        // Hide autocomplete
        usernameAutocomplete.classList.remove("active");
      });
    });
  }

  // Close username autocomplete when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !usernameInput.contains(e.target) &&
      !usernameAutocomplete.contains(e.target)
    ) {
      usernameAutocomplete.classList.remove("active");
    }
  });

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
      `https://api.inaturalist.org/v1/search?q=${encodeURIComponent(
        query
      )}&sources=places&per_page=10`
    )
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        if (result.results && result.results.length > 0) {
          displayPlaceSuggestions(result.results);
        } else {
          placeAutocomplete.innerHTML =
            '<div class="place-suggestion">No places found</div>';
        }
      });
  }

  function displayPlaceSuggestions(places) {
    placeAutocomplete.innerHTML = places
      .map((place) => {
        return `
      <div class="place-suggestion" data-id="${place.record.id}">
          <div class="place-name">${
            place.record.place_type === 12 || place.record.place_type === 29
              ? place.record.name
              : place.matches && place.matches.length > 0
              ? place.matches.join(", ")
              : place.record.name
          }</div>
      </div>
  `;
      })
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

  // Taxon search functionality
  let taxonSearchTimeout;

  taxonIdOverrideInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();

    // Clear previous timeout
    if (taxonSearchTimeout) {
      clearTimeout(taxonSearchTimeout);
    }

    // Clear autocomplete if input is empty
    if (!query) {
      taxonAutocomplete.innerHTML = "";
      taxonAutocomplete.classList.remove("active");
      return;
    }

    // Set new timeout to prevent too many API calls
    taxonSearchTimeout = setTimeout(() => {
      searchTaxons(query);
    }, 300);
  });

  async function searchTaxons(query) {
    try {
      const response = await fetch(
        `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(
          query
        )}&rank=genus,family,order,class,phylum,kingdom`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        displayTaxonSuggestions(data.results);
      } else {
        taxonAutocomplete.innerHTML =
          '<div class="taxon-suggestion">No taxa found</div>';
        taxonAutocomplete.classList.add("active");
      }
    } catch (error) {
      console.error("Error searching taxa:", error);
      taxonAutocomplete.innerHTML =
        '<div class="taxon-suggestion">Error searching taxa</div>';
      taxonAutocomplete.classList.add("active");
    }
  }

  function displayTaxonSuggestions(taxa) {
    console.log(taxa);
    taxonAutocomplete.innerHTML = taxa
      .map(
        (taxon) => `
        <div class="taxon-suggestion" data-id="${taxon.id}">
          <div class="taxon-name">${taxon.name}</div>
          <div class="taxon-rank">${taxon.rank}${
          taxon.preferred_common_name ? ` - ${taxon.preferred_common_name}` : ""
        }</div>
        </div>
      `
      )
      .join("");

    taxonAutocomplete.classList.add("active");

    // Add click handlers to suggestions
    const suggestions = taxonAutocomplete.querySelectorAll(".taxon-suggestion");
    suggestions.forEach((suggestion) => {
      suggestion.addEventListener("click", () => {
        const taxonId = suggestion.dataset.id;
        const taxonName = suggestion.querySelector(".taxon-name").textContent;

        // Update input and save to localStorage
        taxonIdOverrideInput.value = taxonName;
        localStorage.setItem("inatTaxonId", taxonId);

        // Hide autocomplete
        taxonAutocomplete.classList.remove("active");
      });
    });
  }

  // Close taxon autocomplete when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !taxonIdOverrideInput.contains(e.target) &&
      !taxonAutocomplete.contains(e.target)
    ) {
      taxonAutocomplete.classList.remove("active");
    }
  });
});
