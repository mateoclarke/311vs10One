// Leaflet Map

// create Leaflet Map
var map = L.map('map', {
	center: [30.25, -97.75], //Austin!
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
		layer.bindPopup('District ' + feature.properties.DISTRICT_N);
	}
}).addTo(map);

districtLayer.on('click', function onDistrictClick(e) {
	var lat = e.latlng.lat,
		lon = e.latlng.lng,
		matchingDistricts = districtToLayer(lat, lon),
		leDistrict = matchingDistricts[0],
		district_id = leDistrict.properties.DISTRICT_N;

	console.log('matchingDistricts', matchingDistricts);
	console.log('leDistrict', leDistrict.properties.DISTRICT_N);

	var url = 'https://data.austintexas.gov/resource/i26j-ai4z.json?$select=sr_type_desc,count%28sr_number%29&$group=sr_type_desc&$where=sr_location_council_district=%27' + district_id + '%27%20and%20sr_created_date%20%3E=%20%272014-05-30%27%20and%20sr_created_date%20%3C%20%272014-05-31%27&$order=count_service_request_sr_number%20desc';

	console.log('GET', url, 'for district', district_id);

	$.ajax({
		method: 'GET',
		url: url,
	}).done(function(data, status) {
		console.log('done', status, data)
		console.log("ready to populate table");
		console.log(data[0].sr_type_desc);
		console.log(data[0].count_service_request_sr_number);
		for (var i = 5; i >= 0; i--) {
			$('.SR-'+i+'-type').text(data[i].sr_type_desc);
			$('.SR-'+i+'-count').text(data[i].count_service_request_sr_number);
		};
	}).fail(function(xhr, status, err) {
		console.error('fail', status, err);
	});


});

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









