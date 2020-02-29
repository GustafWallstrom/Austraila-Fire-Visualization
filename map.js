var margin = {
    top: 20,
    right: 50,
    bottom: 0,
    left: 50
  },
  width = 960 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;

var svgPlot = d3
  .select("#map")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height);

// initialize the map
var map = L.map("map").setView([20, 60], 2);

var start = new Date("2020/01/22").getTime();
var end = new Date("2020/20/02").getTime();
var step = 86400000;
// load a tile layer
L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }
).addTo(map);
map.on("zoomend", function() {
  var zoomlevel = map.getZoom();
  console.log("Current Zoom Level =" + zoomlevel);
});
var myGeoJsonRoute;

///////////////////////////////////////////////////////////
var svg = d3.select(map.getPanes().overlayPane).append("svg");
var g = svg.append("g").attr("class", "leaflet-zoom-hide");

d3.json("data/confirmed.geojson", function(error, collection) {
  if (error) throw error;
  var transform = d3.geo.transform({
    point: projectPoint
  });
  var path = d3.geo.path().projection(transform);

  var feature = g
    .selectAll("path")
    .data(collection.features)
    .enter()
    .append("path")
    .attr("d", path)
    .style("fill", "none")
    .style("stroke-width", "1.5")
    .style("stroke", "#ff9800");

  map.on("viewreset", reset);
  reset();

  // Reposition the SVG to cover the features.
  function reset() {
    var bounds = path.bounds(collection),
      topLeft = bounds[0],
      bottomRight = bounds[1];

    svg
      .attr("width", bottomRight[0] - topLeft[0])
      .attr("height", bottomRight[1] - topLeft[1])
      .style("left", topLeft[0] + "px")
      .style("top", topLeft[1] + "px");

    g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

    feature.attr("d", path);
  }

  // Use Leaflet to implement a D3 geometric transformation.
  function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
  }
});

var datum = "2/20/20";
d3.select("#date-value").text("Thursday, 20/2/2020");
d3.select("#date").on("input", function() {
  sum = 0;
  date = this.value;
  var data = new Date(parseInt(date));
  var weekday = new Array(7);
  weekday[0] = "Sunday";
  weekday[1] = "Monday";
  weekday[2] = "Tuesday";
  weekday[3] = "Wednesday";
  weekday[4] = "Thursday";
  weekday[5] = "Friday";
  weekday[6] = "Saturday";

  var day = weekday[data.getDay()];
  var date = data.getDate();
  var month = data.getMonth() + 1;
  d3.select("#date-value").text(
    day + ", " + date + "/" + month + "/" + data.getFullYear()
  );
  datum = month + "/" + date + "/20";
  map.removeLayer(myGeoJsonRoute);
  $.getJSON("data/confirmed.geojson", data => {
    data.features.map(rat => {
      var location = rat.geometry.coordinates.reverse();
      number = rat.properties[datum];
      location.push(number);
      return location;
    });

    myGeoJsonRoute = L.geoJSON(data, myLayerOptions).addTo(map);

    updateMapLayers();
  });
  g.selectAll("svg path").each(function(d) {
    console.log(d);
    if (new Date(d.properties.data).getTime() < date) {
      this.style.opacity = 1;
      sum += d.properties.exten;
    } else {
      this.style.opacity = 0;
    }
  });
});

///////////////////////////////////////////////////////////

function getHighestValue(array) {
  if (!array.length) return null;
  return Math.max(...array.map(o => o[2]));
}

function getLowestValue(array) {
  if (!array.length) return null;
  return Math.min(...array.map(o => o[2]));
}

function createLayerStyle(customRadius) {
  if (customRadius == 0) {
    return {
      color: "Green",
      radius: 0,
      stroke: false,
      fillOpacity: 1
    };
  } else {
    return {
      color: "Red",
      radius: 2 * Math.log(customRadius + 5),
      stroke: false,
      fillOpacity: 1
    };
  }
}
$.getJSON("data/confirmed.geojson", data => {
  data.features.map(rat => {
    var location = rat.geometry.coordinates.reverse();
    number = rat.properties[datum];
    location.push(number);
    return location;
  });
  myGeoJsonRoute = L.geoJSON(data, myLayerOptions).addTo(map);
});

