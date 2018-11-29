// MapLoader.js
// Map library for Terra Eyes
// (c) 2018 Hongbo Wang
// Copyright © 1998 - 2018 Tencent. All Rights Reserved.

var MAP;
var ZOOM;

var ADDRESS_POINT;
var ADDRESS;

function addMarker(map, point, text, color = "http://webapi.amap.com/theme/v1.3/markers/n/mark_b.png") {
	var icon = new qq.maps.MarkerImage(color);
	var marker = new qq.maps.Marker({
		position: point,
		animation: qq.maps.MarkerAnimation.DROP,
		map: map
	});

	marker.setIcon(icon);
	marker.setShadow(null);

	qq.maps.event.addListener(marker, 'click', function() {
		var info = new qq.maps.InfoWindow({
			map: map
		});
		info.open();
		info.setContent('<div style="text-align:center;white-space:nowrap;' +
			'margin:10px;">' + text + '</div>');
		info.setPosition(marker.getPosition());
	});
}


function layerOfMarker(map, data, radius = null, circle = false, color = '#FA5858') {

	if (radius === null) {
		radius = [3000];
		console.log("in null");
	}

	console.log("a" + color);

	console.log(radius);
	for (var i = 0; i < data.length; i++) {
		var point = new qq.maps.LatLng(data[i].lat, data[i].lng);
		addMarker(map, point, data[i].详细);
		if (circle) {
			for (var j = 0; j < radius.length; ++j) {
				console.log("b" + color);
				addCircle(map, point, radius[j], fillWeight = 0.04, color = color);
			}
		}
	}
	console.log("Layer label Done");
}


function addCircle(map, point, radius, fillWeight = 0.05, color = '#FA5858', option = "other") {
	if (option == "bubble") {
		var option = {
			map: map,
			center: point,
			radius: radius,
			strokeWeight: 0,
			strokeColor: color,
			cursor: 'pointer',
			visible: true,
			fillColor: qq.maps.Color.fromHex(color, 0.5)
		}
	} else if (option == "circle") {
		var option = {
			map: map,
			center: point,
			radius: radius,
			strokeWeight: 3,
			strokeDashStyle: 'dash',
			cursor: 'pointer',
			visible: true,
			fillColor: qq.maps.Color.fromHex(color, 0.0000001),
			zIndex: 1000
		}
	} else {
		var option = {
			map: map,
			center: point,
			radius: radius,
			strokeColor: '#5858FA',
			fillColor: qq.maps.Color.fromHex(color, fillWeight),
			strokeDashStyle: 'dash',
			strokeWeight: 1.0
		}
	}
	var circle = new qq.maps.Circle(option);
	return circle;
}


function layerOfBubble(data, max_bubble = 500) {

	var data_sort = quickSort(data);
	data_sort.pop();
	var data_max = data_sort[0]["分数"]
	var data_min = data_sort[data_sort.length - 1]["分数"]
	var radius_max = 800;
	var radius_min = 50;

	for (var i = 0; i < data_sort.length && i < max_bubble; ++i) {
		let point = new qq.maps.LatLng(data_sort[i]["lat"], data_sort[i]["lng"]);
		var radius = ((parseInt(data_sort[i]["分数"]) - data_min) /
			(data_max - data_min)) * (radius_max - radius_min) + radius_min;
		if (radius != NaN) {
			var circle = addCircle(MAP, point, radius, fillWeight = 0.5, color = '#FA5858', option = "bubble");
			qq.maps.event.addListener(circle, 'click', function() {
				var info = new qq.maps.InfoWindow({
					map: MAP
				});
				info.open();
				info.setContent('<div style="text-align:center;white-space:nowrap;' +
					'margin:10px;">' + "量级：" + data_sort[i]["分数"] +
					"<br>半径：" + radius.toFixed(2) + '</div>');
				info.setPosition(point);
			});
		}
	}
}


function addLabel(map, point, text, offsetOrNot, color = "#242424", backgroundColor = "") {
	var cssC = {
		color: color,
		fontWeight: "bold",
	}
	if (offsetOrNot) {
		var label = new qq.maps.Label({
			map: map,
			content: text,
			position: point,
			style: cssC
		});
	} else {
		var label = new qq.maps.Label({
			map: map,
			content: text,
			position: point,
			style: cssC,
			offset: new qq.maps.Size(0, 10)
		});
	}
}


function layerOfHeat(map, data, valueField = "分数", radius = 1, maxOpacity = 0.8) {
	qq.maps.event.addListenerOnce(map, "idle", function() {
		if (QQMapPlugin.isSupportCanvas) {
			options = {
				"radius": radius,
				"maxOpacity": maxOpacity,
				"useLocalExtrema": false,
				"valueField": valueField
			};

			heatmap = new QQMapPlugin.HeatmapOverlay(map, options);
			heatmap.setData(data);
		} else {
			alert("您的浏览器不支持canvas，无法绘制热力图！！");
		}
	});
}


