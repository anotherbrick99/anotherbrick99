function plot(chartData, name, isDetailed) {
  var translations = chartData.translations;
  var xLabel = 'date';
  var yLabel = name;
  var xLabels = buildXLabels(chartData, xLabel);//chartData.xLabels;
  var dataToRender = Object.keys(chartData)
                      .filter(label => label.endsWith("Name"))
                      .map(name => name.replace(/Name$/, ""));
  var chartName = `chart_${name}`;
  var chart = window[chartName];
  var locale = chartData.locale;
  if (chart === undefined || true) {
    var config = {
      type: 'line',
      data: {
        labels: xLabels,
        datasets: datasets(dataToRender, xLabels, xLabel, yLabel)
      },
      options: {
        responsive: true,
        onClick: x => {
          if (isDetailed) return;

          plot(chartData, name, true);
          document.getElementById("chartModal").style.display = "block";
          document.getElementById("chartModal").focus();
        },
        title: {
          display: true,
          text: `${translations[name]}`
        },
        tooltips: {
          mode: 'index',
          intersect: false,
          itemSort: (a, b, data) => b.value - a.value,
          callbacks: {
              label: function(tooltipItem, data) {
                  return `${data.datasets[tooltipItem.datasetIndex].label}: ${data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
          }
        },
        hover: {
          mode: 'nearest',
          intersect: true
        },
        scales: {
          xAxes: [{
            type: 'time',
            distribution: 'linear',
            time: {
              unit: 'day',
              tooltipFormat: 'MMMM D, YYYY'
            }
          }],
          yAxes: [{
            display: true,
            scaleLabel: {
              display: true,
              labelString: translations[name]
            }
          }]
        },
        plugins: {
        	zoom: {
        		pan: {
        			enabled: true,
        			mode: 'xy',
        			rangeMin: {
        				x: null,
        				y: null
        			},
        			rangeMax: {
        				x: null,
        				y: null
        			},
        			speed: 20,
        			threshold: 10
        		},

        		zoom: {
        			enabled: true,
        			drag: false,
        			mode: 'xy',
        			rangeMin: {
        				x: null,
        				y: null
        			},
        			rangeMax: {
        				x: null,
        				y: null
        			},
        			speed: 0.1,
        			threshold: 2,
        			sensitivity: 3
        		}
        	}
        }
      }
    };

    createChart(chartName, isDetailed, config);
  }
}

function datasets(dataToRender, xLabels, xLabel, yLabel) {
  return dataToRender.map((source, idx) => {
    var dataName = chartData[`${source}Name`];
    var dataValue = chartData[`${source}Data`];
    var color = chartData[`${source}Color`]

    var isMainDataset = idx == 0;
    return buildDataset(dataName, normalize(dataValue, xLabels, xLabel, yLabel), color, isMainDataset);
  });
}

function buildXLabels(chartData, xLabel) {
  var all = Object.keys(chartData)
        .filter(label => label.endsWith("Data"))
        .map(label => chartData[label])
        .reduce((arr, data) => arr.concat(data), [])
        .map(point => moment(point[xLabel]));
  return Array.from(new Set(all)).sort((a, b) => a - b);
}

window.chartColors = {
	red: 'rgb(255, 99, 132)',
	blue: 'rgb(54, 162, 235)',
	green: 'rgb(75, 192, 192)',
	purple: 'rgb(153, 102, 255)',
	orange: 'rgb(255, 159, 64)',
	yellow: 'rgb(255, 205, 86)',
	grey: 'rgb(201, 203, 207)'
};

function color(index) {
  var colorNames = Object.keys(window.chartColors);
  var colorName = colorNames[index % colorNames.length];
  return window.chartColors[colorName];
}

function buildDataset(label, data, color, isMainDataset) {
  return {  label: label,
            backgroundColor: color,
            borderColor: color,
            data: data,
            pointRadius: 1.5 + (isMainDataset ? 0.5 : 0),
            borderWidth: 1 + (isMainDataset ? 0.5 : 0),
            fill: false
            };
}

function normalize(data, xLabels, xLabel, yLabel) {
  var lineData = data.reduce(function(o, point) {
      o[point[xLabel]] = point[yLabel];
      return o;
      }, {});
  return xLabels.map(date => lineData[date.format("YYYY-MM-DD")] || null);
}

function createChart(chartName, isDetailed, config) {
  var canvas_id = `canvas_${chartName}_${isDetailed ? 'detailed' : 'mini'}`;
  var chart_id = `chart_${chartName}_${isDetailed ? 'detailed' : 'mini'}`;

  var canvas = window[canvas_id];
  if (canvas == null) {
    var canvas = document.createElement('canvas');
    canvas.id = canvas_id;
    window[canvas_id] = canvas;
    console.log(`Create chart ${chart_id}`);
    window[chart_id] = new Chart(canvas.getContext('2d'), config);
    canvas.chart = window[chart_id];
  }


  var div = document.createElement('div');
  div.classList.add(isDetailed ? "detailed-chart-container" : "chart-container");
  div.appendChild(canvas);

  var parent = isDetailed ? document.getElementById('chart-modal-container') : document.getElementById('container');
  parent.appendChild(div);

  if (isDetailed) {
    document.getElementById("chartModal").focus();
  }

  var theChart = window[chart_id];
  document.getElementById('resetZoom').onclick = function(e) {theChart.resetZoom();};

  function zoomOut(ev) {
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    ev.preventDefault();
    ev.target.chart.resetZoom();

    return false;
  }

  canvas.addEventListener('contextmenu', zoomOut, false);
}

window.addEventListener("load", function() {
  var modal = document.getElementById("chartModal");

  var closeButton = document.getElementsByClassName("close")[0];

  function closeModal() {
    modal.style.display = "none";
    var parent = document.getElementById("chart-modal-container");
    while (parent.firstChild) {
      parent.firstChild.remove();
    }
  }

  modal.addEventListener("keyup", function(event) {
    if(event.key === "Escape") {
      closeModal();
    }
  });


  closeButton.onclick = function() {
    closeModal();
  }

  window.onclick = function(event) {
    if (event.target == modal) {
      closeModal();
    }
  }
});

var arcs = {};
var markers = {};
function drawMap(sourceLatitude, sourceLongitude) {
  var map = L.map('mapid').setView([sourceLatitude, sourceLongitude], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    continuousWorld: false,
    noWrap: true,
    //bounds: [ [-90, -180],[90, 180] ]
  }).addTo(map);
  //map.setMaxBounds(map.getBounds());
  map.setMaxBounds([ [-90, -180],[90, 180] ]);

  map.panTo(new L.LatLng(sourceLatitude, sourceLongitude));

  //
  var lastLatLon = null;
    map.on('contextmenu', function(e) { map.setView([sourceLatitude, sourceLongitude], 2); });

    map.on('click', function(e){
      lastLatLon = e.latlng;
      if (compared.length >= 9) {
        alert(`You are comparing ${compared.length} countries: ${compared.join(', ')}.\nPlease remove one before adding a new one.`);
//        var buttons = compared.map(x => `<span> ${x}<span style="position: relative;top: 0;right: 0;" onclick="this.parentElement.remove();return false;">(x)</span></span>`).join("");
//        L.popup()
//              .setLatLng(lastLatLon)
//              .setContent(`<p>Limit reached: remove some countries<br />
//              Compare: <a href="/compare/${compared.map(x => encodeURIComponent(x)).join('/')}">${buttons}</a><br />
//              </p>`)
//              .openOn(map)

        return;
      }
      $.ajax({ url:`/query?lat=${lastLatLon.lat}&lon=${lastLatLon.lng}&source=${originName}`,
          success: function(data) {
          if (compared.includes(data.country)) {
            removeArc(data.country);
            return;
          }
          if (data != null && data.country != null) {
            var orthodromic = data.ortho;
            var country = data.country;
            var arcColor = color(compared.length);
            var icon = data.icon;

            var geoJSON = L.geoJSON(orthodromic, { style: {color: arcColor} }).addTo(map);
            arcs[country] = geoJSON;

            var myIcon = L.icon({
                iconUrl: `https://static.safetravelcorridor.com/assets/icons/${icon}.png`,
                iconSize: [16, 16]
            });

            var marker = L.marker([lastLatLon.lat, lastLatLon.lng], {title: country, icon: myIcon, riseOnHover: true})
              .on("click", x => attachPopup(x.target, compared))
              .addTo(map);
            markers[country] = marker;

            compared.push(data.country);
            attachPopup(marker, compared);



            //popup(country, compared, lastLatLon, map, data.country);


          } else {
            console.error(`No country for lat=${lastLatLon.lat}, lon=${lastLatLon.lng}`);
          }
        }
      });
    });
  //

  return map;
}

function attachPopup(target, compared) {
  target.unbindPopup();
  target.bindPopup(popup(target.options.title, compared)).openPopup()
}

function popup(destinationCountry, compared) {
  var buttons = compared.join(", ");
  var sourceCountry = compared[0];

  var countryUrl = `/country/${encodeURIComponent(destinationCountry)}`;
  var compareUrl = `/compare/${compared.map(x => encodeURIComponent(x)).join('/')}`;
  var corridorUrl = `/corridor/${encodeURIComponent(sourceCountry)}/${encodeURIComponent(destinationCountry)}`;
  var content = `<p>${sourceCountry}<br />
                    <button onclick="window.location.href='${countryUrl}';">Country</button>: <a href="${countryUrl}">${destinationCountry}</a><br />
                    <button onclick="window.location.href='${compareUrl}';">Compare</button>: <a href="${compareUrl}">${buttons}</a><br />
                    <button onclick="window.location.href='${corridorUrl}';">Corridor</button>: <a href="${corridorUrl}">${sourceCountry}, ${destinationCountry}</a><br />
                    <button onclick="removeArc('${destinationCountry}')">Remove</button>: ${destinationCountry}<br />
                    </p>`;

  return content;
}

function removeArc(destinationCountry) {
  if (compared.length == 1 || compared[0] == destinationCountry) {
    alert(`You can't remove your origin country: ${compared[0]}. Try instead to add more countries or start over from another country.`);
    return;
  }
  compared.splice(compared.indexOf(destinationCountry), 1);
  arcs[destinationCountry].remove();
  arcs[destinationCountry] = null;
  markers[destinationCountry].closePopup();
  markers[destinationCountry].unbindPopup();
  markers[destinationCountry].remove();
  markers[destinationCountry] = null;
}