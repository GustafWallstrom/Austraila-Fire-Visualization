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
var startDate = '2020/01/22';
var endDate = '2020/03/08';
var currentDate = '3/8/20';
var number = 0;
var start = new Date(startDate).getTime();
var end = new Date(endDate).getTime();
console.log(end);
var step = 86400000;

var state = 'confirmed';
var coordinatesArray = [];
var conData = [];
const log = console.log;
// Initialize map
var svgPlot = d3.select('#map').append('svg').attr('width', width + margin.left + margin.right).attr('height', height);
var basemap = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});
let myLayerOptions = {
	pointToLayer: createCircles,
	coordsToLatLng: (coords) => {
		return new L.LatLng(coords[0], coords[1], coords[2]);
	}
};
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
var amountOfDays = 0;
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
	amountOfDays = getTotalDays(confirmedData[0].features);
	coordinatesArray = getCoordinatesArray(confirmedData[0].features);
	conData = confirmedData[0].features;
	getList(confirmedData[0], 'confirmed');
	getList(deathsData[0], 'deaths');
	getList(recoveredData[0], 'recovered');
	helper.updateConfirmedTotal(confirmedData[0]);
	helper.updateDeathsTotal(deathsData[0]);
	helper.updateRecoveredTotal(recoveredData[0]);

	/* ------------------      Graph      ----------------------- */
	/**
   * Graph which shows data over time
   */

	var dateArray = [];
	var datePredictArray = [];
	var confirmedArray = [];
	var deathArray = [];
	var recoveredArray = [];

	// Fill datePredictArray with strings containing all days + 11 for labelling
	for (let index = 0; index < amountOfDays + 11; index++) {
		const tempDate = new Date(parseInt(start + index * step));
		if (index < amountOfDays) dateArray[index] = tempDate.getMonth() + 1 + '/' + tempDate.getDate() + '/20';
		datePredictArray[index] = tempDate.getMonth() + 1 + '/' + tempDate.getDate() + '/20';
	}
	log(datePredictArray);
	// Fill chart arrays with x,y values -> (time, cases)
	// log(dateArray.length); TOTAL amount of days in datasets
	for (let index = 0; index < dateArray.length; index++) {
		confirmedArray[index] = getTotalSum(confirmedData[0].features, dateArray[index]);
		deathArray[index] = getTotalSum(deathsData[0].features, dateArray[index]);
		recoveredArray[index] = getTotalSum(recoveredData[0].features, dateArray[index]);
	}
	/* ------------------      PREDICTION      ----------------------- */
	/**
   * Calculate a prediction for the number of infected persons.
   */

	// Fill new array for calculating regression
	var confirmedDaysArray = [];

	for (let index = 0; index < amountOfDays; index++) {
		confirmedDaysArray[index] = [ index, confirmedArray[index] ];
	}

	var predictArray = regression.linear(confirmedDaysArray);
	var predictExp = regression.exponential(confirmedDaysArray);
	log(predictArray);
	log(predictExp);
	// Fill new arrays for easier calculations
	var newPredictArray = [];
	var newPredictExp = [];
	predictArray.points.map((item) => {
		newPredictArray[item[0]] = item[1];
	});
	predictExp.points.map((item) => {
		newPredictExp[item[0]] = item[1];
	});

	var predictionLength = 10;
	// log(amountOfDays);
	for (let index = 0; index < amountOfDays + predictionLength; index++) {
		// amountOfDays - predictionLength because we want to show earlier data, not only current date and forward
		if (index >= amountOfDays - predictionLength) {
			newPredictArray[index] = (2540.19 * index + -5392.65).toFixed(0);
			newPredictExp[index] = (17945.21 * Math.exp(0.04 * index)).toFixed(0);
		} else {
			// remove 10 first slots in arrays because they cross x-axis
			newPredictArray.splice(0, 5);
			newPredictExp.splice(0, 5);
		}
	}

	/* ------------------      Graph  2     ----------------------- */
	/**
   * Graph which shows data over time
   */

	var chartType = 'linear';
	// Margin between legend and chart
	Chart.Legend.prototype.afterFit = function() {
		this.height = this.height + 20;
	};
	// Legend click handler
	var defaultLegendClickHandler = Chart.defaults.global.legend.onClick;
	var newLegendClickHandler = function(e, legendItem) {
		var index = legendItem.datasetIndex;
		if (index > 4) {
			// Do the original logic
			defaultLegendClickHandler(e, legendItem);
		} else {
			let ci = this.chart;
			if (ci.getDatasetMeta(legendItem.datasetIndex).hidden === null) {
				ci.getDatasetMeta(legendItem.datasetIndex).hidden = !ci.data.datasets[index].hidden;
			} else if (ci.getDatasetMeta(legendItem.datasetIndex).hidden === false) {
				ci.getDatasetMeta(legendItem.datasetIndex).hidden = true;
			} else {
				ci.getDatasetMeta(legendItem.datasetIndex).hidden = false;
			}
			ci.update();
		}
	};

	var ctx = document.getElementById('line-chart');
	var config = {
		type: 'line',
		data: {
			labels: datePredictArray,
			datasets: [
				{
					data: confirmedArray,
					label: 'Confirmed',
					borderColor: 'khaki',
					pointBackgroundColor: 'khaki',
					yAxisID: 'first-y-axis'
				},
				{
					data: deathArray,
					label: 'Deaths',
					borderColor: '#d10000',
					pointBackgroundColor: '#d10000'
				},
				{
					data: recoveredArray,
					label: 'Recovered',
					borderColor: 'green',
					pointBackgroundColor: 'green'
				},
				{
					data: newPredictArray,
					label: 'Linear Prediction',
					borderColor: 'darkviolet',
					pointBackgroundColor: 'darkviolet',
					borderDash: [ 3 ]
				},
				{
					data: newPredictExp,
					label: 'Exp. Prediction',
					borderColor: 'hotpink',
					pointBackgroundColor: 'hotpink',
					borderDash: [ 3 ]
				}
			]
		},
		options: {
			title: {
				display: true,
				text: 'Graph of cases over time.'
			},
			scales: {
				xAxes: [
					{
						ticks: {
							autoSkip: true,
							maxTicksLimit: 20.1
						},
						gridLines: {
							display: true
						}
					}
				],
				yAxes: [
					{
						id: 'first-y-axis',
						type: chartType
					}
				]
			},
			layout: {
				padding: {
					top: 20
				}
			},
			elements: {
				line: {
					tension: 0.5
				}
			},
			legend: {
				onClick: newLegendClickHandler
			}
		}
	};
	// Create chart
	var dataChart = new Chart(ctx, config);

	$('#linear').click(function() {
		chartType = 'linear';
		if (dataChart) {
			dataChart.destroy();
		}
		config.options.scales.yAxes[0].type = chartType;
		config.options.scales.yAxes[0].ticks = {
			ticks: {
				min: 0,
				max: 180000
			}
		};
		dataChart = new Chart(ctx, config);
	});
	$('#logarithmic').click(function() {
		chartType = 'logarithmic';
		if (dataChart) {
			dataChart.destroy();
		}
		config.options.scales.yAxes[0].type = chartType;
		config.options.scales.yAxes[0].ticks = {
			min: 0,
			max: 1000000,
			callback: function(value, index, values) {
				if (value === 1000000) return '1M';
				if (value === 100000) return '100K';
				if (value === 10000) return '10K';
				if (value === 1000) return '1K';
				if (value === 100) return '100';
				if (value === 10) return '10';
				if (value === 0) return '0';
				return null;
			}
		};
		dataChart = new Chart(ctx, config);
	});
});
function getList(data, name) {
	var casesList = [];
	var cleanList = [];
	var merged = {
		rows: []
	};
	data.features.forEach((sourceRow) => {
		if (
			!merged.rows.some((row) => {
				return row.key[0] == sourceRow.properties['Country/Region'];
			})
		) {
			merged.rows.push({
				key: [ sourceRow.properties['Country/Region'] ],
				value: sourceRow.properties[currentDate]
			});
		} else {
			var targetRow = merged.rows.filter((targetRow) => {
				return targetRow.key[0] == sourceRow.properties['Country/Region'];
			});
			targetRow[0].value += sourceRow.properties[currentDate];
		}
	});
	merged.rows.sort(compare).map((item) => {
		casesList.push('<span id="' + name + 'List">' + item.value + '</span> ' + item.key);
	});
	merged.rows.sort(compare).map((item) => {
		cleanList.push([ item.key[0], item.value ]);
	});

	var ul = document.createElement('ul');
	ul.setAttribute('id', name + 'CaseList');
	document.getElementById(name + 'CaseContainer').appendChild(ul);
	casesList.forEach(renderCasesList);

	function renderCasesList(element, index, arr) {
		var percentage = getPercentage(cleanList, index);
		var color = getColor(name);
		var li = document.createElement('li');
		li.setAttribute('id', index);
		li.setAttribute('class', name + 'CaseItem');
		li.style.setProperty('--percentage-color', color);
		li.style.setProperty('--percentage-confirmed', percentage + '%');
		li.addEventListener('click', moveMap);
		li.innerHTML += element;
		ul.appendChild(li);
	}
}
function moveMap(e) {
	var ele = e.target;
	var withoutNumbers = ele.innerText.replace(/[0-9]/g, '');
	coordinates = getCoordinates(conData, withoutNumbers);
	map.setView(coordinates[0], 3);
}