function addPolygon(map, polygon_array, color, score, raw_score, center) {
	var polygon = new qq.maps.Polygon({
		map: map,
		path: polygon_array,
		strokeColor: color,
		strokeWeight: 0,
		fillColor: qq.maps.Color.fromHex(color, score)
	});

	qq.maps.event.addListener(polygon, 'mouseover', function() {
		var info = new qq.maps.InfoWindow({
			map: map
		});
		info.open();
		info.setContent('<div style="text-align:center;white-space:nowrap;' + 'margin:10px;">' +
			"量级：" + raw_score +
			"<br>浓度：" + score.toFixed(2) + '</div>');
		info.setPosition(center);

		qq.maps.event.addListener(polygon, 'mouseout', function() {
			info.close();
		});
	});
}


function layerOfGeohash(map, geohash, level, concentration, raw_score) {
	this.box = decodeGeoHash(geohash);
	color = getColr(level);

	var polygonArr = new Array(
		new qq.maps.LatLng(this.box.latitude[1] * 1.0, this.box.longitude[0] * 1.0),
		new qq.maps.LatLng(this.box.latitude[1] * 1.0, this.box.longitude[1] * 1.0),
		new qq.maps.LatLng(this.box.latitude[0] * 1.0, this.box.longitude[1] * 1.0),
		new qq.maps.LatLng(this.box.latitude[0] * 1.0, this.box.longitude[0] * 1.0)
	);
	var center = new qq.maps.LatLng((this.box.latitude[1] + this.box.latitude[0]) / 2.0,
		(this.box.longitude[1] + this.box.longitude[0]) / 2);
	addPolygon(map, polygonArr, color, concentration, raw_score, center);
}


function addressToLatLng(address) {
	geocoder = new qq.maps.Geocoder();
	geocoder.getLocation(address);
	geocoder.setComplete(function(result) {
		ADDRESS_POINT = result.detail.location;
	});
}


function loadMap(point, zoom = 3, mapTypeId = qq.maps.MapTypeId.ROADMAP) {
	mapContainer = document.getElementById("map-canvas");
	options = {
		center: point,
		zoom: zoom,
		noClear: true,
		mapStyleId: 'style1',
		mapTypeId: mapTypeId,
		zoomControl: true,
		zoomControlOptions: {
			position: qq.maps.ControlPosition.TOP_LEFT
		},
		scaleControl: true,
		scaleControlOptions: {
			position: qq.maps.ControlPosition.BOTTOM_RIGHT
		}
	};
	MAP = new qq.maps.Map(mapContainer, options);
}


// ---------------------------- main -----------------------------------------------


function run(pointer = false, data = HEAT_JSON) {
	var js = document.scripts;
	console.log(js[js.length - 2].src);
	let path = js[js.length - 1].src.substring(0, js[js.length - 1].src.lastIndexOf("/"))
	path = path.substring(0, path.lastIndexOf("bin")) + "/css/icon/";
	console.log(path);

	map_data = {
		max: 100,
		data: data
	};

	if (pointer) {
		console.log("pointer map");
		let latlng = userInputLatLng();
		let point = new qq.maps.LatLng(latlng[0], latlng[1]);
		loadMap(point, zoom = 14);
		addMarker(MAP, point, "Marker", color = path + "pointer.png");
	} else {
		addressToLatLng(LOCATION_SELECT);
		loadMap(ADDRESS_POINT, zoom = 10);
	}

	if (map_data.data !== undefined) {
		layerOfHeat(MAP, map_data);
	}
	if (STORE_JSON !== undefined) {
		layerOfMarker(MAP, STORE_JSON, maker_color = path + "tuhu.png");
	}
	if (COMPA_JSON !== undefined) {
		layerOfMarker(MAP, COMPA_JSON, maker_color = path + "maint.png");
	}
	if (COMPA_JSON2 !== undefined) {
		layerOfMarker(MAP, COMPA_JSON2, maker_color = path + "comp.png");
	}
}


function run_point(data = TEXT_DATA) {
	var point = new qq.maps.LatLng(data[0].lat, data[0].lng);
	let circle_length_1 = clickCircleList("circle_1");
	let circle_length_2 = clickCircleList("circle_2");
	let circle_length_3 = clickCircleList("circle_3");

	let color = clickColorList("color-dd");
	let radius = [circle_length_1, circle_length_2, circle_length_3];

	loadMap(point, zoom = 14);
	layerOfMarker(MAP, data, radius = radius, circle = true, color = color);
}


