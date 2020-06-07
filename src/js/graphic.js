require("babel-core/register");
require("babel-polyfill");
import isMobile from "./utils/is-mobile";

/* global d3 */
let PADDING, CIRCLE_SIZE, STAR_SIZE, XSCALE, XACCESSOR, XDOMAIN, YSCALE, YACCESSOR, YDOMAIN, ANGLE_SCALE, RADIUS_SCALE, INNER_RADIUS, OUTER_RADIUS, WRAPPER, BOUNDS, DIMENSIONS

function resize() {
	setConfig()
}

function init() {
	setConfig()
	drawGlobalPath(DIMENSIONS, BOUNDS)
}

const teamAccessor = d => d.team
const teamParentAccessor = d => d.parent
const dateAccessor = d => new Date(d.date * 1000) //convert to milliseconds
const yearAccessor = d => d.year
const colorAccessor = d => d.primary_color
const secondaryColorAccessor = d => d.secondary_color
const winAccessor = d => d.win
const winPctAccessor = d => d.win_pct
const lossAccessor = d => d.loss
const countAccessor = d => d.count


async function setConfig() {
	const wrapperWidth = d3.select("#graphic-wrapper").node().offsetWidth
	const width = wrapperWidth * 0.95
	DIMENSIONS = {
		width: width,
		radius: width / 2,
		height: window.innerHeight * .75,
		margin: {

			top: 30,
			right: 0,
			bottom: 30,
			left: 30,
		},
	}
	DIMENSIONS.boundedWidth = DIMENSIONS.width - DIMENSIONS.margin.left - DIMENSIONS.margin.right
	DIMENSIONS.boundedHeight = DIMENSIONS.height - DIMENSIONS.margin.top - DIMENSIONS.margin.bottom
	DIMENSIONS.boundedRadius = DIMENSIONS.radius - ((DIMENSIONS.margin.left + DIMENSIONS.margin.right) / 2)

	// 3. Draw Canvas
	if (d3.selectAll("#wrapper-svg")._groups[0].length === 0) {
		WRAPPER = d3.select("#graphic-wrapper")
			.append("svg")
				.attr("id", "wrapper-svg")
				.style("transform", `translate(${wrapperWidth / 2 - DIMENSIONS.width / 2}px, ${0}px)`)
				.attr("width", 2 * DIMENSIONS.width)
				.attr("height", 2 * DIMENSIONS.height)
		BOUNDS = WRAPPER.append("g")
			.attr("id", "bounds-g")
			.style("transform", `translate(${DIMENSIONS.width / 2}px, ${500}px)`) //TODO: fix dimensions of bounds
	} else {
		WRAPPER
			.style("transform", `translate(${wrapperWidth / 2 - DIMENSIONS.width / 2}px, ${0}px)`)
			.attr("width", DIMENSIONS.width)
			.attr("height", DIMENSIONS.height)
		// BOUNDS
		// 	.style("transform", `translate(${DIMENSIONS.margin.left}px, ${DIMENSIONS.margin.top}px)`)
	}
}

async function drawGlobalPath(dimesnions, bounds) {
	drawGlobalPathByLatLon(0, 0, DIMENSIONS, BOUNDS)
}

