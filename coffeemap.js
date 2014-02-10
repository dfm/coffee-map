(function () {

  "use strict";

  var width = 800,
    height = 800;

  var projection = d3.geo.mercator()
        .scale(92000)
        .translate([width / 2, height / 2])
        .center([-73.86, 40.73])
        .precision(0.01);

  var path = d3.geo.path()
               .projection(projection);

  var svg = d3.select("#figure").append("svg")
              .attr("width", width)
              .attr("height", height),
      features = svg.append("g"),
      map_group = features.append("g"),
      lines_group = features.append("g"),
      stations_group = features.append("g");

  var nyc = null, lines = null, stations = null;

  d3.json("nyc.json", function(error, value) { nyc = value; draw(); });
  d3.json("shapes.json", function (error, value) { lines = value; draw(); });
  d3.json("stations.json", function (error, value) { stations = value; draw(); });

  function draw () {
    if (nyc == null || lines == null || stations == null) return;

    // Draw the map.
    var boroughs = map_group.selectAll(".borough").data(nyc.features);
    boroughs.enter().append("path").attr("class", "borough");
    boroughs.attr("d", path);
    boroughs.exit().remove();

    // Build and render the paths.
    var lines_sel = lines_group.selectAll(".line").data(lines);
    lines_sel.enter().append("path").attr("class", "line");
    lines_sel.attr("d", path)
             .attr("class", function (d) { return "line l" + d.line; });
    lines_sel.exit().remove();

    // Draw the stations.
    var points = stations_group.selectAll(".station").data(stations);
    points.enter().append("circle")
          .attr("class", "station")
          .attr("r", 2);
    points.attr("transform",
      function(d) { return "translate(" + projection(d.latlng) + ")"; });
    points.exit().remove();

    // Add the labels.
    var labels = stations_group.selectAll(".label").data(stations);
    labels.enter().append("text")
          .attr("class", "label");
    labels.attr("transform",
        function(d) {
          return "translate("+projection(d.latlng)+")"; }
      )
      .attr("text-anchor", function (d) { return "end"; })
      .text(function (d) { return d.name; });
    labels.exit().remove();
  }

  // Zooming.
  var zoom = d3.behavior.zoom()
      .translate([0, 0])
      .scale(1)
      .scaleExtent([1, 8])
      .on("zoom", zoomed);
  svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .call(zoom);

  function zoomed() {
    features.attr("transform", "translate(" + d3.event.translate + ")"
                  + "scale(" + d3.event.scale + ")");
    map_group.selectAll(".borough")
             .style("stroke-width", 0.5/d3.event.scale + "px");
    lines_group.selectAll(".line")
               .style("stroke-width", 2.5/d3.event.scale + "px");
    stations_group.selectAll(".station")
                  .attr("r", 2/d3.event.scale + "px")
                  .style("stroke-width", 1/d3.event.scale + "px");
    stations_group.selectAll(".label")
                  .style("font-size", 9/d3.event.scale + "px");
  }

})();
