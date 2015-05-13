var width = 960,
    height = 960;

var projection = d3.geo.mercator()
    .scale((width + 1) / 2 / Math.PI)
    .translate([width / 2, height / 2])
    .precision(.1);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "#54B4D4");

var mapGroup = svg.append("g").attr("class", "map");
var citiesGroup = svg.append("g").attr("class", "cities");
var routesGroup = svg.append("g").attr("class", "routes");

d3.json("/json/world-50m.json", function(error, world) {
    mapGroup.selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "land")
        .style("fill", "white");


    var bangalore = [77.5945627, 12.9715987];
    var newYork = [-74.0059413, 40.7127837];
    var chennai = [80.2252278, 13.0597049];
    var delhi = [77.13, 28.38];

    var cities = [bangalore, chennai, newYork, delhi];
    var routes = [{source: bangalore, destination: newYork},
                  {source: newYork, destination: chennai},
                  {source: bangalore, destination: chennai},
                  {source: chennai, destination: delhi}];

    citiesGroup.selectAll("circle")
        .data(cities)
        .enter()
        .append("circle")
        .attr("cx", function(city) { return projection(city)[0]; })
        .attr("cy", function(city) { return projection(city)[1]; })
        .attr("r", 3)
        .attr("fill", "red");


    var newRoutes = routesGroup.selectAll("path")
        .data(routes)
        .enter()
        .append("path")
        .attr("class", "route")
        .style("fill", "none")
        .style("stroke", "red");

    newRoutes
        .transition()
        .duration(1000)
        .ease("linear")
        .attrTween("d", function(route) {
            var interpolateFn = d3.geo.interpolate(route.source, route.destination);

            return function(t) {
                return path({type: "LineString", coordinates: [route.source, interpolateFn(t)]});
            };
        });
});
