/*
global
alertify: false
L: false
labels: false
layers: false
links: false
link_colors: false
markersArray: true
devices: false
parameters: false
partial: false
polylinesArray: true
showModal: false
showObjectModal: false
selection: true
device_subtypes: false
view: false
*/

let markers;

const map = L.map('mapid').setView(
  [parameters.default_latitude, parameters.default_longitude],
  parameters.default_zoom_level
);
const osmLayer = L.tileLayer(layers['osm']);
map.addLayer(osmLayer);
let currentLayer = osmLayer;
if (view == 'markercluster') {
  markers = L.markerClusterGroup();
}

/**
 * Change the tile layer.
 * @param {layer} layer - tile layer.
 */
function switchLayer(layer) {
  map.removeLayer(currentLayer);
  currentLayer = L.tileLayer(layers[layer]);
  map.addLayer(currentLayer);
  $('.dropdown-submenu a.menu-layer').next('ul').toggle();
}

Object.keys(device_subtypes).forEach(function(subtype) {
  window[`icon_${subtype}`] = L.icon({
    iconUrl: `static/images/default/${subtype}.gif`,
    iconSize: [18, 12],
    iconAnchor: [9, 6],
    popupAnchor: [8, -5],
    });
  window[`icon_selected_${subtype}`] = L.icon({
    iconUrl: `static/images/selected/${subtype}.gif`,
    iconSize: [18, 12],
    iconAnchor: [9, 6],
    popupAnchor: [8, -5],
  });
});

// Create a new vector type with getLatLng and setLatLng methods.
L.PolylineClusterable = L.Polyline.extend({
  _originalInitialize: L.Polyline.prototype.initialize,
  initialize: function(bounds, options) {
    this._originalInitialize(bounds, options);
    this._latlng = this.getBounds().getCenter();
  },
  getLatLng: function() {
    return this._latlng;
  },
  setLatLng: function() {
    // setter
  },
});

for (let i = 0; i < devices.length; i++) {
  const device = devices[i];
  const marker = L.marker([
    device.latitude,
    device.longitude,
  ]);

  marker.device_id = device.id;
  marker.icon = window[`icon_${device.subtype}`];
  marker.selected_icon = window[`icon_selected_${device.subtype}`];
  marker.setIcon(marker.icon);
  markersArray.push(marker);

  marker.on('dblclick', function(e) {
    showObjectModal('device', this.device_id);
  });

  marker.on('click', function(e) {
    e.target.setIcon(e.target.selected_icon);
    selection.push(this.device_id);
    $('#devices').val(selection);
  });

  marker.bindTooltip(device[labels.device], {
    permanent: false,
  });

  if (view == 'leaflet') {
    marker.addTo(map);
  } else {
    markers.addLayer(marker);
    map.addLayer(markers);
  }
}

for (let i = 0; i < links.length; i++) {
  const link = links[i];
  let pointA = new L.LatLng(
    link.source_properties.latitude,
    link.source_properties.longitude
  );
  let pointB = new L.LatLng(
    link.destination_properties.latitude,
    link.destination_properties.longitude
  );

  const pointList = [pointA, pointB];
  const polyline = new L.PolylineClusterable(pointList, {
    color: link_colors[links[i].subtype],
    weight: 3,
    opacity: 1,
    smoothFactor: 1,
  });
  polylinesArray.push(polyline);
  polyline.link_id = link.id;
  polyline.on('dblclick', function(e) {
    showObjectModal('link', this.link_id);
  });
  polyline.bindTooltip(link[labels.link], {
    permanent: false,
  });
  if (view == 'leaflet') {
    polyline.addTo(map);
  } else {
    markers.addLayer(polyline);
  }
}

/**
 * Unselect all devices.
 */
function unselectAll() {
  for (let i = 0; i < markersArray.length; i++) {
    markersArray[i].setIcon(markersArray[i].icon);
  }
  selection = [];
  $('#devices').val(selection);
}

map.on('boxzoomend', function(e) {
  unselectAll();
  for (let i = 0; i < markersArray.length; i++) {
    if (e.boxZoomBounds.contains(markersArray[i].getLatLng())) {
      markersArray[i].setIcon(markersArray[i].selected_icon);
      selection.push(markersArray[i].device_id);
    }
  }
  $('#devices').val(selection);
});

map.on('click', function(e) {
  unselectAll();
});

// when a filter is selected, apply it
$('#select-filters').on('change', function() {
  $.ajax({
    type: 'POST',
    url: `/objects/pool_objects/${this.value}`,
    dataType: 'json',
    success: function(objects) {
      const devicesId = objects.devices.map((n) => n.id);
      const linksId = objects.links.map((l) => l.id);
      for (let i = 0; i < markersArray.length; i++) {
        if (devicesId.includes(markersArray[i].device_id)) {
          markersArray[i].addTo(map);
        } else {
          markersArray[i].removeFrom(map);
        }
      }
      for (let i = 0; i < polylinesArray.length; i++) {
        if (linksId.includes(polylinesArray[i].link_id)) {
          polylinesArray[i].addTo(map);
        } else {
          polylinesArray[i].removeFrom(map);
        }
      }
      alertify.notify('Filter applied.', 'success', 5);
    },
  });
});

const action = {
  'Parameters': partial(showModal, 'filters'),
  'Export to Google Earth': partial(showModal, 'google-earth'),
  'Add new task': partial(showModal, 'scheduling'),
  'Open Street Map': partial(switchLayer, 'osm'),
  'Google Maps': partial(switchLayer, 'gm'),
  'NASA': partial(switchLayer, 'nasa'),
};

$('body').contextMenu({
  menuSelector: '#contextMenu',
  menuSelected: function(invokedOn, selectedMenu) {
    const row = selectedMenu.text();
    action[row]();
  },
});
