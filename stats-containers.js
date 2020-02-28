// Get value for total confirmed

$.getJSON("data/confirmed.geojson", (data) => {

    var sum = null;

    data.features.map((rat) => {
        var location = rat.geometry.coordinates.reverse();
        var number = rat.properties['2/20/20'];
        sum += number;
    });

    document.getElementById('totalNoConfirmed').innerHTML = sum;

});

// Get value for total deaths

$.getJSON("data/deaths.geojson", (data) => {

    var sum = null;

    data.features.map((rat) => {
        var location = rat.geometry.coordinates.reverse();
        var number = rat.properties['2/20/20'];
        sum += number;
    });

    document.getElementById('totalNoDeaths').innerHTML = sum;

});

// Get value for total recovered

$.getJSON("data/recovered.geojson", (data) => {

    var sum = null;

    data.features.map((rat) => {
        var location = rat.geometry.coordinates.reverse();
        var number = rat.properties['2/20/20'];
        sum += number;
    });

    document.getElementById('totalNoRecovered').innerHTML = sum;

});