var margin = {
        top: 0,
        right: 50,
        bottom: 0,
        left: 50
    },
    width = 960 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var svgPlot = d3.select("#map")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height);

// initialize the map
var map = L.map('map').setView([20, 60], 2);

// load a tile layer
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 4,
    minZoom: 2
}).addTo(map);
$.getJSON("data/confirmed.geojson", function (data) {
    var locations = data.features.map((rat) => {
        // the heatmap plugin wants an array of each location
        var location = rat.geometry.coordinates.reverse();
        var number = rat.properties['2/20/20'];
        location.push(number / 7000);
        return location; // e.g. [50.5, 30.5, 0.2], // lat, lng, intensity
    });
    // minOpacity - the minimum opacity the heat will start at
    // maxZoom - zoom level where the points reach maximum intensity (as intensity scales with zoom), equals maxZoom of the map by default
    // max - maximum point intensity, 1.0 by default
    // radius - radius of each "point" of the heatmap, 25 by default
    // blur - amount of blur, 15 by default
    // gradient - color gradient config, e.g. {0.4: 'blue', 0.65: 'lime', 1: 'red'}
    var heat = L.heatLayer(locations, {
        radius: 10,
        minOpacity: 1,
        maxZoom: 4,
        blur: 1,
        gradient: {
            0.1: 'white',
            0.5: 'red'
        }

    });
    map.addLayer(heat);
});