// Function to get the number of currently selected floor
function getCurrentFloorNumber() {
  const activeButton = document.querySelector(".active-floor");

  if (activeButton) {
    const id = activeButton.id;
    const floorNumber = id.charAt(id.length - 1);
    return floorNumber;
  } else {
    return null;
  }
}

// Function to filter GeoJSON data by room type
function filterByRoomType(data, type) {
  const currentFloor = parseInt(getCurrentFloorNumber(), 10);

  if (isNaN(currentFloor)) {
    console.error("Current floor number is not valid.");
    return {
      type: "FeatureCollection",
      features: [],
    };
  }

  return {
    type: "FeatureCollection",
    features: data.features.filter(function (feature) {
      // Check if the level matches or if it spans multiple levels and includes the current floor
      let levels = feature.properties.level.split("-").map(Number);
      const isOnCurrentFloor =
        levels.length === 1
          ? levels[0] === currentFloor
          : currentFloor >= levels[0] && currentFloor <= levels[1];

      // Check if the room type matches the given type
      const isRoomTypeMatch = feature.properties.room === type;

      // Return true if both conditions are met
      return isOnCurrentFloor && isRoomTypeMatch;
    }),
  };
}

// Function to show rooms of a specific type on the current floor
function showRoomsOfType(type) {
  map.eachLayer(function (layer) {
    if (layer instanceof L.GeoJSON) {
      map.removeLayer(layer);
    }
  });

  if (type === "all") {
    addGeoJsonLayer(geojsonData);
    return;
  }

  const filteredData = filterByRoomType(geojsonData, type);
  addGeoJsonLayer(filteredData);
}
