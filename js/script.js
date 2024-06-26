var map = L.map("map", {
  maxZoom: 25, // Set the maxZoom option for the map
}).setView([50.28830289487, 18.67682351476], 20);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 25, // Set the maxZoom option for the tile layer
}).addTo(map);

var geojsonData;

fetch("../data/indoor_map.geojson")
  .then((response) => response.json())
  .then((data) => {
    geojsonData = data;
    L.geoJSON(data).addTo(map);
  });

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
      return { color: "#000000", fillColor: "#CCCCCC", fillOpacity: 0.3 };
  }
}

// Function to add GeoJSON data to the map with popups and styles
function addGeoJsonLayer(data, styleFunction) {
  L.geoJSON(data, {
    style: function (feature) {
      if (feature.geometry.type === "Polygon") {
        return styleFunction(feature);
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
  addGeoJsonLayer(filteredData, getRoomStyle);
  setButtonStyles(floor);
  console.log(filteredData);
}

function setButtonStyles(activeFloor) {
  // Get all buttons
  const buttons = document.querySelectorAll('button[id^="floor_"]');
  buttons.forEach(function (button) {
    // Remove the active class from all buttons
    button.classList.remove("active-floor");
  });

  // Add the active class to the clicked button
  const activeButton = document.getElementById("floor_" + activeFloor);
  activeButton.classList.add("active-floor");
}

// Initially show floor 0
$(document).ready(function () {
  setButtonStyles(0);
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

function findPath() {
  var roomEntryValue = document.getElementById("roomEntry").value;
  var mainEntrance, roomEntryNode, corridorPolygon;

  geojsonData.features.forEach((feature) => {
    if (feature.properties.entrance === "yes;main") {
      mainEntrance = feature.geometry.coordinates.slice();
    }
    if (feature.properties.room_entry === roomEntryValue) {
      roomEntryNode = feature.geometry.coordinates.slice();
    }
    if (
      feature.geometry.type === "Polygon" &&
      feature.properties.indoor === "corridor"
    ) {
      corridorPolygon = feature.geometry.coordinates[0].map((coord) =>
        coord.slice()
      );
    }
  });

  if (!mainEntrance || !roomEntryNode || !corridorPolygon) {
    alert("Main entrance, room entry, or corridor polygon not found.");
    return;
  }

  var path = findPathWithinPolygon(
    corridorPolygon,
    mainEntrance,
    roomEntryNode
  );

  if (path) {
    var polyline = L.polyline(path, { color: "red" }).addTo(map);
    map.fitBounds(polyline.getBounds());
  } else {
    alert("No path found.");
  }
}

function findPathWithinPolygon(polygon, start, end) {
  // Create a bounding box for the polygon
  var bbox = turf.bbox(turf.polygon([polygon]));

  // Define a grid resolution
  var resolution = 0.00001; // Adjust this value for the required precision
  var grid = [];
  var startNode, endNode;

  // Generate a grid within the bounding box
  for (var lat = bbox[1]; lat <= bbox[3]; lat += resolution) {
    var row = [];
    for (var lng = bbox[0]; lng <= bbox[2]; lng += resolution) {
      var point = [lng, lat];
      if (
        turf.booleanPointInPolygon(turf.point(point), turf.polygon([polygon]))
      ) {
        row.push(0); // Walkable
        if (isClose(point, start))
          startNode = { x: row.length - 1, y: grid.length };
        if (isClose(point, end))
          endNode = { x: row.length - 1, y: grid.length };
      } else {
        row.push(1); // Non-walkable
      }
    }
    grid.push(row);
  }

  if (!startNode || !endNode) {
    alert("Start or end node is outside the corridor polygon.");
    return null;
  }

  // Use PathFinding.js to find the path
  var gridGraph = new PF.Grid(grid);
  var finder = new PF.AStarFinder({
    allowDiagonal: true, // Enable diagonal movements
    dontCrossCorners: false, // Allow crossing corners if needed
  });
  var path = finder.findPath(
    startNode.x,
    startNode.y,
    endNode.x,
    endNode.y,
    gridGraph
  );

  // Convert path to coordinates
  var pathCoordinates = path.map((node) => {
    var lng = bbox[0] + node[0] * resolution;
    var lat = bbox[1] + node[1] * resolution;
    return [lat, lng];
  });

  return pathCoordinates;
}

function isClose(coord1, coord2, tolerance = 0.00001) {
  return (
    Math.abs(coord1[0] - coord2[0]) < tolerance &&
    Math.abs(coord1[1] - coord2[1]) < tolerance
  );
}
