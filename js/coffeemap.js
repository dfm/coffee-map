(function () {

  "use strict";

  var lazy = 11-4, snob = 11-6;

  var width = 800,
      height = 500,
      scale = 1;
  var opmax = 0.8, opstart = 0.5, opwidth = 0.4;

  var projection = d3.geo.mercator()
        .scale(460000)
        .translate([width / 2, height / 2])
        .center([-73.97, 40.71])
        .precision(0.01);

  var path = d3.geo.path()
               .projection(projection);

  var svg = d3.select("#figure").append("svg")
              .attr("width", width)
              .attr("height", height),
      map_group = svg.append("g");

  // Zooming.
  var zoom = d3.behavior.zoom()
      .translate([0, 0])
      .scale(1)
      .scaleExtent([0.15, 4])
      .on("zoom", zoomed);
  svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .call(zoom);

  var features = svg.append("g"),
      lines_group = features.append("g"),
      stations_group = features.append("g");

  var nyc = null, lines = null, stations = null, all_venues = null, grid = null;

  d3.json("data/nyc.json", function(error, value) { nyc = value; draw(); });
  d3.json("data/shapes.json", function (error, value) { lines = value; draw(); });
  d3.json("data/stations.json", function (error, value) { stations = value; draw(); });
  d3.json("data/venues.json", function (error, value) { all_venues = value; draw(); });
  d3.json("data/grid.json", function (error, value) { grid = value; draw(); });

  function draw () {
    if (nyc == null || lines == null || stations == null || all_venues == null || grid == null) return;

    $("#subtitle").text("scroll to zoom & drag to move");

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
    var sel = stations_group.selectAll(".station").data(stations),
        g = sel.enter().append("g").attr("class", "station")
                       .on("mouseover", function () {
                         var sel = d3.select(this).select("text"),
                             op = sel.style("opacity"),
                             disp = sel.style("display");
                         sel.attr("data-opacity", op)
                            .attr("data-display", disp)
                            .style("opacity", 1)
                            .style("display", null);
                       })
                       .on("mouseout", function () {
                         var sel = d3.select(this).select("text"),
                             op = sel.attr("data-opacity"),
                             disp = sel.attr("data-display");
                         sel.style("opacity", op).style("display", disp);
                       })
                       .on("click", function (d) {
                         window.open("https://foursquare.com/v/"+all_venues[grid[lazy][snob][d.ind]].id,
                                     "_blank");
                       });
    g.append("circle");
    g.append("text").attr("class", "label");

    sel.selectAll("circle")
       .attr("r", 2.2)
       .attr("transform", function(d) {
         return "translate(" + projection(d.latlng) + ")";
       });
    format_labels(sel.selectAll("text"));

    sel.exit().remove();
  }

  function format_labels (sel) {
    var venues = grid[lazy][snob];
    sel.attr("transform",
        function(d) {
          var coords = projection(d.latlng);

          // Horizontal align.
          if (d.align[0] == "r") coords[0] -= 4 / scale;
          else if (d.align[0] == "l") coords[0] += 3 / scale;

          // Vertical align.
          if (d.align[1] == "b") coords[1] -= 4 / scale;
          else if (d.align[1] == "m") coords[1] += 3 / scale;
          else coords[1] += 11 / scale;

          return "translate("+coords+")";
        })
       .attr("text-anchor", function (d) {
        if (d.align[0] == "r")
          return "end";
        else if (d.align[0] == "c")
          return "middle";
        return "start";
       })
       .text(function (d) { return all_venues[venues[d.ind]].name; });
  }

  function zoomed() {
    scale = d3.event.scale;

    var t = "translate("+d3.event.translate+")"+"scale("+scale+")";
    map_group.attr("transform", t);
    features.attr("transform", t);
    map_group.selectAll(".borough")
             .style("stroke-width", 0.5/scale + "px");
    lines_group.selectAll(".line")
               .style("stroke-width", 1.5/scale + "px");
    stations_group.selectAll("circle")
                  .attr("r", 2.2/scale + "px")
                  .style("stroke-width", 1/scale + "px");

    // Format the labels.
    var sel = stations_group.selectAll(".label")
                            .style("font-size", 9/scale + "px");
    format_labels(sel);

    // Compute the opacity.
    var op = opmax;
    if (d3.event.scale < opstart) {
      sel.style("display", "none");
      return;
    } else if (d3.event.scale < opstart+opwidth) {
      var x = (d3.event.scale-opstart)/opwidth;
      op *= x*x * (3-2*x);
    }
    sel.style("opacity", op).style("display", null);
  }

  // Set up dials.
  $("#lazy").knob({
    "width": 70,
    "height": 70,
    "fgColor": "#222",
    "bgColor": "#ccc",
    "change": function (v) {
      lazy = 11-v;
      format_labels(stations_group.selectAll(".label"));
    }
  });

  $("#snob").knob({
    "width": 70,
    "height": 70,
    "fgColor": "#222",
    "bgColor": "#ccc",
    "change": function (v) {
      snob = 11-v;
      format_labels(stations_group.selectAll(".label"));
    }
  });

})();
