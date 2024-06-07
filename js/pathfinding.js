// Construct the graph from the corridors and connect rooms to the nearest corridor points
function constructGraph(corridors, rooms) {
  let graph = { nodes: [], edges: {} };

  // Add corridor nodes and edges
  corridors.forEach(function (feature) {
    let coords = feature.geometry.coordinates[0];
    for (let i = 0; i < coords.length; i++) {
      let node = coords[i].toString();
      if (!graph.nodes.includes(node)) {
        graph.nodes.push(node);
        graph.edges[node] = [];
      }
      if (i > 0) {
        let prevNode = coords[i - 1].toString();
        graph.edges[node].push({
          node: prevNode,
          weight: calculateDistance(coords[i], coords[i - 1]),
        });
        graph.edges[prevNode].push({
          node: node,
          weight: calculateDistance(coords[i], coords[i - 1]),
        });
      }
    }
  });

  // Connect room entrances to the nearest corridor points
  rooms.forEach(function (room) {
    let roomEntrance = room.geometry.coordinates[0][0];
    let nearestCorridorPoint = findNearestCorridorPoint(
      roomEntrance,
      corridors
    );
    let roomNode = roomEntrance.toString();
    let corridorNode = nearestCorridorPoint.toString();

    if (!graph.nodes.includes(roomNode)) {
      graph.nodes.push(roomNode);
      graph.edges[roomNode] = [];
    }
    if (!graph.nodes.includes(corridorNode)) {
      graph.nodes.push(corridorNode);
      graph.edges[corridorNode] = [];
    }

    let distance = calculateDistance(roomEntrance, nearestCorridorPoint);
    graph.edges[roomNode].push({ node: corridorNode, weight: distance });
    graph.edges[corridorNode].push({ node: roomNode, weight: distance });

    console.log(
      `Connected room entrance ${roomNode} to corridor ${corridorNode} with distance ${distance}`
    );
  });

  console.log("Graph:", JSON.stringify(graph, null, 2)); // Detailed logging
  return graph;
}

// Function to find the nearest corridor point to a given room entrance
function findNearestCorridorPoint(roomEntrance, corridors) {
  let nearestPoint = null;
  let minDistance = Infinity;

  corridors.forEach(function (feature) {
    let coords = feature.geometry.coordinates[0];
    coords.forEach(function (point) {
      let distance = calculateDistance(roomEntrance, point);
      if (distance < minDistance) {
        nearestPoint = point;
        minDistance = distance;
      }
    });
  });

  return nearestPoint;
}

// Function to calculate distance between two coordinates
function calculateDistance(coord1, coord2) {
  let dx = coord1[0] - coord2[0];
  let dy = coord1[1] - coord2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

// Function to find the shortest path using Dijkstra's algorithm
function findShortestPath(graph, startCoord, endCoord) {
  let startNode = startCoord.toString();
  let endNode = endCoord.toString();
  let distances = {};
  let prev = {};
  let pq = new PriorityQueue();

  distances[startNode] = 0;

  graph.nodes.forEach((node) => {
    if (node !== startNode) {
      distances[node] = Infinity;
    }
    pq.enqueue(node, distances[node]);
  });

  while (!pq.isEmpty()) {
    let currentNode = pq.dequeue().element;

    if (currentNode === endNode) {
      let path = [];
      while (prev[currentNode]) {
        path.push(currentNode.split(",").map(Number));
        currentNode = prev[currentNode];
      }
      path.push(startCoord);
      return path.reverse();
    }

    graph.edges[currentNode].forEach((neighbor) => {
      let alt = distances[currentNode] + neighbor.weight;
      if (alt < distances[neighbor.node]) {
        distances[neighbor.node] = alt;
        prev[neighbor.node] = currentNode;
        pq.enqueue(neighbor.node, distances[neighbor.node]);
      }
    });
  }

  return [];
}

// Priority Queue implementation
class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(element, priority) {
    let qElement = { element, priority };
    let added = false;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].priority > qElement.priority) {
        this.items.splice(i, 0, qElement);
        added = true;
        break;
      }
    }
    if (!added) {
      this.items.push(qElement);
    }
  }

  dequeue() {
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }
}