async function drawGlobalPathByLatLon(latitude, longitude, dimensions, bounds) {
	const latitudes = await d3.json('./../assets/data/test_latitude.json')
	const distances = await d3.json('./../assets/data/test_distance.json')
	const elevations = await d3.json('./../assets/data/test_elevation.json')

	YDOMAIN = [-11100, 11100]
	XDOMAIN = [0, 40032.08]

	ANGLE_SCALE = d3.scaleLinear()
    	.domain(XDOMAIN)
    	.range([0, Math.PI * 2]) // radians

    INNER_RADIUS = dimensions.boundedRadius * .2
    OUTER_RADIUS = dimensions.boundedRadius * .65
    console.log(INNER_RADIUS, OUTER_RADIUS)
	RADIUS_SCALE = d3.scaleLinear()
		.domain(YDOMAIN)
		.range([INNER_RADIUS, OUTER_RADIUS])
		.nice()

	XSCALE = d3.scaleLinear()
		.domain(XDOMAIN)
		.range([0 + 20, dimensions.boundedWidth - 20])
	YSCALE = d3.scaleLinear()
		.domain(YDOMAIN)
		.range([dimensions.boundedHeight, 0])


	const elevationTicks = [0]
	const elevationCircles = elevationTicks.map(d => (
		bounds.append("circle")
			.attr("r", RADIUS_SCALE(d))
			.attr("class", "grid-line")
			.attr("fill", "transparent")
			.attr("stroke", "blue")
	))

	const elevationLineGenerator = d3.line()
		.x(d => XSCALE(d.x))
		.y(d => YSCALE(d.y))
		.curve(d3.curveStep)

	const elevationRadialGenerator = d3.lineRadial()
		.angle(d => ANGLE_SCALE(d.x))
		.radius(d => RADIUS_SCALE(d.y))
		// .curve(d3.curveStep)

	const plotData = {
		"latitude": latitudes.latitude,
		"distance": distances.distance,
		"elevation": elevations.elevation
	}

	var xy = [];
	for(var i=0;i<distances.distance.length;i++){
	   xy.push({x:distances.distance[i],y:elevations.elevation[i]});
	}
	console.log(xy)
	const elevationPath = bounds.append("path")
  		.datum(xy)
		.attr("class", "elevation-path")
		.attr("d", (d) => elevationRadialGenerator(d))
		.attr("fill", "none")
		.attr("stroke", 'black')
		.attr("stroke-width", 1)
		.attr("opacity", 1)
}


async function readFileToArray(filename) {
	var fs = require('fs');
	fs.readFile(filename, function(err, data) {
	    if(err) throw err;
	    var array = data.toString().split("\n");
	});
	return array
}

function substringMatcher(strs) {
	return function findMatches(q, cb) {
		// an array that will be populated with substring matches
		const matches = [];
		// regex used to determine if a string contains the substring `q`
		const substrRegex = new RegExp(q, 'i');
		// iterate through the pool of strings and for any string that
		// contains the substring `q`, add it to the `matches` array
		for (var i = 0; i < strs.length; i++) {
			const str = strs[i]
			if (substrRegex.test(str)) {
				matches.push(str);
			}
		}
		cb(matches);
	};
};


function range(start, end) {
	const range = Array(end - start + 1).fill().map((_, idx) => start + idx)
  	return range
}


function makeColors(primaryColor, numDarker=4, numLighter=4, pctDarker=0.64, pctLighter=0.64) {
	primaryColor = d3.rgb(primaryColor)
	const primaryRed = primaryColor.r
	const primaryGreen = primaryColor.g
	const primaryBlue = primaryColor.b

	const darkScale = [primaryColor]
	const darkRedStep = primaryRed * pctDarker / numDarker
	const darkGreenStep = primaryGreen * pctDarker / numDarker
	const darkBlueStep = primaryBlue * pctDarker / numDarker
	for (var i = 0; i < numDarker; i++) {
		const darkerColor = d3.rgb(
			darkScale[i].r - darkRedStep,
			darkScale[i].g - darkGreenStep,
			darkScale[i].b - darkBlueStep,
		)
		darkScale.push(darkerColor)
	}

	const lightScale = [primaryColor]
	const lightRedStep = (255 - primaryRed) * pctLighter / numLighter
	const lightGreenStep = (255 - primaryGreen) * pctLighter / numLighter
	const lightBlueStep = (255 - primaryBlue) * pctLighter / numLighter
	for (var i = 0; i < numLighter; i++) {
		const lighterColor = d3.rgb(
			lightScale[i].r + lightRedStep,
			lightScale[i].g + lightGreenStep,
			lightScale[i].b + lightBlueStep,
		)
		lightScale.push(lighterColor)
	}

	// Remove 1st element to avoid double inclusion
	darkScale.shift()
	const colorScale = [lightScale.reverse(), darkScale].flat(1);
	return colorScale
}


function getIntervalArray(start, end, intervalLength) {
	const startInterval = Math.floor(start / intervalLength) * intervalLength
	const endInterval = Math.floor(end / intervalLength) * intervalLength
	const numIntervals = Math.ceil((endInterval - startInterval) / intervalLength)
	const intervals = [startInterval]
	for (var i = 0; i < numIntervals; i++) {
		const currentInterval = intervals[i] + intervalLength
		intervals.push(currentInterval)
	}
	return intervals
}

export default { init, resize };
