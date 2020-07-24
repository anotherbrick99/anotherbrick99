console.logCopy = console.log.bind(console);

console.log = function(data)
{
    var currentDate = moment().format("HH:mm:ss.SSS") + ': ';
    this.logCopy(currentDate, data);
};

function call_after_DOM_updated(fn) {
    intermediate = function () {window.requestAnimationFrame(fn)}
    window.requestAnimationFrame(intermediate)
}
//
function changeLang(lang) {
    var newUrl;
    try {
      var url = new URL(document.location.href);
      url.searchParams.set("lang", lang);
      newUrl = url.toString();
    } catch(e) {
      //explorer
      if (document.location.href.includes("lang=")) {
        newUrl = document.location.href.replace(/lang=[^&]+/, `lang=${lang}`)
      } else if (document.location.href.includes("?")) {
        newUrl = document.location.href + `&lang=${lang}`
      } else {
        newUrl = document.location.href + `?lang=${lang}`
      }
    }

    document.location.href = newUrl;
  }
//

function getCharts() {
  return Object.keys(window)
          .filter(key => key.startsWith("chart_"))
          .map(key => window[key]);
}
function addChartDataset(country, dataPoints, color) {
  getCharts().forEach(chart => {
    var dataName = country;
    var isMainDataset = false;
    var xLabels= chart.xLabels;
    var xLabel = chart.xLabel;
    var yLabel = chart.yLabel;
    var dataset = buildDataset(country, normalize(dataPoints, xLabels, xLabel, yLabel), color, isMainDataset);

    chart.datasetsByLabel[dataset.label] = dataset;
    chart.data.datasets.push(dataset);
  });

}

function chartShowDatasets(datasetLabels) {
  getCharts().forEach(chart => filterDatasetsInChart(chart, datasetLabels));
}

function filterDatasetsInChart(chart, datasetLabels) {
  var currentDatasets = chart.data.datasets.map(dataset => dataset.label);
  if (JSON.stringify(currentDatasets.toArray().sort()) == JSON.stringify(datasetLabels.toArray().sort())) return;

  var selectedDatasets = datasetLabels.map(label => chart.datasetsByLabel[label]);
  chart.data.datasets = selectedDatasets;
  chart.update();
}

