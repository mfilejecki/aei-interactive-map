function getCurrentFloorNumber() {
  // Find the button with the 'active-floor' class
  const activeButton = document.querySelector(".active-floor");

  // If an active button is found, return the last character of its ID
  if (activeButton) {
    const id = activeButton.id;
    const floorNumber = id.charAt(id.length - 1);
    return floorNumber;
  } else {
    return null; // or any default value you prefer
  }
}

function filterRoomsByType(rooms, type) {
  const currentFloor = getCurrentFloorNumber();
  console.log(currentFloor, rooms, type);
  // Filter rooms based on the user selected type from dropdown ( on currently selected floor )
  // Return the filtered rooms as object
}

function showFilteredRooms(filteredData) {
  // Somehow highlight the filtered rooms on the map
}

function removeRoomsFilter() {
  // Remove the filter from the map
}