/* ------------------      SLIDER FUNCTIONALITY       ----------------------- */
/**
 * What happens when we use the date slider
 */

d3.select('#date-value').text('Sunday, 8/3/2020');
d3.select('#dateSlider').on('input', function() {
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
	// Because of leading zero before march's days (from dataset)
	// if (month == 3 && date < 10) {
	// 	currentDate = month + '/0' + date + '/20';
	// } else {
	// 	currentDate = month + '/' + date + '/20';
	// }
	currentDate = month + '/' + date + '/20';
	// Draw new circles
	$.getJSON('data/' + state + '.geojson', (data) => {
		data.features.map((item) => {
			var location = item.geometry.coordinates.reverse();
			number = item.properties[currentDate];
			location.push(number);
			return location;
		});
		//
		drawMapLayers(data);
	});

	//helper.updateConfirmedTotal(confirmedData[0]);
});

/* ------------------      DRAW CIRCLES       ----------------------- */
/**
 * Render circles on map
 */

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
				dateSlider.style.setProperty('--slider-color', 'green');
				break;
			}
			case 'deaths':
				circleColor = 'red';
				confirmed.style.setProperty('--button-color', '#222222');
				deaths.style.setProperty('--button-color', '#d10000');
				recovered.style.setProperty('--button-color', '#222222');
				confirmed.style.setProperty('--text-color', 'white');
				dateSlider.style.setProperty('--slider-color', 'red');
				break;
			default:
				circleColor = 'khaki';
				recovered.style.setProperty('--button-color', '#222222');
				deaths.style.setProperty('--button-color', '#222222');
				confirmed.style.setProperty('--button-color', 'khaki');
				confirmed.style.setProperty('--text-color', 'black');
				dateSlider.style.setProperty('--slider-color', 'khaki');
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

	result.on('mouseover', (e) => {
		var place = '';
		if (feature.properties['Province/State'].length == 0) {
			place = feature.properties['Country/Region'];
		} else {
			place = feature.properties['Province/State'];
		}
		L.popup()
			.setLatLng(latlng)
			.setContent(capitalizeFLetter(state) + ': ' + e.target._latlng.alt + '</br> Location: ' + place)
			.openOn(map);
	});
	result.on('mouseout', (e) => {
		map.closePopup();
	});
	return result;
}

