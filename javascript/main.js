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

var root = svg.append("g");

root.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "#54B4D4");

var mapGroup = root.append("g").attr("class", "map");
var citiesGroup = root.append("g").attr("class", "cities");
var routesGroup = root.append("g").attr("class", "routes");

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

var drawMap = function() {
    mapGroup.selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "land")
        .style("fill", "white");
};

var drawAirports = function(scale) {
    if(!scale) {
        scale = 1;
    }

    var airports = citiesGroup.selectAll("path")
        .data(cities);

    airports
        .enter()
        .append("path")
        .attr("fill", "orange");

    console.log(scale, 0.5/scale);
    airports.attr("d", function(city) {
        return path(d3.geo.circle().origin([city.longitude, city.latitude]).angle(0.5/scale)());
    });
};

var draw = function() {
    if(!world) return;

    drawMap();
    drawAirports();
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
            .style("stroke", "orange");

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

var translateAndScale = function(t, s) {
    var chartCoords = [width, height];
    var viewCoords = [width, height];

    var diff = [chartCoords[0] * s - viewCoords[0], chartCoords[1] * s - viewCoords[1]];

    if (chartCoords[0] < viewCoords[0]) diff[0] = 0;
    if (chartCoords[1] < viewCoords[1]) diff[1] = 0;

    if (t[0] > 0) t[0] = 0;
    if (t[1] > 0) t[1] = 0;

    if (t[0] < -diff[0]) t[0] = -diff[0];
    if (t[1] < -diff[1]) t[1] = -diff[1];

    zoom.translate(t);
    zoom.scale(s);
}

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 10])
    .on("zoom",function() {
        var t = d3.event.translate;
        var s = d3.event.scale;

        translateAndScale(t, s);

        root.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");
        drawAirports(s);
    });

svg.call(zoom)
