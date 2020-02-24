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
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
map.on('zoomend', function () {
    var zoomlevel = map.getZoom();
    console.log("Current Zoom Level =" + zoomlevel)
});

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
            color: 'Green',
            radius: 0,
            stroke: false,
            fillOpacity: 1
        }
    } else {
        return {
            color: 'Red',
            radius: 2 * Math.log(customRadius + 5),
            stroke: false,
            fillOpacity: 1
        }
    }
}

function createCircles(feature, latlng) {
    var myLayerStyle = createLayerStyle(latlng.alt);
    var result = L.circleMarker(latlng, myLayerStyle);
    result.on('mouseover', function (e) {
        var place = '';
        if (feature.properties['Province/State'].length == 0) {
            place = feature.properties['Country/Region'];
        } else {
            place = feature.properties['Province/State'];
        }
        L.popup()
            .setLatLng(latlng)
            .setContent('Confirmed infected: ' + e.target._latlng.alt + '</br> Location: ' + place)
            .openOn(map);
    });
    return result;
}
let myLayerOptions = {
    pointToLayer: createCircles,
    coordsToLatLng: function (coords) {
        return new L.LatLng(coords[0], coords[1], coords[2]);
    }
}

function updateMapLayers() {
    map.eachLayer(function (layer) {
        map.removeLayer(layer);
    });
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 4,
        minZoom: 2
    }).addTo(map);
}

var number = 0;
$('#confirmed').click(function () {
    state = 1;
    updateMapLayers();
    $.getJSON("data/confirmed.geojson", (data) => {
        data.features.map((rat) => {
            var location = rat.geometry.coordinates.reverse();
            number = rat.properties['2/20/20'];
            location.push(number);
            return location;
        });
        L.geoJSON(data, myLayerOptions).addTo(map)
    });
});
$('#deaths').click(function () {
    state = 2;
    updateMapLayers();
    $.getJSON("data/deaths.geojson", (data) => {
        data.features.map((rat) => {
            var location = rat.geometry.coordinates.reverse();
            number = rat.properties['2/20/20'];
            location.push(number);
            return location;
        });
        L.geoJSON(data, myLayerOptions).addTo(map)
    });
});
$('#recovered').click(function () {
    state = 3;
    updateMapLayers();
    $.getJSON("data/recovered.geojson", (data) => {
        data.features.map((rat) => {
            var location = rat.geometry.coordinates.reverse();
            number = rat.properties['2/20/20'];
            location.push(number);
            return location;
        });
        L.geoJSON(data, myLayerOptions).addTo(map)
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