var helper = (function() {
	function updateConfirmedTotal(data, amountOfDays) {
		var sum = 0;

		data.features.map((rat) => {
			var number = rat.properties[currentDate];
			sum += number;
		});

		document.getElementById('totalNoConfirmed').innerHTML = sum;
	}
	function updateDeathsTotal(data, amountOfDays) {
		var sum = 0;

		data.features.map((rat) => {
			var number = rat.properties[currentDate];
			sum += number;
		});

		document.getElementById('totalNoDeaths').innerHTML = sum;
	}
	function updateRecoveredTotal(data, amountOfDays) {
		var sum = 0;

		data.features.map((rat) => {
			var number = rat.properties[currentDate];
			sum += number;
		});

		document.getElementById('totalNoRecovered').innerHTML = sum;
	}

	//return an object that represents our new module
	return {
		updateConfirmedTotal: updateConfirmedTotal,
		updateDeathsTotal: updateDeathsTotal,
		updateRecoveredTotal: updateRecoveredTotal
	};
})();
