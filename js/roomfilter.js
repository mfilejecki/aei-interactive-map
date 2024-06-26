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

// Define a style for non-filtered elements
function nonFilteredStyle() {
  return {
    color: "#000000",
    fillColor: "#CCCCCC", // Change this color as per your requirement
    fillOpacity: 0.3,
  };
}

// Function to filter GeoJSON data by room type
function filterByRoomType(data, type, currentFloor) {
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

// Modify the showRoomsOfType function
function showRoomsOfType(type) {
  const currentFloor = parseInt(getCurrentFloorNumber(), 10);

  if (isNaN(currentFloor)) {
    console.error("Current floor number is not valid.");
    return;
  }

  map.eachLayer(function (layer) {
    if (layer instanceof L.GeoJSON) {
      map.removeLayer(layer);
    }
  });

  // If type is "all", directly add all features with getRoomStyle
  if (type === "all") {
    addGeoJsonLayer(geojsonData, getRoomStyle);
    return;
  }

  // Filter the data based on the room type and current floor
  const filteredData = filterByRoomType(geojsonData, type, currentFloor);

  // Add non-filtered features with nonFilteredStyle
  addGeoJsonLayer(geojsonData, nonFilteredStyle);

  // Add filtered features with getRoomStyle
  addGeoJsonLayer(filteredData, getRoomStyle);
}
