var width = window.innerWidth,
    height = window.innerWidth;

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

var world, cities, routes;

var findCoordinates = function(code) {
    var airport = cities.filter(function(city) {
        return city.iata === code || city.airport === code;
    })[0];

    if(airport === undefined) {
        console.error("Unable to find airport:", code);
    }

    return [airport.longitude, airport.latitude];
};

var draw = function() {
    if(!world) return;

    mapGroup.selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "land")
        .style("fill", "white");


    citiesGroup.selectAll("circle")
        .data(cities)
        .enter()
        .append("circle")
        .attr("cx", function(city) {
            return projection([city.longitude, city.latitude])[0];
        })
        .attr("cy", function(city) {
            return projection([city.longitude, city.latitude])[1];
        })
        .attr("r", 1)
        .attr("fill", "red");
};

d3.json("json/world-50m.json", function(error, data) {
    world = data;
    draw();
});

d3.csv("json/airports.csv", function(error, data) {
    cities = data;

    d3.select("select.airports")
        .selectAll("option")
        .data(data)
        .enter()
        .append("option")
        .attr("value", function(d) { return d.iata; })
        .text(function(d) { return d.airport; });

    d3.select("select.airports").on("change", function(d) {
        var selectedAirport = this.options[this.selectedIndex].value;
        var routesToRender = routes.filter(function(route) {
            return route.origin === selectedAirport;
        });

        routesGroup.selectAll("path").remove();

        var newRoutes = routesGroup.selectAll("path")
            .data(routesToRender)
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
                var origin = findCoordinates(route.origin);
                var destination = findCoordinates(route.destination);
                var interpolateFn = d3.geo.interpolate(origin, destination);

                return function(t) {
                    return path({type: "LineString", coordinates: [origin, interpolateFn(t)]});
                };
            });
    })

    routes = [];
    draw();
});

d3.json("json/routes.json", function(error, data) {
    routes = data;
});
