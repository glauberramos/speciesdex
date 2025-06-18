document.addEventListener("DOMContentLoaded", function () {
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
});