function createCircles(feature, latlng) {
  var myLayerStyle = createLayerStyle(latlng.alt);
  var result = L.circleMarker(latlng, myLayerStyle);
  result.on("mouseover", function(e) {
    var place = "";
    if (feature.properties["Province/State"].length == 0) {
      place = feature.properties["Country/Region"];
    } else {
      place = feature.properties["Province/State"];
    }
    L.popup()
      .setLatLng(latlng)
      .setContent(
        "Confirmed infected: " +
          e.target._latlng.alt +
          "</br> Location: " +
          place
      )
      .openOn(map);
  });
  return result;
}
let myLayerOptions = {
  pointToLayer: createCircles,
  coordsToLatLng: function(coords) {
    return new L.LatLng(coords[0], coords[1], coords[2]);
  }
};

function updateMapLayers() {
  // map.eachLayer(function (layer) {
  // 	if (layer instanceof L.geoJSON)
  // 		map.removeLayer(layer);
  // });
  // L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
  // 	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
  // 	maxZoom: 4,
  // 	minZoom: 2
  // }).addTo(map);
}

var number = 0;
$("#confirmed").click(function() {
  state = 1;
  updateMapLayers();
  $.getJSON("data/confirmed.geojson", data => {
    data.features.map(rat => {
      var location = rat.geometry.coordinates.reverse();
      number = rat.properties[datum];
      location.push(number);
      return location;
    });
    myGeoJsonRoute = L.geoJSON(data, myLayerOptions).addTo(map);
  });
});
$("#deaths").click(function() {
  state = 2;
  updateMapLayers();
  $.getJSON("data/deaths.geojson", data => {
    data.features.map(rat => {
      var location = rat.geometry.coordinates.reverse();
      number = rat.properties[datum];
      location.push(number);
      return location;
    });
    L.geoJSON(data, myLayerOptions).addTo(map);
  });
});
$("#recovered").click(function() {
  state = 3;
  updateMapLayers();
  $.getJSON("data/recovered.geojson", data => {
    data.features.map(rat => {
      var location = rat.geometry.coordinates.reverse();
      number = rat.properties[datum];
      location.push(number);
      return location;
    });
    L.geoJSON(data, myLayerOptions).addTo(map);
  });
});

// var heat = L.heatLayer(locations, {
//     radius: 5,
//     minOpacity: 1,
//     maxZoom: 4,
//     blur: 10,
//     gradient: {
//         0.1: 'white',
//         0.5: 'red'
//     }
// });
// map.addLayer(heat);

/////////////// GRAPH ////////////////////////
var dateArray = [];
var numberArray = [];
var other = [];

for (let index = 0; index < 30; index++) {
  const tempDate = new Date(parseInt(start + index * step));
  dateArray[index] = tempDate.getMonth() + 1 + "/" + tempDate.getDate() + "/20";
}

for (let index = 0; index < dateArray.length; index++) {
  $.getJSON("data/confirmed.geojson", data => {
    var sum = null;
    data.features.map(rat => {
      var number = rat.properties[dateArray[index]];
      sum += number;
      return sum;
    });
    numberArray[index] = sum;
  });
}

console.log(typeof numberArray);

//Crap//

for (let index = 0; index < dateArray.length; index++) {
  other[index] = index * index;
}

//Crap//

new Chart(document.getElementById("line-chart"), {
  type: "line",
  data: {
    labels: dateArray,
    datasets: [
      {
        data: other,
        label: "Confirmed",
        borderColor: "red",
        fill: false
      }
    ]
  },
  options: {
    title: {
      display: true,
      text: "Graph of confirmed cases over time."
    }
  }
});