/* ------------------      HELPER FUNCTIONS/MISC      ----------------------- */
function capitalizeFLetter(input) {
	var string = input;
	string = string[0].toUpperCase() + string.slice(1);
	return string;
}
function processData(data) {
	data.features.map((item) => {
		var location = item.geometry.coordinates.reverse();
		number = item.properties[currentDate];
		location.push(number);
		return location;
	});
}
function drawMapLayers(data) {
	map.eachLayer((layer) => {
		if (!layer._url) {
			map.removeLayer(layer);
		}
	});
	log(myLayerOptions);
	log(data);
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
function getTotalDays(data) {
	var totalDays = 0;
	Object.size = (obj) => {
		var size = 0,
			key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	};
	var size = Object.size(data[0].properties);
	totalDays = size - 2;
	return totalDays;
}
function getTotalSum(data, index) {
	var totalSum = 0;
	data.map((item) => {
		totalSum += item.properties[index];
	});
	return totalSum;
}
function getPercentage(data, index) {
	var percentage = 0.0;
	const max = 88371;
	percentage = 90 * data[index][1] / max + 4;
	return percentage.toFixed(2);
}
function getCoordinatesArray(data) {
	var arr = [];
	data.map((item) => {
		arr.push([ item.geometry.coordinates[0], item.geometry.coordinates[1] ]);
	});
	return arr;
}
function getCoordinates(data, index) {
	var result = [];
	data.forEach((key) => {
		if (key.properties['Country/Region'].trim() === index.trim()) {
			result.push([ key.geometry.coordinates[0], key.geometry.coordinates[1] ]);
		}
	});
	return result;
}
function getColor(state) {
	switch (state) {
		case 'recovered':
			return 'green';
		case 'deaths':
			return 'red';
		default:
			return 'khaki';
	}
}