var xLabels = null;
async function plot(chartData, name, datasetLabels, isDetailed) {
  var translations = chartData.translations;
  var xLabel = 'date';
  var yLabel = name;
  var xLabels = buildXLabels(chartData, xLabel);//chartData.xLabels;
  var dataToRender = Object.keys(chartData)
                      .filter(label => label.endsWith("Name"))
                      .map(name => name.replace(/Name$/, ""));

  var allDatasets = datasets(dataToRender, xLabels, xLabel, yLabel);
  var datasetsByLabel = allDatasets.reduce((acum, dataset) => {
    acum[dataset.label] = dataset ;
    return acum;
    }, {});
  var selectedDatasets = datasetLabels.map(label => datasetsByLabel[label]);
  var chartName = `chart_${name}`;
  //var chart = window[chartName];
  var locale = chartData.locale;
  //if (chart === undefined || true) {
    var config = {
      type: 'line',
      //parsing: false,
      //normalized: true,
      data: {
        labels: xLabels,
        datasets: selectedDatasets
      },
      options: {
        //animation: false,
        //elements: {
        //    line: {
        //        tension: 0, // disables bezier curves,
        //        fill: false,
        //        stepped: false,
        //        borderDash: []
        //    }
        //},
        responsive: true,
        onClick: x => {
          if (isDetailed) return;

          plot(chartData, name, datasetLabels, true);
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

    var theChart = createChart(chartName, isDetailed, config);
    theChart.datasetsByLabel = datasetsByLabel;
    theChart.xLabels = xLabels;
    theChart.xLabel = xLabel;
    theChart.yLabel = yLabel;
  //}
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
  var chartType = isDetailed ? 'detailed' : 'mini';
  var canvas_id = `canvas_${chartName}_${chartType}`;
  var chart_id = `${chartName}_${chartType}`;


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
  return theChart;
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

var map = null;
function drawMap(originName, originPoint) {
  console.log("Rendering map");
  map = L.map('mapid').setView(originPoint, 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    continuousWorld: false,
    noWrap: true,
    //bounds: [ [-90, -180],[90, 180] ]
  }).addTo(map);
  //map.setMaxBounds(map.getBounds());
  map.setMaxBounds([ [-90, -180],[90, 180] ]);

  map.panTo(originPoint);

  //
  var lastLatLon = null;
  map.on('contextmenu', function(e) { map.setView(originPoint, 2); });

  map.on('click', function(e) {
    var clickedLatLon = e.latlng;

    var sourceOrigin = compared[0];
    $.ajax({ url:`/query?lat0=${clickedLatLon.lat}&lon0=${clickedLatLon.lng}&source=${sourceOrigin}`,
        success: function(theData) {
        var data = theData[0];
        if (compared.includes(data.country)) {
          if (compared[0] != data.country) {
            removeArc(data.country);
          } else {
            //Do nothing
          }

          return;
        }
//        if (compared.length >= 9) {
//          alert(`You are comparing ${compared.length} countries: ${compared.join(', ')}.\nPlease remove one before adding a new one.`);
//
//          return;
//        }
        if (data != null && data.country != null) {
          var orthodromic = data.ortho;
          var country = data.country;
          var iconName = data.icon;
          var canonicalCountryCoords =  L.latLng(data.latLon.lat, data.latLon.lon);
          var rowObject = data.row;
          var dataset = data.dataset;
          var tableIndexes = [...Array(table.columns().indexes().length).keys()];
          var tableColumnNames = tableIndexes.map(i => table.column(i).header().dataset.name);


          var countryColor = color(compared.length);
          addChartDataset(country, dataset, countryColor);
          var row = tableColumnNames.map(name => rowObject[name] || null);
          table.row.add(row).draw();

          addArc(country, clickedLatLon, canonicalCountryCoords, orthodromic, iconName, countryColor);


        } else {
          console.error(`No country for lat=${clickedLatLon.lat}, lon=${clickedLatLon.lng}`);
        }
      }
    });
  });
  //

  console.log("Rendered map");
  return map;
}

var arcs = {};
var markers = {};
var compared = [];

function drawOrtho(map, country, orthodromic, arcColor) {
  arcs[country] = L.geoJSON(orthodromic, { style: {color: arcColor} }).addTo(map);
}

var coords = {};
function addArc(country, clickedLatLon, canonicalLatLon, orthodromic, iconName, color) {
  coords[country] = canonicalLatLon;
  if (orthodromic != null) {
    drawOrtho(map, country, orthodromic, color);
  }

  var iconUrl = `https://static.safetravelcorridor.com/assets/icons/${iconName}.png`;
  var myIcon = L.icon({
      iconUrl: iconUrl,
      iconSize: [16, 16]
  });

  var marker = L.marker([clickedLatLon.lat, clickedLatLon.lng], {title: country, icon: myIcon, riseOnHover: true})
    .on("click", x => attachPopup(x.target))
    .addTo(map);
  markers[country] = marker;

  compared.push(country);
  //attachPopup(marker, compared);
  //popup(country, compared, lastLatLon, map, data.country);
  addArcButton(country, iconUrl);
}

function attachPopup(target) {
  target.unbindPopup();
  target.bindPopup(popup(target.options.title)).openPopup()
}

function markerIcon(name) {
  return markers[name].options.icon.options.iconUrl;
}

function popup(destinationCountry) {
  var content = null;
  if (compared.length > 1 && compared[0] != destinationCountry) {
    var sourceCountry = compared[0];
    var sourceIconUrl = markerIcon(sourceCountry);
    var destinationIconUrl = markerIcon(destinationCountry);

    var countryUrl = `/country/${encodeURIComponent(destinationCountry)}`;
    var compareUrl = `/compare/${compared.map(x => encodeURIComponent(x)).join('/')}`;
    var corridorUrl = `/corridor/${encodeURIComponent(sourceCountry)}/${encodeURIComponent(destinationCountry)}`;
    var content = `<h2><a href="${sourceCountry}"><img width="32" height="32" src="${sourceIconUrl}"/>${sourceCountry}</a> => <a href="${countryUrl}"><img width="32" height="32" src="${destinationIconUrl}"/>${destinationCountry}</a></h2>
                      <br />
                      <button onclick="window.location.href='${corridorUrl}';">View safe corridor</button><br />
                      </p>`;
  } else {
    var destinationIconUrl = markerIcon(destinationCountry);

    var countryUrl = `/country/${encodeURIComponent(destinationCountry)}`;
    var compareUrl = `/compare/${compared.map(x => encodeURIComponent(x)).join('/')}`;
    var content = `<h2><a href="${countryUrl}"><img width="32" height="32" src="${destinationIconUrl}"/>${destinationCountry}</a></h2>
                      <br />
                      `;
  }



  return content;
}

function compareAll() {
  if (compared.length < 2) {
    alert("Please select at least two countries");
    return;
  }

  if (compared.length > 9) {
    alert("Please select 9 countries at most or use continents");
    return;
  }
  var compareUrl = `/compare/${compared.map(x => encodeURIComponent(x)).join('/')}`;
  window.location.href=compareUrl;
}

function removeArc(destinationCountry) {
  console.log("Removing arc")
  if (compared.length == 1 || compared[0] == destinationCountry) {
    if (compared.length > 2) {
      var newOriginName = compared[1];
      var subQuery = compared.slice(2)
        .map(destination => markers[destination].getLatLng())
        .map((latLon, i) => `lat${i}=${latLon.lat}&lon${i}=${latLon.lng}` ).join("&");
      var query = `/query?source=${newOriginName}&${subQuery}`;
      $.ajax({ url:query,
          success: function(data) {
            //Move arcs to new base
            for (var i = 0 ; i < data.length ; i++) {
              var destinationCountry = data[i].country;
              var orthodromic = data[i].ortho;
              var arcColor = arcs[destinationCountry].color;
              arcs[destinationCountry].remove();
              drawOrtho(map, destinationCountry, orthodromic, color(i));
            }

            var countryToRemove = compared[0];
            shiftBase();
            removeRow(countryToRemove);
          }
      });
    } else if (compared.length == 2) {
      var countryToRemove = compared[0];
      shiftBase();
      removeRow(countryToRemove);
    } else {
      alert(`You can't remove your origin country: ${compared[0]}. Try instead to add more countries or start over from another country.`);
    }
    return;
  }

  compared.splice(compared.indexOf(destinationCountry), 1);

  if (arcs[destinationCountry] != null) {
    arcs[destinationCountry].remove();
    arcs[destinationCountry] = null;
  }

  if (markers[destinationCountry] != null) {
    markers[destinationCountry].closePopup();
    markers[destinationCountry].unbindPopup();
    markers[destinationCountry].remove();
    markers[destinationCountry] = null;
  }

  var arcButtonClose = document.getElementById(`arc_close_${destinationCountry}`);
  arcButtonClose.parentElement.remove();
  removeRow(destinationCountry);
  console.log("Removed arc")
}

function removeRow(name) {
  console.log("Removing row")
  var index = [...Array(table.rows().data().length).keys()].findIndex(i => rowLocalizableName(table.row(i).data()) == name);
  table.row(index).remove().draw();
  console.log("Removed row")
}

function shiftBase() {
  console.log("Removing marker")
  var oldBase = compared.shift();
  var newOriginName = compared[0];

  //Move new base marker to canonical
  var canonicalLatLon = coords[newOriginName];
  markers[newOriginName].setLatLng(canonicalLatLon);

  //Remove arc from old base to new base
  arcs[newOriginName].remove();
  arcs[newOriginName] = null;
  //Remove old base marker
  markers[oldBase].remove();
  markers[oldBase] = null;

  //Remove button
  var arcButtonClose = document.getElementById(`arc_close_${oldBase}`);
  arcButtonClose.parentElement.remove();
  console.log("Removed marker")
}

function addArcButton(destinationCountry, iconUrl) {
  //FIXME render
  var li = document.createElement("li");
  var textNode = document.createElement("span")
  //textNode.textContent = destinationCountry;
  var img = document.createElement("img");
  img.src = iconUrl;
  img.width="16";
  img.height="16";
  var a = document.createElement("a");
  textNode.appendChild(a);
  a.textContent = destinationCountry;
  a.href = `/country/${encodeURIComponent(destinationCountry)}`;
  var closeButton = document.createElement("span")
  closeButton.id = `arc_close_${destinationCountry}`;
  closeButton.innerHTML = '&times;';
  closeButton.classList.add("closeList");
  li.appendChild(img);
  li.appendChild(textNode);
  li.appendChild(closeButton);
  document.getElementById("sourceList").appendChild(li);

  closeButton.addEventListener("click", function() {
    //var sourceName = this.parentElement.childNodes[1].textContent;
    removeArc(destinationCountry);
  });
}

//
var table = null;
function createTable(containerId, buttonGroups) {
  var pageLength = 5;

  var pageLengths = [5, 10, 15, 20];

  console.log("Rendering table")
  table = jQuery(`#${containerId}`).DataTable({
    dom: 'Bfrtip',
    paging: true,
    pagingType: "full_numbers",
    colReorder: {
            realtime: false,
            fixedColumnsLeft: 2
        },
    lengthMenu: [
        pageLengths,
        pageLengths.map(pageLength => `${pageLength} rows`)
    ],
    pageLength: pageLength,
    scrollX: true,
    //scrollY: 200,
    scrollCollapse: true,
    autoWidth:true,
    buttons: [
        {
          extend: 'colvisRestore',
          text: 'all'
        },
        'pageLength',
        ...buttonGroups],

    //buttons: [ 'pageLength', 'columnToggle', 'selectColumns' ],
    //buttons: [ 'pageLength', 'columnToggle', 'columnVisibility', 'columnsToggle', 'columnsVisibility', 'colvis', 'colvisGroup', 'colvisRestore' ],
    columnDefs: [
      {
          targets: [0],
          className: 'dt-body-center'
      },
      {
          targets: [0, 1],
          className: 'dt-body-left'
      },
      {
          targets: "_all",
          className: 'dt-body-right'
      },
    ]
  });
  table.on( 'length', function(event, settings, length) {
    chartShowDatasets(tableCurrentPageLocalizableNames());
  });
  table.on( 'order', function(event, settings, order) {
    chartShowDatasets(tableCurrentPageLocalizableNames());
  });
  table.on( 'search', function(event, settings) {
    chartShowDatasets(tableCurrentPageLocalizableNames());
  });
  table.on( 'page.dt', function(event, settings) {
    chartShowDatasets(tableCurrentPageLocalizableNames());
    return;
    console.log('page.dt');
    console.log(tableCurrentPageLocalizableNames());
    return;
    var pageSize = table.page.info().length;
    var pageNumber = table.page.info().page;
    var startIndex = table.page.info().start;
    var endIndex = table.page.info().end;
    var enabledDatasets = [];
    //for (var i = pageNumber * pageSize ; i < pageNumber * pageSize + pageSize ; i++) {
    for (var i = startIndex ; i < endIndex ; i++) {
      enabledDatasets.push(i);
    }

    Object.keys(window).filter(key => key.startsWith("chart_"))
      .map(key => window[key])
      .forEach(chart => {
        //console.log(chart);
        chartShowDatasets(chart, enabledDatasets);
        //chart.data.datasets.forEach((dataset, i) => dataset.hidden = !enabledDatasets.includes(i));
        //chart.update();
      });
  });
  console.log("Rendered table")
}

function tableCurrentPageLocalizableNames() {
  return table.rows( { page:'current', order: 'applied', search: 'applied' } )
              .data()
              .map(rowLocalizableName);
}

function rowLocalizableName(row) {
  return row[1].match(">(.+)<")[1];
}

function toggleColumn(columnName) {
  var column = table.column(`${columnName}:name`);
  column.visible(!column.visible());
  document.getElementById(`checkbox_${columnName}`).checked=column.visible();
  table.columns.adjust()
}

function toggleAll() {
  table.columns().every(i => {
    if (i > 1) {
      //skip name and flag
      var column = table.column(i);
      column.visible(!column.visible());
      var columnName = column.header().dataset.name;
      document.getElementById(`checkbox_${columnName}`).checked=column.visible();
    }
  });
  table.columns.adjust();
}