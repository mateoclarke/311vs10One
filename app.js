// Date picker
$( "#date-from" ).datepicker(); 
$( "#date-from" ).datepicker( "setDate", "-28" ); 
$( "#date-to" ).datepicker(); 
$( "#date-to" ).datepicker( "setDate", "0" ); 
console.log($( "#date-to" ).datepicker( "getDate" ));

// Leaflet Map
// create Leaflet Map
var map = L.map('map', {
	center: [30.304539565829106, -97.73300170898438], //Austin!
	zoom: 10,
	scrollWheelZoom: false
});

//  add tile Layer from Mapquest
L.tileLayer(
	'http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg'
).addTo(map);

// add colors to different districts
function getColor(d) {
	return d > 9 ? '#8dd3c7' :
		d > 8 ? '#ffffb3' :
		d > 7 ? '#bebada' :
		d > 6 ? '#fb8072' :
		d > 5 ? '#80b1d3' :
		d > 4 ? '#fdb462' :
		d > 3 ? '#b3de69' :
		d > 2 ? '#fccde5' :
		d > 1 ? '#98e986' :
		'#bc80bd';
}

// adding district shapefiles to Map
var districtLayer = L.geoJson(districts, {
	style: function style(feature) {
		return {
			fillColor: getColor(feature.properties.DISTRICT_N),
			weight: 2,
			opacity: 1,
			color: 'white',
			dashArray: '3',
			fillOpacity: 0.8,
		};
	},
	onEachFeature: function onEachFeature(feature, layer) {
		// layer.bindPopup('District ' + feature.properties.DISTRICT_N);
		layer.on({
		        click: highlightFeature
		    });
	}
}).addTo(map);

// Clicking a specific district on the Map results in an 
// AJAX call to get Service Request data from that district
districtLayer.on('click', function onDistrictClick(e) {
	var lat = e.latlng.lat,
		lon = e.latlng.lng,
		matchingDistricts = districtToLayer(lat, lon);
  window.leDistrict = matchingDistricts[0];
  window.currentDistrict = leDistrict.properties.DISTRICT_N;
		districtId = leDistrict.properties.DISTRICT_N,
		date_from = $( "#date-from" ).datepicker( "getDate").toISOString(),
        date_to = $( "#date-to" ).datepicker( "getDate" ).toISOString();

		console.log('You clicked on a point with these coordinates: ' + lat, lon);
		console.log('That point exists inside District ' + districtId + ' represented by this shape object: ', matchingDistricts);

	var url = 'https://data.austintexas.gov/resource/i26j-ai4z.json?$select=sr_type_desc,count%28sr_number%29&$group=sr_type_desc&$where=sr_location_council_district=%27' + districtId + '%27%20and%20sr_created_date%20%3E=%20%27' + date_from.slice(0, 10) + '%27%20and%20sr_created_date%20%3C%20%27' + date_to.slice(0, 10) + '%27&$order=count_service_request_sr_number%20desc'
	console.log('GET', url);

	markers.clearLayers();

	$.ajax({
		method: 'GET',
		url: url,
	}).done(function(data, status) {
		console.log('DONE: Status is ', status, data)
		console.log('These are the results for District ' + districtId)
		$('.district-title').text('District ' + districtId );
		$('.thead-1').text('Service Type');
		$('.thead-2').text('Count')
		$('.thead-3').text('Map')
		for (var i = 0; i < 15; i++) {
			$('.SR-'+i+'.type').text(data[i].sr_type_desc);
			$('.SR-'+i+'.count').text(data[i].count_service_request_sr_number);
			$('.SR-'+i+'.plot').html("<a href='#'>Map Data</a>");
		};
	}).fail(function(xhr, status, err) {
		console.error('fail', status, err);
	});
});

// Hover highlight feature
	function highlightFeature(e) {
		districtLayer.eachLayer( function resetHighlight(layer) {
		    districtLayer.resetStyle(layer);
		    info.update();
	});

    var layer = e.target;

    layer.setStyle({
        weight: 2,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
    info.update(layer.feature.properties);
    map.fitBounds(e.target.getBounds());
}

// info controls on map
var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

	// method that we will use to update the control based on feature properties passed
info.update = function (property) {
    this._div.innerHTML = '<h4>311 Data by Austin City Council Districts</h4>' +  (property ?
        '<b>District ' + property.DISTRICT_N + '</b><br />'
        : 'Click on a district');
};

info.addTo(map);

// plots 311 points to district polygon in map
var markers = new L.layerGroup();

$('.service-request-cat').on('click', function () {
	var self = $(this),
			sr_type_desc = self.find('.type').text(),
			date_from = $( "#date-from" ).datepicker( "getDate").toISOString(),
      date_to = $( "#date-to" ).datepicker( "getDate" ).toISOString();
			url = 'http://data.austintexas.gov/resource/i26j-ai4z.json?$where=sr_type_desc=\'' + sr_type_desc  + '\'%20and%20sr_location_council_district=\'' + currentDistrict + '\'and%20sr_created_date%20%3E=%20%27' + date_from.slice(0, 10) + '%27%20and%20sr_created_date%20%3C%20%27' + date_to.slice(0, 10)  + '\'';

	console.log(self);
	console.log('Looking up ' + sr_type_desc + ' Service Requests');
	console.log('in ' + leDistrict);
	console.log('GET', url, 'for specific cat in district');

	markers.clearLayers();
	console.log(markers);

	$.ajax({
		method: 'GET',
		url: url,
	}).done(function(data, status) {
		console.log('done with sr_cat specific call:', status, data);
		console.log([data[0].sr_location_lat, data[0].sr_location_long]);


		for (var i = data.length - 1; i >= 0; i--) {
			var marker = L.marker([data[i].sr_location_lat, data[i].sr_location_long]);
			markers.addLayer(marker);
			// console.log(markerLayer);
		};
			map.addLayer(markers);
	}).fail(function(xhr, status, err) {
		console.error('fail', status, err);
	});
});


// function that helps us get a point within a polygon
function districtToLayer(lat, lon) {
	var point = {type: "Point", coordinates: [lon, lat]};

	return districts.features.filter(function(dist) {
		var shape = dist.geometry;

		if (shape.type === 'Polygon') {
			return gju.pointInPolygon(point, shape);;
		}
		else return gju.pointInMultiPolygon(point, shape);
	});

}




