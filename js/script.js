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
    default:
      return { color: "#000000", fillColor: "#FFFFFF", fillOpacity: 0.5 };
  }
}

// Function to add GeoJSON data to the map with popups and styles
function addGeoJsonLayer(data) {
  L.geoJSON(data, {
    style: function (feature) {
      if (
        feature.properties.indoor === "room" ||
        feature.properties.indoor === "level" ||
        feature.properties.indoor === "corridor"
      ) {
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
      return feature.properties.level === floor.toString();
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
});
