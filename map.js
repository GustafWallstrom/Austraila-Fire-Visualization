/*
 * COVID-19 Visualization for the course TNM048
 * Author: Samuel Svensson and Gustaf Wallström
 */
var margin = {
		top: 20,
		right: 50,
		bottom: 0,
		left: 50
	},
	width = 960 - margin.left - margin.right,
	height = 600 - margin.top - margin.bottom;
var number = 0;
var myGeoJsonRoute;
var start = new Date('2020/01/22').getTime();
var end = new Date('2020/20/02').getTime();
var step = 86400000;
var datum = '2/20/20';
var state = 'confirmed';
// Initialize map
var svgPlot = d3.select('#map').append('svg').attr('width', width + margin.left + margin.right).attr('height', height);
var basemap = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});

var map = L.map('map', {
	center: [ 20, 60 ],
	zoom: 2,
	layers: [ basemap ]
});
var svg = d3.select(map.getPanes().overlayPane).append('svg');
var g = svg.append('g').attr('class', 'leaflet-zoom-hide');
/* ------------------      DATA RETRIEVAL       ----------------------- */
/**
 * Load all data
 */
$.when(
	$.getJSON('data/confirmed.geojson'),
	$.getJSON('data/deaths.geojson'),
	$.getJSON('data/recovered.geojson')
).done(function(confirmedData, deathsData, recoveredData) {
	processData(confirmedData[0]);
	processData(deathsData[0]);
	processData(recoveredData[0]);

	// Load confirmed data at start
	drawMapLayers(confirmedData[0]);

	$('#confirmed').click(function() {
		state = 'confirmed';
		drawMapLayers(confirmedData[0]);
	});
	$('#deaths').click(function() {
		state = 'deaths';
		drawMapLayers(deathsData[0]);
	});
	$('#recovered').click(function() {
		state = 'recovered';
		drawMapLayers(recoveredData[0]);
	});

	getList(confirmedData[0]);
	/* ------------------      Graph      ----------------------- */
	/**
 * Graph which shows data over time
 */

	var dateArray = [];
	var confirmedArray = [];
	var deathArray = [];
	var recoveredArray = [];
	for (let index = 0; index < 30; index++) {
		const tempDate = new Date(parseInt(start + index * step));
		dateArray[index] = tempDate.getMonth() + 1 + '/' + tempDate.getDate() + '/20';
	}

	for (let index = 0; index < dateArray.length; index++) {
		var confirmedSum = 0;
		var deathSum = 0;
		var recoveredSum = 0;

		confirmedData[0].features.map((rat) => {
			var number = rat.properties[dateArray[index]];
			confirmedSum += number;
			return confirmedSum;
		});
		confirmedArray[index] = confirmedSum;

		deathsData[0].features.map((rat) => {
			var number = rat.properties[dateArray[index]];
			deathSum += number;
			return deathSum;
		});
		deathArray[index] = deathSum;

		recoveredData[0].features.map((rat) => {
			var number = rat.properties[dateArray[index]];
			recoveredSum += number;
			return recoveredSum;
		});
		recoveredArray[index] = recoveredSum;
	}

	new Chart(document.getElementById('line-chart'), {
		type: 'line',
		data: {
			labels: dateArray,
			datasets: [
				{
					data: confirmedArray,
					label: 'Confirmed',
					borderColor: 'khaki',
					fill: false
				},
				{
					data: deathArray,
					label: 'Deaths',
					borderColor: '#d10000',
					fill: start
				},
				{
					data: recoveredArray,
					label: 'Recovered',
					borderColor: 'green',
					fill: false
				}
			]
		},
		options: {
			title: {
				display: true,
				text: 'Graph of confirmed cases over time.'
			}
		}
	});
});
function getList(data) {
	var casesList = [];
	var merged = {
		rows: []
	};
	data.features.forEach(function(sourceRow) {
		if (
			!merged.rows.some(function(row) {
				return row.key[0] == sourceRow.properties['Country/Region'];
			})
		) {
			merged.rows.push({
				key: [ sourceRow.properties['Country/Region'] ],
				value: sourceRow.properties['2/20/20']
			});
		} else {
			var targetRow = merged.rows.filter(function(targetRow) {
				return targetRow.key[0] == sourceRow.properties['Country/Region'];
			});
			targetRow[0].value += sourceRow.properties['2/20/20'];
		}
	});
	merged.rows.sort(compare).map((rat) => {
		casesList.push('<span style="color: red; font-weight: bold;">' + rat.value + '</span> ' + rat.key);
	});

	var ul = document.createElement('ul');
	ul.setAttribute('id', 'caseList');

	document.getElementById('caseContainer').appendChild(ul);
	casesList.forEach(renderCasesList);

	function renderCasesList(element, index, arr) {
		var li = document.createElement('li');
		li.setAttribute('id', index);
		li.setAttribute('class', 'caseItem');
		li.innerHTML += element;
		ul.appendChild(li);
	}
}
function handler(event) {
	var dataValue = event.target.firstChild.nodeValue; // value of TextNode created by elements.createTextNode(Data)
	// handle dataValue
	alert(dataValue);
}

/* ------------------      SLIDER FUNCTIONALITY       ----------------------- */
/**
 * What happens when we use the date slider
 */

