var map = L.map("map").setView([50.2884, 18.677], 18); // Centered based on provided coordinates

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 22, // Increase maxZoom to 22 for higher zoom levels
}).addTo(map);

// Create a door icon
var doorIcon = L.icon({
  iconUrl: "icons/door_icon.png", // Replace with the path to your door icon image
  iconSize: [16, 16], // Size of the icon
  iconAnchor: [8, 8], // Point of the icon which will correspond to marker's location
});

// Function to define the style of each room based on its type
function getRoomStyle(feature) {
  switch (feature.properties.room) {
    case "toilets":
      return { color: "#000000", fillColor: "#FFAAAA", fillOpacity: 0.5 };
    case "office":
      return { color: "#000000", fillColor: "#AAAAFF", fillOpacity: 0.5 };
    case "class":
      return { color: "#000000", fillColor: "#AAFFAA", fillOpacity: 0.5 };
    case "elevator":
      return { color: "#000000", fillColor: "#FFFFAA", fillOpacity: 0.5 };
    case "storage":
      return { color: "#000000", fillColor: "#FFD700", fillOpacity: 0.5 };
    case "restaurant":
      return { color: "#000000", fillColor: "#FF69B4", fillOpacity: 0.5 };
    case "stairs":
      return { color: "#000000", fillColor: "#DDA0DD", fillOpacity: 0.5 };
    case "lecture":
      return { color: "#000000", fillColor: "#008a1e", fillOpacity: 0.5 };
    case "shop":
      return { color: "#000000", fillColor: "#4e008a", fillOpacity: 0.5 };
    default:
      return { color: "#000000", fillColor: "#FFFFFF", fillOpacity: 0.5 };
  }
}

// Function to add GeoJSON data to the map with popups and styles
function addGeoJsonLayer(data) {
  L.geoJSON(data, {
    style: function (feature) {
      if (feature.geometry.type === "Polygon") {
        return getRoomStyle(feature);
      }
    },
    pointToLayer: function (feature, latlng) {
      if (feature.properties.door === "yes") {
        return L.marker(latlng, { icon: doorIcon });
      }
    },
    onEachFeature: function (feature, layer) {
      if (feature.geometry.type === "Polygon") {
        layer.on("click", function () {
          L.popup()
            .setLatLng(layer.getBounds().getCenter())
            .setContent(
              "Room: " +
                feature.properties.name +
                "<br>Floor: " +
                feature.properties.level +
                "<br>Type: " +
                feature.properties.room
            )
            .openOn(map);
        });
      }
    },
  }).addTo(map);
}

// Function to filter GeoJSON data by floor
function filterByFloor(data, floor) {
  return {
    type: "FeatureCollection",
    features: data.features.filter(function (feature) {
      // Check if the level matches or if it spans multiple levels and includes the current floor
      var levels = feature.properties.level.split("-").map(Number);
      return levels.length === 1
        ? levels[0] === floor
        : floor >= levels[0] && floor <= levels[1];
    }),
  };
}

// Function to show a specific floor
function showFloor(floor) {
  map.eachLayer(function (layer) {
    if (layer instanceof L.GeoJSON) {
      map.removeLayer(layer);
    }
  });
  var filteredData = filterByFloor(geojsonData, floor);
  addGeoJsonLayer(filteredData);
}

// Initially show floor 0
$(document).ready(function () {
  $.getJSON("data/indoor_map.geojson", function (data) {
    geojsonData = data;
    showFloor(0);
  });

  $("#route-form").on("submit", function (e) {
    e.preventDefault();
    var roomName = $("#room-name").val();
    findAndDrawRoute(roomName);
  });
});

// Function to find and draw the route to the specified room
function findAndDrawRoute(roomName) {
  var startPoint = [18.6775707468, 50.2886942247]; // Coordinates of the entrance
  var endPoint = null;
  var corridors = [];
  var rooms = [];

  // Find the room and corridors in the geojsonData
  geojsonData.features.forEach(function (feature) {
    if (feature.properties.name === roomName) {
      endPoint = feature.geometry.coordinates[0][0]; // Assuming the first coordinate is the target
      rooms.push(feature);
    }
    if (feature.properties.indoor === "corridor") {
      corridors.push(feature);
    }
  });

  if (endPoint) {
    console.log("Start Point:", startPoint); // Debugging output
    console.log("End Point:", endPoint); // Debugging output

    var graph = constructGraph(corridors, rooms);
    var path = findShortestPath(graph, startPoint, endPoint);
    if (path.length > 0) {
      drawPath(path);
    } else {
      alert("No valid path found.");
    }
  } else {
    alert("Room not found");
  }
}

// Function to draw the path on the map
function drawPath(path) {
  if (path.length === 0) {
    alert("No valid path to draw.");
    return;
  }

  var latlngs = path.map(function (coord) {
    return [coord[1], coord[0]]; // Convert to [lat, lng]
  });

  console.log("Path:", JSON.stringify(latlngs, null, 2)); // Detailed logging
  var polyline = L.polyline(latlngs, { color: "red" }).addTo(map);
  map.fitBounds(polyline.getBounds());
}