function runHeat(pointer = false, data = HEAT_JSON, store = TEXT_DATA) {
	var js = document.scripts;
	let path = js[js.length - 1].src.substring(0, js[js.length - 1].src.lastIndexOf("/"))
	path = path.substring(0, path.lastIndexOf("bin")) + "/css/icon/";

	var power = parseInt(document.getElementById("heat-power").value);
	var m_name = document.getElementById("marker-name").value;

	let circle_length_1 = clickCircleList("circle_1");
	let circle_length_2 = clickCircleList("circle_2");
	let circle_length_3 = clickCircleList("circle_3");
	let radius = [circle_length_1, circle_length_2, circle_length_3];

	map_data = {
		max: power,
		data: data
	};

	if (pointer) {
		console.log("pointer map");
		let latlng = userInputLatLng();
		var point = new qq.maps.LatLng(latlng[0], latlng[1]);
		loadMap(point, zoom = 14);
	} else {
		addressToLatLng(LOCATION_SELECT);
		loadMap(ADDRESS_POINT, zoom = 10);
	}

	layerOfHeat(MAP, map_data);

	if (pointer) {
		addMarker(MAP, point, m_name, color = path + "pointer.png");
		for (var j = 0; j < radius.length; ++j) {
			addCircle(MAP, point, radius[j], fillWeight = 0.04,
				color = "#0040FF", option = "circle");
		}
	}

	if (store !== undefined){
		layerOfMarker(MAP, store, radius = radius, circle = true);
	}
}


function runBubble(pointer = false, data = HEAT_JSON, store = TEXT_DATA, length = 100) {
	var js = document.scripts;
	let path = js[js.length - 1].src.substring(0, js[js.length - 1].src.lastIndexOf("/"))
	path = path.substring(0, path.lastIndexOf("bin")) + "/css/icon/";

	let circle_length_1 = clickCircleList("circle_1");
	let circle_length_2 = clickCircleList("circle_2");
	let circle_length_3 = clickCircleList("circle_3");
	let radius = [circle_length_1, circle_length_2, circle_length_3];

	var m_name = document.getElementById("marker-name").value;

	if (pointer) {
		console.log("pointer map");
		let latlng = userInputLatLng();
		var point = new qq.maps.LatLng(latlng[0], latlng[1]);
		loadMap(point, zoom = 14);

	} else {
		addressToLatLng(LOCATION_SELECT);
		loadMap(ADDRESS_POINT, zoom = 10);
	}

	layerOfBubble(data);

	if (pointer) {
		addMarker(MAP, point, m_name, color = path + "pointer.png");
		for (var j = 0; j < radius.length; ++j) {
			addCircle(MAP, point, radius[j], fillWeight = 0.04,
				color = "#0040FF", option = "circle");
		}
	}

	if (store !== undefined){
		layerOfMarker(MAP, store, radius = radius, circle = true);
	}
}


function run_geohash(data_geohash = GEOHASH_JSON, pointer = false, filter = 30, gaussian = true) {
	let data = [];
	let score_array = [];
	for (var i = 0; i < data_geohash.length; ++i) {
		var tmp_score = parseInt(data_geohash[i]["分数"]);
		if (tmp_score >= filter) {
			data.push(data_geohash[i]);
			score_array.push(tmp_score);
		}
	}
	let mean = average(score_array);
	let std = standardDeviation(score_array)

	var data_sort = quickSort(data);
	data_sort.pop(data_sort);

	if (pointer) {
		console.log("pointer map");
		let latlng = userInputLatLng();
		let point = new qq.maps.LatLng(latlng[0], latlng[1]);
		loadMap(point, zoom = 14);
	} else {
		var point = decodeGeoHash(data_sort[0]['geohash'])
		var center = new qq.maps.LatLng(point.latitude[1], point.longitude[1]);
		loadMap(center, zoom = 13);
	}

	if (STORE_JSON !== undefined) {
		layerOfMarker(MAP, STORE_JSON, circle = true);
	}

	if (gaussian) {
		var data_max = (parseInt(data_sort[0]["分数"]) - mean) / std;
		var data_min = (parseInt(data_sort[data_sort.length - 1]["分数"] - mean)) / std;
		var radius_max = 1.00;
		var radius_min = 0.05;

		for (var i = 0; i < data_sort.length; ++i) {
			var geohash = data_sort[i]["geohash"];
			var raw_score = data_sort[i]["分数"];
			var normal_score = ((parseInt(raw_score) - mean) / std);
			var score = ((normal_score - data_min) /
				(data_max - data_min)) * (radius_max - radius_min) + radius_min;
			layerOfGeohash(MAP, geohash, 0.92, score, raw_score);
		}
	} else {
		var data_max = data_sort[0]["分数"];
		var data_min = data_sort[data_sort.length - 1]["分数"];
		var radius_max = 1.00;
		var radius_min = 0.05;

		for (var i = 0; i < data_sort.length; ++i) {
			var geohash = data_sort[i]["geohash"];
			var raw_score = data_sort[i]["分数"];
			var score = ((parseInt(raw_score) - data_min) /
				(data_max - data_min)) * (radius_max - radius_min) + radius_min;
			layerOfGeohash(MAP, geohash, 0.92, score, raw_score);
		}
	}
}