d3.select('#date-value').text('Thursday, 20/2/2020');
d3.select('#date').on('input', function() {
	var data = new Date(parseInt(this.value));
	var weekday = new Array(7);
	weekday[0] = 'Sunday';
	weekday[1] = 'Monday';
	weekday[2] = 'Tuesday';
	weekday[3] = 'Wednesday';
	weekday[4] = 'Thursday';
	weekday[5] = 'Friday';
	weekday[6] = 'Saturday';

	var day = weekday[data.getDay()];
	var date = data.getDate();
	var month = data.getMonth() + 1;
	d3.select('#date-value').text(day + ', ' + date + '/' + month + '/' + data.getFullYear());
	datum = month + '/' + date + '/20';
	$.getJSON('data/' + state + '.geojson', (data) => {
		data.features.map((rat) => {
			var location = rat.geometry.coordinates.reverse();
			number = rat.properties[datum];
			location.push(number);
			return location;
		});
		drawMapLayers(data);
	});
});

/* ------------------      DRAW CIRCLES       ----------------------- */
/**
 * Render circles on map
 */
let myLayerOptions = {
	pointToLayer: createCircles,
	coordsToLatLng: function(coords) {
		return new L.LatLng(coords[0], coords[1], coords[2]);
	}
};

function createLayerStyle(customRadius) {
	if (customRadius == 0) {
		return {
			color: 'Green',
			radius: 0,
			stroke: false,
			fillOpacity: 1
		};
	} else {
		var circleColor = 'red';
		switch (state) {
			case 'recovered': {
				circleColor = 'green';
				recovered.style.setProperty('--button-color', 'green');
				deaths.style.setProperty('--button-color', '#222222');
				confirmed.style.setProperty('--button-color', '#222222');
				confirmed.style.setProperty('--text-color', 'white');
				date.style.setProperty('--slider-color', 'green');
				break;
			}
			case 'deaths':
				circleColor = 'red';
				confirmed.style.setProperty('--button-color', '#222222');
				deaths.style.setProperty('--button-color', '#d10000');
				recovered.style.setProperty('--button-color', '#222222');
				confirmed.style.setProperty('--text-color', 'white');
				date.style.setProperty('--slider-color', 'red');
				break;
			default:
				circleColor = 'khaki';
				recovered.style.setProperty('--button-color', '#222222');
				deaths.style.setProperty('--button-color', '#222222');
				confirmed.style.setProperty('--button-color', 'khaki');
				confirmed.style.setProperty('--text-color', 'black');
				date.style.setProperty('--slider-color', 'khaki');
				break;
		}
		return {
			color: circleColor,
			radius: 2 * Math.log(customRadius * 2 + 5),
			stroke: false,
			fillOpacity: 1
		};
	}
}

function createCircles(feature, latlng) {
	var myLayerStyle = createLayerStyle(latlng.alt);
	var result = L.circleMarker(latlng, myLayerStyle);

	result.on('mouseover', function(e) {
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

/* ------------------      HELPER FUNCTIONS/MISC      ----------------------- */
function getHighestValue(array) {
	if (!array.length) return null;
	return Math.max(...array.map((o) => o[2]));
}

function getLowestValue(array) {
	if (!array.length) return null;
	return Math.min(...array.map((o) => o[2]));
}
function processData(data) {
	data.features.map((rat) => {
		var location = rat.geometry.coordinates.reverse();
		number = rat.properties[datum];
		location.push(number);
		return location;
	});
}
function drawMapLayers(data) {
	map.eachLayer(function(layer) {
		if (!layer._url) {
			map.removeLayer(layer);
		}
	});
	L.geoJSON(data, myLayerOptions).addTo(map);
}
function compare(a, b) {
	const value1 = a.value;
	const value2 = b.value;

	let comparison = 0;
	if (value1 > value2) {
		comparison = 1;
	} else if (value1 < value2) {
		comparison = -1;
	}
	return comparison * -1;
}
// d3.json("data/confirmed.geojson", function (error, collection) {
// 	 if (error) throw error;
// 	 var transform = d3.geo.transform({
// 		  point: projectPoint
// 	 });
// 	 var path = d3.geo.path().projection(transform);

// 	 var feature = g
// 		  .selectAll("path")
// 		  .data(collection.features)
// 		  .enter()
// 		  .append("path")
// 		  .attr("d", path)
// 		  .style("fill", "none")
// 		  .style("stroke-width", "1.5")
// 		  .style("stroke", "#ff9800");

// 	 map.on("viewreset", reset);
// 	 reset();

// 	 // Reposition the SVG to cover the features.
// 	 function reset() {
// 		  var bounds = path.bounds(collection),
// 			   topLeft = bounds[0],
// 			   bottomRight = bounds[1];

// 		  svg
// 			   .attr("width", bottomRight[0] - topLeft[0])
// 			   .attr("height", bottomRight[1] - topLeft[1])
// 			   .style("left", topLeft[0] + "px")
// 			   .style("top", topLeft[1] + "px");

// 		  g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

// 		  feature.attr("d", path);
// 	 }

// 	 // Use Leaflet to implement a D3 geometric transformation.
// 	 function projectPoint(x, y) {
// 		  var point = map.latLngToLayerPoint(new L.LatLng(y, x));
// 		  this.stream.point(point.x, point.y);
// 	 }
// });
