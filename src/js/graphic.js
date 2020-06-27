require("babel-core/register");
require("babel-polyfill");
import isMobile from "./utils/is-mobile";

// LONGITUDE_INCREMENT = 0.0166658951
// (180 - Math.abs(118.504983)) / 0.0166658951 = 3689.87 ~ 3690



/* global d3 */

let PADDING, CIRCLE_SIZE, XSCALE, XACCESSOR, XDOMAIN, YSCALE, YACCESSOR, YDOMAIN, ANGLE_SCALE, RADIUS_SCALE, INNER_RADIUS, OUTER_RADIUS, WRAPPER, BOUNDS, DIMENSIONS, NEGATIVE_SCALE, POSITIVE_SCALE
const NUM_INDICES = 21601
const MAX_ELEVATION = 8848 // meters -> Mt. Everest
const MIN_ELEVATION = -11034 // meters -> Mariana Trench
const EARTH_CIRCUMFERENCE = 40075000 // meters
const METERS_TO_FEET = 3.28084
const METERS_TO_MILES = 0.000621371
const STAR_SIZE = 100

function resize() {
	setConfig()
}

function init() {
	setConfig()
	drawGlobalPath(DIMENSIONS, BOUNDS)
}


async function setConfig() {
	const wrapperWidth = d3.select("#graphic-wrapper").node().offsetWidth
	const width = wrapperWidth * 1
	DIMENSIONS = {
		width: width,
		height: window.innerHeight * 1,
		margin: {
			top: 0,
			right: 0,
			bottom: 120,
			left: 0,
		},
	}
	DIMENSIONS.radius = Math.min(DIMENSIONS.width / 2, DIMENSIONS.height / 2)
	DIMENSIONS.boundedWidth = DIMENSIONS.width - DIMENSIONS.margin.left - DIMENSIONS.margin.right
	DIMENSIONS.boundedHeight = DIMENSIONS.height - DIMENSIONS.margin.top - DIMENSIONS.margin.bottom
	DIMENSIONS.boundedRadius = DIMENSIONS.radius - ((DIMENSIONS.margin.left + DIMENSIONS.margin.right) / 2)

	// 3. Draw Canvas
	if (d3.selectAll("#wrapper-svg")._groups[0].length === 0) {
		WRAPPER = d3.select("#graphic-wrapper")
			.append("svg")
				.attr("id", "wrapper-svg")
				.style("transform", `translate(${wrapperWidth / 2 - DIMENSIONS.width / 2}px, ${0}px)`)
				.attr("width", DIMENSIONS.width)
				.attr("height", DIMENSIONS.height)
		BOUNDS = WRAPPER.append("g")
			.attr("id", "bounds-g")
			.style("transform", `translate(${DIMENSIONS.width / 2}px, ${DIMENSIONS.height / 2}px)`) //TODO: fix dimensions of bounds
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
	// 34.0195° N, 118.4912° W
	// 17.6509° S, 149.4260° W
	// 18.204544, -67.126666
	// TODO: -90, 118.4912 doesnt work for labeling
	drawGlobalPathByLatLon(18.204544, -67.126666, DIMENSIONS, BOUNDS)
	// drawGlobalPathByLatLon(-17.6509, -149.4260, DIMENSIONS, BOUNDS)

}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function drawGlobalPathByLatLon(latitude, longitude, dimensions, bounds) {
	// const boundsBackground = bounds.append("rect")
	// 	.attr("class", "bounds-background")
	// 	.attr("x", 0)
	// 	.attr("width", dimensions.boundedWidth)
	// 	.attr("y", 0)
	// 	.attr("height", dimensions.boundedHeight)


	d3.select(`#country-flag-group`).remove()
	const iso2FlagAspectRatios = await d3.json('./../assets/data/iso2_flag_aspect_ratios.json')
	const iso2FlagColors = await d3.json('./../assets/data/iso2_flag_colors.json')
	const iso2Name = {}
	const pathData = await d3.json('./../assets/data/everest.json')
	const distances = pathData.distance
	const elevations = pathData.elevation
	const countries = pathData.countries
	const oceans = pathData.oceans

	YDOMAIN = [MIN_ELEVATION, -MIN_ELEVATION]
	XDOMAIN = [0, NUM_INDICES]

	ANGLE_SCALE = d3.scaleLinear()
    	.domain(XDOMAIN)
    	.range([0, Math.PI * 2]) // radians

    INNER_RADIUS = dimensions.boundedRadius * .55
    OUTER_RADIUS = dimensions.boundedRadius * .9
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

	NEGATIVE_SCALE = d3.scaleLinear()
		.domain([-90, 90])
		.range([0, 10800])
	POSITIVE_SCALE = d3.scaleLinear()
		.domain([90, -90])
		.range([0, 10800])

	const elevationTicks = [MIN_ELEVATION, 0, 2*MAX_ELEVATION]
	const elevationCircles = elevationTicks.map(d => (
		bounds.append("circle")
			.attr("r", RADIUS_SCALE(d))
			.attr("class", "grid-line")
			.attr("fill", "transparent")
			.attr("stroke", "#e8e8e8")
			.attr("stroke-width", (d === 2*MAX_ELEVATION) ? 0 : 1)
	))

	var rightArc = d3.arc()
		.innerRadius(RADIUS_SCALE(MAX_ELEVATION))
		.outerRadius(RADIUS_SCALE(MAX_ELEVATION))
		.startAngle(14*Math.PI/32)
		.endAngle(18*Math.PI/32);

	var leftArc = d3.arc()
		.innerRadius(RADIUS_SCALE(MAX_ELEVATION))
		.outerRadius(RADIUS_SCALE(MAX_ELEVATION))
		.startAngle(46*Math.PI/32)
		.endAngle(50*Math.PI/32);

	bounds.append("path")
		.attr("class", "arc")
		.attr("fill", "transparent")
		.attr("stroke", "#e8e8e8")
		.attr("stroke-width", 1)
		// .style("stroke-dasharray", ("5, 10"))
		.attr("d", rightArc);
	bounds.append("path")
		.attr("class", "arc")
		.attr("fill", "transparent")
		.attr("stroke", "#e8e8e8")
		.attr("stroke-width", 0)
		// .style("stroke-dasharray", ("5, 10"))
		.attr("d", leftArc);

	const elevationLineGenerator = d3.line()
		.x(d => XSCALE(d.x))
		.y(d => YSCALE(d.y))
		.curve(d3.curveStep)

	const elevationRadialGenerator = d3.lineRadial()
		.angle(d => ANGLE_SCALE(d.x))
		.radius(d => RADIUS_SCALE(d.y))

	const plotData = {
		"distance": distances,
		"elevation": elevations,
		"country": countries
	}


	// Get index to country mapping
	const countryToIndex = {}
	for (var i = 0; i < countries.length; i++) {
		const countryMetadata = countries[i]
		const country = getCountryISO2FromCountryMetadata(countryMetadata)
		const countryStartLatitude = countryMetadata["start_latitude"]
		const countryEndLatitude = countryMetadata["end_latitude"]
		const countryLongitude = countryMetadata["longitude"]
		let countryName = countryMetadata["name"]
		const startIndex = getPlotIndexFromLatLon(countryStartLatitude, countryLongitude)
		const endIndex = getPlotIndexFromLatLon(countryEndLatitude, countryLongitude)

		if (countryName === "Line Group" || countryName === "Phoenix Group") {
			countryName = "Kiribati"
		} else if(countryName === "Easter Island") {
			countryName = "Rapa Nui (Easter Island)"
		} else if(countryName === "New Zealand") {
			countryName = "Aotearoa (New Zealand)"
		} else if(countryName === "Tonga") {
			countryName = "Kingdom of Tonga"
		} else if(countryName === "Palau") {
			countryName = "Republic of Palau"
		} else if(countryName === "Marshall Islands") {
			countryName = "Republic of Marshall Islands"
		}

		const lowerIndex = (startIndex < endIndex) ? startIndex : endIndex
		const higherIndex = (endIndex > startIndex) ? endIndex : startIndex
		if (country in countryToIndex) {
			countryToIndex[country].push({"start": lowerIndex, "end": higherIndex, "name": countryName})
		} else {
			iso2Name[country] = countryName
			countryToIndex[country] = [{"start": lowerIndex, "end": higherIndex, "name": countryName}]
		}
	}



	// Get ocean to index mapping
	const oceanToIndex = {}
	for (var i = 0; i < oceans.length; i++) {
		const oceanMetadata = oceans[i]
		const oceanStartLatitude = oceanMetadata["start_latitude"]
		const oceanEndLatitude = oceanMetadata["end_latitude"]
		const oceanLongitude = oceanMetadata["longitude"]
		const ocean = oceanMetadata["name"]
		const startIndex = getPlotIndexFromLatLon(oceanStartLatitude, oceanLongitude)
		const endIndex = getPlotIndexFromLatLon(oceanEndLatitude, oceanLongitude)

		const lowerIndex = (startIndex < endIndex) ? startIndex : endIndex
		const higherIndex = (endIndex > startIndex) ? endIndex : startIndex
		if (ocean in oceanToIndex) {
			oceanToIndex[ocean].push({"start": lowerIndex, "end": higherIndex, "name": ocean})
		} else {
			oceanToIndex[ocean] = [{"start": lowerIndex, "end": higherIndex, "name": ocean}]
		}
	}


	const countryDistance = {}
	const waterDistance = {}
	var allElevations = [];
	var landElevations = [];
	var oceanElevations = [];
	var orderedElevations = []
	var orderedCountries = []
	var orderedOceans = []
	let numLandIndices = 0
	let numOceanIndices = 0
	for(var i=0;i<distances.length;i++){
		const currentElevation = elevations[distances.length - i - 1]
		// const currentDistance = distances[distances.length - i - 1]
		// const previousDistance = (i === (distances.length - 1)) ? 0 : distances[distances.length - i - 2]
		// const distanceTraversed = currentDistance - previousDistance

		let addedOcean = false
		for (var l = 0; l < Object.keys(oceanToIndex).length; l++) {
			const oceanLabel = Object.keys(oceanToIndex)[l]
			const oceanSegments = oceanToIndex[oceanLabel]

			for (var m = 0; m < oceanSegments.length; m++) {
				const oceanSegment = oceanSegments[m]
				const oceanStartIndex = oceanSegment["start"]
				const oceanEndIndex = oceanSegment["end"]

				if (i >= oceanStartIndex && i <= oceanEndIndex) {
					orderedOceans.push(oceanLabel)
					addedOcean = true
					if (oceanLabel in waterDistance) {
						if (currentElevation > 0) {
						} else {
							waterDistance[oceanLabel]['ocean'] += 1
						}
					} else {
						waterDistance[oceanLabel] = {'name': oceanLabel}
						if (currentElevation > 0) {
							waterDistance[oceanLabel]['ocean'] = 0
						} else {
							waterDistance[oceanLabel]['ocean'] = 1
						}
					}
					break
				}
			}
		}
		if (!addedOcean) {
			orderedOceans.push("")
		}



		let addedLabel = false
		for (var j = 0; j < Object.keys(countryToIndex).length; j++) {
			const countryLabel = Object.keys(countryToIndex)[j]
			const countrySegments = countryToIndex[countryLabel]

			for (var k = 0; k < countrySegments.length; k++) {
				const countrySegment = countrySegments[k]
				const countryStartIndex = countrySegment["start"]
				const countryEndIndex = countrySegment["end"]
				let countryName = countrySegment["name"]

				if (i >= countryStartIndex && i <= countryEndIndex) {
					orderedCountries.push(`${countryLabel};${countryName}`)
					addedLabel = true
					if (countryLabel in countryDistance) {
						if (currentElevation > 0) {
							countryDistance[countryLabel]['land'] += 1
						} else {
							countryDistance[countryLabel]['ocean'] += 1
						}
					} else {
						countryDistance[countryLabel] = {'name': countryName}
						if (currentElevation > 0) {
							countryDistance[countryLabel]['land'] = 1
							countryDistance[countryLabel]['ocean'] = 0
						} else {
							countryDistance[countryLabel]['land'] = 0
							countryDistance[countryLabel]['ocean'] = 1
						}
					}
					break
				}
			}
		}
		if (!addedLabel) {
			orderedCountries.push("")
		}

		orderedElevations.push(currentElevation)
		allElevations.push({x:i, y:currentElevation});
		if (currentElevation > 0) {
			landElevations.push({x:i, y:currentElevation});
			oceanElevations.push({x:i, y:0});
			numLandIndices += 1
		} else {
			landElevations.push({x:i, y:0});
			oceanElevations.push({x:i, y:currentElevation});
			numOceanIndices += 1
		}
	}
	
	const landDistance = Math.round((numLandIndices / NUM_INDICES) * EARTH_CIRCUMFERENCE * METERS_TO_MILES)
	const oceanDistance = Math.round((numOceanIndices / NUM_INDICES) * EARTH_CIRCUMFERENCE * METERS_TO_MILES)
	const uniqueCountries = [...new Set(countries.map(x => getCountryISO2FromCountryMetadata(x)))].filter(country => country != 'AQ')
	const numNations = uniqueCountries.length


	const iconVerticalSpace = 60
	const icons = [
		{'filename': 'flag', 'value': `${numNations} Countries`},
		{'filename': 'ocean', 'value': `${numberWithCommas(oceanDistance)} mi.`},
		{'filename': 'land', 'value': `${numberWithCommas(landDistance)} mi.`}
	]
	const iconGroup = bounds.append("g")
	const iconHeight = 25
	const flagYValue = - iconVerticalSpace * (icons.length) / 3 - icons.length * iconHeight / 3
	drawCenterFlags(flagYValue, Object.keys(countryToIndex), iso2FlagAspectRatios, bounds)

	iconGroup.selectAll("icons")
		.data(icons)
		.enter()
		.append("svg:image")
			.attr("id", d =>`icon-${d.filename}`)
			.attr("class", "point-flag")
			.attr("xlink:href", d => `./../assets/images/${d.filename}.svg`)
			.attr("height", iconHeight)
			.style("justify-content", "center")
			.attr("x", -iconHeight / 2)
			.attr("y", (d,i) => i*iconVerticalSpace - iconVerticalSpace * (icons.length) / 3 - icons.length * iconHeight / 3)
			.attr("opacity", 1)
			.style("fill", "blue")

	iconGroup.selectAll("icons")
		.data(icons)
		.enter()
		.append("text")
			.attr("id", d => `icon-text-${d.filename}`)
			.attr("class", "icon-text")
			.html(d => d.value)
			.attr("x", 0)
			.attr("y", (d,i) => i*iconVerticalSpace + iconVerticalSpace/1.5 - iconVerticalSpace * (icons.length) / 3 - icons.length * iconHeight / 3)
			.attr("font-size", 14)
			.attr("text-anchor", "middle")
			.attr("fill", "#414141")
			.attr("opacity", 1)
			.attr("dominant-baseline", d => d.baseline)
			.attr("font-family", "Raleway")

	const elevationPath = bounds.append("path")
  		.datum(allElevations)
		.attr("class", "elevation-path")
		.attr("d", (d) => elevationRadialGenerator(d))
		.attr("fill", "none")
		.attr("stroke", 'black')
		.attr("stroke-width", 0)
		.attr("opacity", 1)

	// Attempting color gradient
	const numberOfStops = 10
	
	const landGradientId = "land-gradient"
	const landGradient = bounds.append("radialGradient")
		.attr("id", landGradientId)
	// #30CF64
	const landColor = "#3DC257"
	const landColors = makeColors("#3DC257", numberOfStops/2, numberOfStops/2, 0.9, 0.5).reverse()

	// const gradientColorScale = d3.interpolateGreens
	d3.range(numberOfStops).forEach(i => {
		landGradient.append("stop")
			.attr("offset", `${100 * (0.8 + (1- 0.8) * (i / (numberOfStops - 1)))}%`)
			.attr("stop-color", landColors[i]) // #54a0ff
	})

	const landElevationAreaGenerator = d3.areaRadial()
		.angle(d => ANGLE_SCALE(d.x))
		.innerRadius(d => RADIUS_SCALE(0))
		.outerRadius(d => RADIUS_SCALE(d.y))

	const landElevationArea = bounds.append("path")
		.attr("id", "land-area")
		.attr("class", "area")
		.attr("d", landElevationAreaGenerator(landElevations))
		.style("fill", `url(#${landGradientId})`)


	// OCEAN
	const oceanColor = "#54a0ff"
	const oceanGradientId = "ocean-gradient"
	const oceanGradient = bounds.append("radialGradient")
		.attr("id", oceanGradientId)
	
	const oceanColors = makeColors("#54a0ff", numberOfStops/2, numberOfStops/2, 0.8, 0.5).reverse()

	d3.range(numberOfStops).forEach(i => {
		oceanGradient.append("stop")
			// .attr("offset", `${i * 100 / (numberOfStops - 1)}%`)
			.attr("offset", `${100 * (0.8 + (1- 0.8) * (i / (numberOfStops - 1)))}%`)
			.attr("stop-color", oceanColors[i]) // #54a0ff
			// .attr("stop-color", d3.interpolateBlues((numberOfStops - i) / (numberOfStops - 1))) // #54a0ff
	})
	const oceanElevationAreaGenerator = d3.areaRadial()
		.angle(d => ANGLE_SCALE(d.x))
		.innerRadius(d => RADIUS_SCALE(d.y))
		.outerRadius(d => RADIUS_SCALE(0))

	const oceanElevationArea = bounds.append("path")
		.attr("id", "ocean-area")
		.attr("class", "area")
		.attr("d", oceanElevationAreaGenerator(oceanElevations))
		.style("fill", `url(#${oceanGradientId})`)




	// INNER GRADIENT

	const innerGradientId = "inner-gradient"
	const innerGradient = bounds.append("radialGradient")
		.attr("id", innerGradientId)
	
	d3.range(numberOfStops).forEach(i => {
		innerGradient.append("stop")
			.attr("offset", `${i * 100 / (numberOfStops - 1)}%`)
			// .attr("stop-color", d3.interpolateBrBG((numberOfStops - i) / (numberOfStops - 1)))
			.attr("stop-color", "#e8e8e866")
	})

	const innerElevationAreaGenerator = d3.areaRadial()
		.angle(d => ANGLE_SCALE(d.x))
		.innerRadius(d => RADIUS_SCALE(d.y))
		.outerRadius(d => RADIUS_SCALE(MIN_ELEVATION))

	const innerElevationArea = bounds.append("path")
		.attr("class", "area")
		.attr("d", innerElevationAreaGenerator(oceanElevations))
		.style("fill", `url(#${innerGradientId})`)


	// drawCountryCloaks(countryToIndex, landElevations, bounds)


	// // OUTER GRADIENT
	// const outerGradientId = "outer-gradient"
	// const outerGradient = bounds.append("radialGradient")
	// 	.attr("id", outerGradientId)
	
	// d3.range(numberOfStops).forEach(i => {
	// 	outerGradient.append("stop")
	// 		.attr("offset", `${i * 100 / (numberOfStops - 1)}%`)
	// 		// .attr("stop-color", d3.interpolateBrBG((numberOfStops - i) / (numberOfStops - 1)))
	// 		.attr("stop-color", "#e8e8e866")
	// })

	// const outerElevationAreaGenerator = d3.areaRadial()
	// 	.angle(d => ANGLE_SCALE(d.x))
	// 	.innerRadius(d => RADIUS_SCALE(d.y))
	// 	.outerRadius(d => RADIUS_SCALE(MAX_ELEVATION))

	// const outerElevationArea = bounds.append("path")
	// 	.attr("class", "area")
	// 	.attr("d", outerElevationAreaGenerator(landElevations))
	// 	.style("fill", `url(#${outerGradientId})`)






	// Add north/south labels
	const directionLabels = bounds.selectAll(".direction-label")
		.data([
			{"text": "N", "index": 0, "offset": 0.5},
			{"text": "S", "index": 10800, "offset": 0.5, "baseline": "hanging"},
		])
		.enter()
		.append("text")
			.attr("class", "direction-label")
			.attr("x", d => getCoordinatesForAngle(ANGLE_SCALE(d.index), d.offset)[0])
			.attr("y", d => getCoordinatesForAngle(ANGLE_SCALE(d.index), d.offset)[1])
			.text(d => d.text)
			.attr("font-size", 20)
			.attr("text-anchor", "middle")
			.attr("fill", "#AAAAAA")
			.attr("opacity", 1)
			.attr("dominant-baseline", d => d.baseline)


	// Add north/south labels
	const seaLevelOffset = orderedElevations[5400] < 0 ? 0.74 : 0.69
	const elevationLabels = bounds.selectAll(".elevation-label")
		.data([
			{"text": "29,000 ft.", "index": 5400, "offset": 0.87, "anchor": "start"},
			{"text": "0", "index": 5400, "offset": seaLevelOffset, "anchor": "start"},
			{"text": "-36,200 ft.", "index": 5400, "offset": 0.55, "anchor": "end"}
		])
		.enter()
		.append("text")
			.attr("class", "elevation-label")
			.attr("x", d => getCoordinatesForAngle(ANGLE_SCALE(d.index), d.offset)[0])
			.attr("y", d => getCoordinatesForAngle(ANGLE_SCALE(d.index), d.offset)[1])
			.text(d => d.text)
			.attr("font-size", 12)
			.attr("text-anchor", d => d.anchor)
			.attr("fill", "#AAAAAA")
			.attr("opacity", 1)
			// .attr("dominant-baseline", d => d.baseline)





	// Location Points
	const searchLocationIndex = getPlotIndexFromLatLon(latitude, longitude)
	const searchLocationElevation = orderedElevations[searchLocationIndex]
	const searchLocationCountry = orderedCountries[searchLocationIndex]	
	const searchLocationOcean = orderedOceans[searchLocationIndex]	
	let searchLocationNearXY = getCoordinatesForAngle(ANGLE_SCALE(searchLocationIndex), RADIUS_SCALE(searchLocationElevation) / DIMENSIONS.boundedRadius)
	let searchLocationFarXY = getCoordinatesForAngle(ANGLE_SCALE(searchLocationIndex), RADIUS_SCALE(MAX_ELEVATION) / DIMENSIONS.boundedRadius)


	const antipodeLatitude = -latitude.toFixed(4)
	const antipodeLongitude = getAntipodeLongitude(longitude).toFixed(4)
	const antipodeIndex = getPlotIndexFromLatLon(antipodeLatitude, antipodeLongitude)
	const antipodeElevation = orderedElevations[antipodeIndex]
	const antipodeCountry = orderedCountries[antipodeIndex]	
	const antipodeOcean = orderedOceans[antipodeIndex]	
	let antipodeNearXY = getCoordinatesForAngle(ANGLE_SCALE(antipodeIndex), RADIUS_SCALE(antipodeElevation) / DIMENSIONS.boundedRadius)
	let antipodeFarXY = getCoordinatesForAngle(ANGLE_SCALE(antipodeIndex), RADIUS_SCALE(MAX_ELEVATION) / DIMENSIONS.boundedRadius)

	const labelLineLength = 20


	searchLocationFarXY = drawLabelLines(longitude, latitude, searchLocationNearXY, searchLocationFarXY, searchLocationIndex, labelLineLength, bounds, "search", false) 
	antipodeFarXY = drawLabelLines(antipodeLongitude, antipodeLatitude, antipodeNearXY, antipodeFarXY, antipodeIndex, labelLineLength, bounds, "antipode", false) 

	drawPointLabels(latitude, longitude, searchLocationElevation, searchLocationCountry, searchLocationOcean, searchLocationFarXY, labelLineLength, iso2FlagAspectRatios, bounds, "search")
	drawPointLabels(antipodeLatitude, antipodeLongitude, antipodeElevation, antipodeCountry, antipodeOcean, antipodeFarXY, labelLineLength, iso2FlagAspectRatios, bounds, "antipode")




	let negativeLongitude, positiveLongitude
	if (longitude > 0) {
		positiveLongitude = longitude
		negativeLongitude = antipodeLongitude
	} else {
		positiveLongitude = antipodeLongitude
		negativeLongitude = longitude
	}


	const locationDots = bounds.selectAll(".location-circle")
		.data([antipodeIndex])
		.enter().append("circle")
			.attr("id", d => (d === searchLocationIndex) ? "search-dot" : "antipode-dot")
			.attr("class", "location-circle")
			.style("fill", d => {
				if (orderedElevations[d] < 0) {
					return oceanColor
				} else {
					return landColor
				}
			})
			.style("stroke-width", 2)
			.style("stroke", d => {
				if (orderedElevations[d] < 0) {
					return oceanColors[0]
				} else {
					return landColors[1]
				}
			})
			.attr("cx", d => getCoordinatesForAngle(ANGLE_SCALE(d), RADIUS_SCALE(orderedElevations[d]) / DIMENSIONS.boundedRadius)[0])
			.attr("cy", d => getCoordinatesForAngle(ANGLE_SCALE(d), RADIUS_SCALE(orderedElevations[d]) / DIMENSIONS.boundedRadius)[1])
			.attr("r", d => 5)

	const locationStar = bounds.selectAll(".search-star")
		.data([searchLocationIndex])
  		.enter()
		.append("g")
			.attr("class", "search-star")
			.attr("transform", d => {
				const x = getCoordinatesForAngle(ANGLE_SCALE(d), RADIUS_SCALE(orderedElevations[d]) / DIMENSIONS.boundedRadius)[0]
				const y = getCoordinatesForAngle(ANGLE_SCALE(d), RADIUS_SCALE(orderedElevations[d]) / DIMENSIONS.boundedRadius)[1]
				return `translate(${x},${y})`
			})
			.attr("fill", "black")
			.attr("stroke-width", 1)
		.append("path")
			.attr("id", "search-star")
			.attr("d", d => {return d3.symbol().type(d3.symbolStar).size(STAR_SIZE)()})
			.style("stroke", d => {
				if (orderedElevations[d] < 0) {
					return oceanColors[0]
				} else {
					return landColors[1]
				}
			})
			.style("fill", d => {
				if (orderedElevations[d] < 0) {
					return oceanColor
				} else {
					return landColor
				}
			})
			.attr("stroke-width", 1.5)
			.style("opacity", 1)

	// Country Paths
	const countryPaths = bounds.selectAll(".country-path")
  		.data(countries.filter(d => {
  			return getCountryISO2FromCountryMetadata(d) !== 'AQ'
  		}))
  		.enter()
  		.append("path")
  			.attr("id", (d,i) => `country-path-${getCountryISO2FromCountryMetadata(d).toLowerCase()}-${i}`)
			.attr("class", "country-path")
			.attr("d", (d) => elevationRadialGenerator(formatCountryMetadata(d)))
			.attr("fill", "none")
			.attr("stroke", d => getPrimaryHexColorISO2(getCountryISO2FromCountryMetadata(d), iso2FlagColors))
			.attr("stroke-width", 3)
			.attr("opacity", 1)


	const maxFlagsPerRow = 15
	const numRows = uniqueCountries.length > maxFlagsPerRow ? 2 : 1
	if (numRows === 2) {
		plotFlagRow(uniqueCountries.slice(0, Math.floor(uniqueCountries.length / 2)), 0, bounds, iso2FlagAspectRatios)
		plotFlagRow(uniqueCountries.slice(Math.ceil(uniqueCountries.length / 2), uniqueCountries.length), 1, bounds, iso2FlagAspectRatios)
	} else {
		plotFlagRow(uniqueCountries, 0, bounds, iso2FlagAspectRatios)
	}

	let currentIndex = 0
	bounds.append("circle")
		.datum(currentIndex)
		.attr("id", "current-location")
		.attr("class", "location-circle")
		.style("fill", d => {
			if (orderedElevations[d] < 0) {
				return oceanColor
			} else {
				return landColor
			}
		})
		.style("stroke-width", 2)
		.style("stroke", d => {
			if (orderedElevations[d] < 0) {
				return oceanColors[0]
			} else {
				return landColors[1]
			}
		})
		.attr("cx", d => getCoordinatesForAngle(ANGLE_SCALE(d), RADIUS_SCALE(orderedElevations[d]) / DIMENSIONS.boundedRadius)[0])
		.attr("cy", d => getCoordinatesForAngle(ANGLE_SCALE(d), RADIUS_SCALE(orderedElevations[d]) / DIMENSIONS.boundedRadius)[1])
		.attr("r", d => 5)
		.style("opacity", 0)


	bounds.on("mousemove", onMouseMove)
	bounds.on("mouseleave", onMouseLeave)
	bounds.on("mouseenter", onMouseEnter)
	let enterState = false
	let mouseLabelsDrawn = false
	let previousEnterState = false
	let previousMouseISO2 = ''
	let previousMouseOcean = ''
	let cloakApplied = false
	let cloakCountry = null
	const upperBound = 0.85 * DIMENSIONS.boundedRadius
	// bounds.on("mouseenter", onMouseEnter)
	function onMouseMove(e) {
		const [x, y] = d3.mouse(this)
		if (y < upperBound) {
			const theta = (Math.atan2(y, x));
			const q1Mapping = d3.scaleLinear()
				.domain([0, -Math.PI/2])
				.range([Math.PI / 2, 0])
			const q2Mapping = d3.scaleLinear()
				.domain([-Math.PI / 2, -Math.PI])
				.range([2*Math.PI, 3/2*Math.PI])
			const q3Mapping = d3.scaleLinear()
				.domain([Math.PI, Math.PI/2])
				.range([3/2*Math.PI, Math.PI])
			const q4Mapping = d3.scaleLinear()
				.domain([Math.PI/2, 0])
				.range([Math.PI, Math.PI / 2])

			let mappedTheta
			if (theta <= -Math.PI/2) {
				mappedTheta = q2Mapping(theta)
			} else if(theta <= 0) {
				mappedTheta = q1Mapping(theta)
			} else if(theta <= Math.PI/2) {
				mappedTheta = q4Mapping(theta)
			} else {
				mappedTheta = q3Mapping(theta)
			}

			const mouseIndex = Math.round((ANGLE_SCALE.invert(mappedTheta)))
			const mouseElevation = orderedElevations[mouseIndex]
			const mouseCountry = orderedCountries[mouseIndex]
			const mouseOcean = orderedOceans[mouseIndex]
			const mouseISO2 = (mouseCountry === '') ? '' : mouseCountry.split(";")[0]
			const mouseCoords = getCoordinatesForAngle(ANGLE_SCALE(mouseIndex), RADIUS_SCALE(mouseElevation) / DIMENSIONS.boundedRadius)
			let mouseCoordsFar = getCoordinatesForAngle(ANGLE_SCALE(mouseIndex), RADIUS_SCALE(MAX_ELEVATION) / DIMENSIONS.boundedRadius)

			if (!cloakApplied || (cloakApplied && cloakCountry === mouseISO2.toLowerCase())) {
				d3.selectAll(`*[id^=mouse-`).style("opacity", 1)
				d3.selectAll(`*[id^=hlines-`).style("opacity", 0)
				d3.selectAll(`*[id^=search-`).style("opacity", 0)
				d3.selectAll(`*[id^=antipode-`).style("opacity", 0)
				d3.select("#current-location")
					.style("fill", (orderedElevations[mouseIndex] < 0) ? oceanColor : landColor)
					.attr("cx", mouseCoords[0])
					.attr("cy", mouseCoords[1])
					.style("opacity", 1)

				const mouseLongitude = getLongitudeFromIndex(mouseIndex, negativeLongitude, positiveLongitude) //(mouseIndex >= 10800) ? negativeLongitude : positiveLongitude
				const mouseLatitude = getLatitudeFromIndex(mouseIndex)
				mouseCoordsFar = drawLabelLines(mouseLongitude, mouseLatitude, mouseCoords, mouseCoordsFar, mouseIndex, labelLineLength, bounds, "mouse", mouseLabelsDrawn)
				drawPointLabels(mouseLatitude, mouseLongitude, mouseElevation, mouseCountry, mouseOcean, mouseCoordsFar, labelLineLength, iso2FlagAspectRatios, bounds, "mouse", mouseLabelsDrawn)
				mouseLabelsDrawn = true

				// Update center information
				
				if ((previousMouseISO2 !== mouseISO2) || (previousMouseOcean !== mouseOcean) || (previousEnterState !== enterState)) {
					d3.select(`#center-flag-${previousMouseISO2.toLowerCase()}`).attr("opacity", 0)
					d3.select(`#center-border-flag-${previousMouseISO2.toLowerCase()}`).attr("opacity", 0)
				
					if (mouseCountry !== "" || mouseOcean !== "") {
						
						d3.select(`#icon-flag`).attr("opacity", 0)
						d3.select(`#center-flag-${mouseISO2.toLowerCase()}`).attr("opacity", 1)
						d3.select(`#center-border-flag-${mouseISO2.toLowerCase()}`).attr("opacity", 1)
						if (mouseCountry === "") {
							const distance = getDistanceFromNumIndices(waterDistance[mouseOcean]['ocean']) 
							d3.select("#icon-text-flag")
								.html(`${mouseOcean}`)
							 	.style("fill", "#54a0ff")
							 	.style("font-weight", "700px")
							d3.select("#icon-text-ocean").html(`${numberWithCommas(distance)} mi.`)
							d3.select("#icon-text-land").html('0 mi.')
						} else {
							const mouseCountryFormatted = (mouseCountry === '') ? '' : mouseCountry.split(";")[1]
							const mouseOceanDistance = getDistanceFromNumIndices(countryDistance[mouseISO2]['ocean'])
							const mouseLandDistance = getDistanceFromNumIndices(countryDistance[mouseISO2]['land'])
							d3.select("#icon-text-ocean").html(`${numberWithCommas(mouseOceanDistance)} mi.`)
							d3.select("#icon-text-land").html(`${numberWithCommas(mouseLandDistance)} mi.`)
							d3.select("#icon-text-flag")
								.html(`${mouseCountryFormatted}`)
							 	.style("fill", getPrimaryHexColorISO2(mouseISO2, iso2FlagColors))
							 	.style("font-weight", "700px")
						}
						
					} else {
						d3.select(`#center-flag-${mouseISO2.toLowerCase()}`).attr("opacity", 0)
						d3.select(`#center-border-flag-${mouseISO2.toLowerCase()}`).attr("opacity", 0)
						d3.select(`#icon-flag`).attr("opacity", 1)
						d3.select("#icon-text-flag")
							.html(`${numNations} Countries`)
							.style("fill", "#414141")
						d3.select("#icon-text-ocean").html(`${numberWithCommas(oceanDistance)} mi.`)
						d3.select("#icon-text-land").html(`${numberWithCommas(landDistance)} mi.`)
					}
				}
				previousMouseISO2 = mouseISO2
				previousMouseOcean = mouseOcean
			} 
		} else {
			onMouseLeave()
		}
	}
	function onMouseEnter(e) {
		enterState = true
	}
	function onMouseLeave(e) {
		if (!cloakApplied) {
			enterState = false
			d3.select(`#icon-flag`).attr("opacity", 1)
			d3.select(`#center-flag-${previousMouseISO2.toLowerCase()}`).attr("opacity", 0)
			d3.select(`#center-border-flag-${previousMouseISO2.toLowerCase()}`).attr("opacity", 0)
			d3.select("#current-location").style("opacity", 0)
			d3.selectAll(`*[id^=mouse-`).style("opacity", 0)
			d3.selectAll(`*[id^=search-`).style("opacity", 1)
			d3.selectAll(`*[id^=antipode-`).style("opacity", 1)
			d3.select("#icon-text-flag")
				.html(`${numNations} Countries`)
				.style("fill", "#414141")
			d3.select("#icon-text-ocean").html(`${numberWithCommas(oceanDistance)} mi.`)
			d3.select("#icon-text-land").html(`${numberWithCommas(landDistance)} mi.`)
		}
	}

	let highlightLabelsDrawn = false
	const flagGroup = d3.selectAll("*[id^=list-flag-")
	flagGroup.on("click", onFlagClick)
	function onFlagClick(clickedFlag) {
		const clickedISO2 = clickedFlag.toLowerCase()
		const clickedSameCountry = cloakCountry === clickedISO2
		if (cloakApplied && clickedSameCountry) {
			d3.select("#current-location").style("opacity", 0)
			d3.selectAll(`*[id^=mouse-`).style("opacity", 0)
			d3.selectAll(`*[id^=highlight-`).style("opacity", 0)
			d3.selectAll(`*[id^=hlines-`).style("opacity", 0)
			d3.selectAll('.country-path')
				.transition("remove-cloak")
				.duration(200)
				.style("opacity", 1)
			d3.selectAll(`*[id^=country-path-${cloakCountry}`)
				.transition("normalize-country")
				.duration(200)
				.attr("stroke-width", 3)
			d3.selectAll(`*[id^=border-flag-`)
				.transition("remove-flag-cloak")
				.duration(200)
			    .style("fill", "transparent")
			    .attr("opacity", 0)
				.style("stroke", "black")
				.style("stroke-width", 0.1)


			d3.select(`#center-flag-${cloakCountry.toLowerCase()}`).attr("opacity", 0)
			d3.select(`#center-border-flag-${cloakCountry.toLowerCase()}`).attr("opacity", 0)
			d3.select(`#icon-flag`).attr("opacity", 1)
			d3.select("#icon-text-flag")
				.html(`${numNations} Countries`)
				.style("fill", "#414141")
			d3.select("#icon-text-ocean").html(`${numberWithCommas(oceanDistance)} mi.`)
			d3.select("#icon-text-land").html(`${numberWithCommas(landDistance)} mi.`)
			cloakCountry = null
			cloakApplied = false
		} 
		if (!clickedSameCountry) {
			d3.selectAll(`*[id^=hlines-`).remove()
			if (cloakCountry) {
				d3.select(`#center-flag-${cloakCountry.toLowerCase()}`).attr("opacity", 0)
				d3.select(`#center-border-flag-${cloakCountry.toLowerCase()}`).attr("opacity", 0)
			}
			
			cloakCountry = clickedISO2
			cloakApplied = true

			// d3.selectAll(`*[id^=mouse-`).style("opacity", 0)
			const highlightIndex = countryToIndex[cloakCountry.toUpperCase()][0]["start"]
			const highlightElevation = orderedElevations[highlightIndex]
			const highlightCountry = `${cloakCountry};${iso2Name[cloakCountry.toUpperCase()]}`
			const highlightOcean = orderedOceans[highlightIndex]
			const highlightCoords = getCoordinatesForAngle(ANGLE_SCALE(highlightIndex), RADIUS_SCALE(highlightElevation) / DIMENSIONS.boundedRadius)
			const highlightLongitude = getLongitudeFromIndex(highlightIndex, negativeLongitude, positiveLongitude) //(mouseIndex >= 10800) ? negativeLongitude : positiveLongitude
			const highlightLatitude = getLatitudeFromIndex(highlightIndex)
			let highlightFarXY = getCoordinatesForAngle(ANGLE_SCALE(highlightIndex), RADIUS_SCALE(MAX_ELEVATION) / DIMENSIONS.boundedRadius)

			d3.select("#current-location")
				.attr("cx", highlightCoords[0])
				.attr("cy", highlightCoords[1])
				.style("opacity", 1)

			highlightFarXY = drawLabelLines(highlightLongitude, highlightLatitude, highlightCoords, highlightFarXY, highlightIndex, labelLineLength, bounds, "hlines", false)
			drawPointLabels(highlightLatitude, highlightLongitude, highlightElevation, highlightCountry, highlightOcean, highlightFarXY, labelLineLength, iso2FlagAspectRatios, bounds, "hlines", false)
			highlightLabelsDrawn = true

			d3.selectAll(`*[id^=hlines-`).style("opacity", 1)
			d3.selectAll(`*[id^=mouse-`).style("opacity", 0)
			d3.selectAll('.country-path')
				.filter(function() {
			      	return !this.id.startsWith(`country-path-${cloakCountry}`)
			    })
				.transition("apply-cloak")
				.duration(200)
				.style("opacity", 0.1)
				.attr("stroke-width", 3)
			d3.selectAll(`*[id^=country-path-${cloakCountry}`)
				.transition("highlight-country")
				.duration(200)
				.style("opacity", 1)
				.attr("stroke-width", 5)
			d3.selectAll(`*[id^=search-`).style("opacity", 0)
			d3.selectAll(`*[id^=antipode-`).style("opacity", 0)
			d3.selectAll(`*[id^=border-flag-`)
				.filter(function() {
			      	return !this.id.startsWith(`border-flag-${cloakCountry}`)
			    })
			    .style("opacity", 0.9)
			    .style("fill", "white")
			    .style("stroke-width", 1)
			    .style("stroke", "white")


			const clickedCountryFormatted = countryDistance[clickedFlag]['name']
			const clickedOceanDistance = getDistanceFromNumIndices(countryDistance[clickedFlag]['ocean'])
			const clickedLandDistance = getDistanceFromNumIndices(countryDistance[clickedFlag]['land'])
			d3.select(`#icon-flag`).attr("opacity", 0)
			d3.select(`#center-flag-${clickedISO2}`).attr("opacity", 1)
			d3.select(`#center-border-flag-${clickedISO2}`).attr("opacity", 1)
			d3.select(`*[id^=border-flag-${clickedISO2}`)
			    .style("fill", "transparent")
			    .attr("opacity", 0)
				.style("stroke", "black")
				.style("stroke-width", 0.1)

			d3.select("#icon-text-flag")
				.html(`${clickedCountryFormatted}`)
			 	.style("fill", getPrimaryHexColorISO2(clickedFlag, iso2FlagColors))
			 	.style("font-weight", "700px")
			d3.select("#icon-text-ocean").html(`${numberWithCommas(clickedOceanDistance)} mi.`)
			d3.select("#icon-text-land").html(`${numberWithCommas(clickedLandDistance)} mi.`)
		}		
	}
}


function getLatitudeFromIndex(index) {
	let latitude
	if (index <= 10800) {
		const indexToLatitudeScale = d3.scaleLinear()
			.domain([0, 10800])
			.range([90, -90])
		latitude = indexToLatitudeScale(index).toFixed(4)
	} else {
		const indexToLatitudeInverseScale = d3.scaleLinear()
			.domain([0, 10800])
			.range([-90, 90])
		latitude = indexToLatitudeInverseScale(index - 10800).toFixed(4)
	}
	return latitude
}

function getLongitudeFromIndex(index, negativeLongitude, positiveLongitude) {
	const longitude = (index >= 10800) ? negativeLongitude : positiveLongitude
	return longitude		
}

function drawCenterFlags(yValue, countries, iso2FlagAspectRatios, bounds) {
	const flagHeight = 25
	const centerFlagGroup = bounds.append("g").attr("id", `center-flag-group`)
	const centerFlagList = centerFlagGroup.selectAll(`*[id^=center-flag-`)
		.data(countries)
		.enter()
		.append("svg:image")
			.attr("id", (d,i) => `center-flag-${d.toLowerCase()}`)
			.attr("class", "center-flag")
			.attr("xlink:href", d => `./../assets/images/flags/${d.toLowerCase()}.png`)
			.attr("height", flagHeight)
			.style("justify-content", "center")
			.attr("x", (d,i) => {
				const imageDimensions = iso2FlagAspectRatios[countries[i].toLowerCase()]
				const imageHeight = imageDimensions['height']
				const imageWidth = imageDimensions['width']
				const pixelImageWidth = (imageWidth / imageHeight) * flagHeight
				return 0 - pixelImageWidth / 2
			})
			.attr("y", yValue)
			.attr("opacity", 0)

	const centerFlagBorder = centerFlagGroup.selectAll(`*[id^=center-border-flag-`)
		.data(countries)
		.enter()
		.append("rect")
			.attr("id", (d,i) => `center-border-flag-${d.toLowerCase()}`)
			.attr("class", "border-flag")
			.attr("height", flagHeight)
			.attr("width", (d,i) =>  {
				// Nepal has the only non-rectangular flag
				if (d === "NP") {
					return 0
				}
				const imageDimensions = iso2FlagAspectRatios[d.toLowerCase()]
				const imageHeight = imageDimensions['height']
				const imageWidth = imageDimensions['width']
				const pixelImageWidth = (imageWidth / imageHeight) * flagHeight
				return pixelImageWidth
			})
			.attr("x", (d,i) => {	
				const imageDimensions = iso2FlagAspectRatios[d.toLowerCase()]
				const imageHeight = imageDimensions['height']
				const imageWidth = imageDimensions['width']
				const pixelImageWidth = (imageWidth / imageHeight) * flagHeight
				return 0 - pixelImageWidth / 2
			})
			.attr("y", yValue)
			.attr("opacity", 0)
			.attr("fill", "none")
			.style("stroke", "black")
			.style("stroke-width", .1)
			.attr("pointer-events", "none")
}


function drawCountryCloaks(countryMetadata, landElevations, bounds) {
	const cloakGenerator = d3.areaRadial()
		.angle(d => ANGLE_SCALE(d.x))
		.innerRadius(RADIUS_SCALE(MIN_ELEVATION))
		.outerRadius(d => RADIUS_SCALE(d.y + 1))

	for (var i = 0; i < Object.keys(countryMetadata).length; i++) {
		const country = Object.keys(countryMetadata)[i]
		const countrySegments = countryMetadata[country]
		let startIndex = 0
		let endIndex = 0
		for (var j = 0; j < countrySegments.length; j++) {
			const countrySegment = countrySegments[j]
			const countryStartIndex = countrySegment['start'] < countrySegment['end'] ? countrySegment['start'] : countrySegment['end']
			const countryEndIndex = countrySegment['start'] < countrySegment['end'] ? countrySegment['end'] : countrySegment['start']
			
			const highlightArea = bounds.append("path")
				.attr("id", `highlight-${country.toLowerCase()}-${j}`)
				.attr("class", "area")
				.attr("d", cloakGenerator(landElevations.slice(countryStartIndex, countryEndIndex)))
				.style("fill", "#FFFFFF00")
				.style("opacity", 0)
				.style("stroke-width", 0.5)
				.style("stroke", "transparent")

			if (startIndex < countryStartIndex) {
				endIndex = countryStartIndex
			} else {
				startIndex = countryEndIndex
				if (j !== (countrySegment.length - 1)){
					continue
				}
			}
			let cloakElevation = landElevations.slice(startIndex, endIndex)
			const cloakArea = bounds.append("path")
				.attr("id", `cloak-${country.toLowerCase()}-${j}`)
				.attr("class", "area")
				.attr("d", cloakGenerator(cloakElevation))
				.style("fill", "#FFFFFFEE")
				.style("opacity", 0)
				.style("stroke-width", 1)
				.style("stroke", "transparent")

			startIndex = countryEndIndex
			if (j === (countrySegments.length - 1)) {
				endIndex = NUM_INDICES + 1
				cloakElevation = landElevations.slice(startIndex, endIndex + 1)
				const cloakArea = bounds.append("path")
					.attr("id", `cloak-${country.toLowerCase()}-${j + 1}`)
					.attr("class", "area")
					.attr("d", cloakGenerator(cloakElevation))
					.style("fill", "#FFFFFFEE")
					.style("opacity", 0)
					.style("stroke-width", 1)
					.style("stroke", "transparent")
			}
			
		}

	}
}

function getDistanceFromNumIndices(numIndices) {
	return Math.round((numIndices / NUM_INDICES) * EARTH_CIRCUMFERENCE * METERS_TO_MILES)
}


function drawPointLabels(latitude, longitude, elevation, country, ocean, farXY, labelLineLength, iso2FlagAspectRatios, bounds, prefix, update) {
		const formattedISO2 = (country === '') ? '' : country.split(";")[0].toLowerCase()
		const formattedCountryName = (country === '') ? '' : country.split(";")[1]

		const labelBuffer = 5
		const flagHeight = 15
		const flagWidth = (formattedISO2 in iso2FlagAspectRatios) ? (iso2FlagAspectRatios[formattedISO2]['width'] / iso2FlagAspectRatios[formattedISO2]['height']) * flagHeight : 0
		const latitudeDirection = (latitude > 0) ? "N" : "S"
		const longitudeDirection = (longitude > 0) ? "E" : "W"

		const xAnchor = (longitude < 0) ? farXY[0] - labelLineLength - labelBuffer : farXY[0] + labelLineLength + labelBuffer
		const xFlagAnchor = (longitude < 0) ? farXY[0] - labelLineLength - flagWidth - labelBuffer: farXY[0] + labelLineLength + labelBuffer
		const yAnchor = farXY[1]
		const textAnchor = (longitude < 0) ?  "end" : "start"

		const upperText = (ocean === "") ? '' : formattedCountryName
		const lowerText = (ocean === "") ? formattedCountryName : ocean
		const latLonText = `${Math.abs(latitude).toFixed(4)}&deg;${latitudeDirection}, ${Math.abs(longitude).toFixed(4)}&deg;${longitudeDirection}`
		const elevationText = `${numberWithCommas(Math.round(elevation * METERS_TO_FEET))} ft.`
		const flagLink = (formattedISO2 in iso2FlagAspectRatios) ? `./../assets/images/flags/${formattedISO2}.png` : ''

		if (update) {
			d3.select(`#${prefix}-label-upper`)
				.attr("x", xAnchor)
				.attr("y", yAnchor - 34)
				.attr("text-anchor", textAnchor)
				.html(upperText)
			d3.select(`#${prefix}-label-lower`)
				.attr("x", xAnchor)
				.attr("y", yAnchor - 17)
				.attr("text-anchor", textAnchor)
				.html(lowerText)
			d3.select(`#${prefix}-label-coords`)
				.attr("x", xAnchor)
				.attr("y", yAnchor)
				.attr("text-anchor", textAnchor)
				.html(latLonText)
			d3.select(`#${prefix}-label-elevation`)
				.attr("x", xAnchor)
				.attr("y", yAnchor + 17)
				.attr("text-anchor", textAnchor)
				.html(elevationText)
			d3.select(`#${prefix}-label-flag`)
				.attr("xlink:href", flagLink)
				.attr("x", xFlagAnchor)
				.attr("y", yAnchor + 25)
			d3.select(`#${prefix}-label-border-flag`)
				.attr("height", flagHeight)
				.attr("width", d => {
					// Nepal has the only non-rectangular flag
					if (formattedISO2 === "NP" || formattedISO2 === "") {
						return 0
					}
					const imageDimensions = iso2FlagAspectRatios[formattedISO2]
					const imageHeight = imageDimensions['height']
					const imageWidth = imageDimensions['width']
					const pixelImageWidth = (imageWidth / imageHeight) * flagHeight
					return pixelImageWidth
				})
				.attr("x", xFlagAnchor)
				.attr("y", yAnchor + 25)

		} else {
			bounds.append("text")
				.attr("id", `${prefix}-label-upper`)
				.attr("class", "point-label")
				.attr("x", xAnchor)
				.attr("y", yAnchor - 34)
				.html(upperText)
				.attr("font-size", 12)
				.attr("text-anchor", textAnchor)
				.attr("fill", "#414141")
				.attr("opacity", 1)
			bounds.append("text")
				.attr("id", `${prefix}-label-lower`)
				.attr("class", "point-label")
				.attr("x", xAnchor)
				.attr("y", yAnchor - 17)
				.html(lowerText)
				.attr("font-size", 12)
				.attr("text-anchor", textAnchor)
				.attr("fill", "#414141")
				.attr("opacity", 1)
			bounds.append("text")
				.attr("id", `${prefix}-label-coords`)
				.attr("class", "point-label")
				.attr("x", xAnchor)
				.attr("y", yAnchor)
				.html(latLonText)
				.attr("font-size", 12)
				.attr("text-anchor", textAnchor)
				.attr("fill", "#414141")
				.attr("opacity", 1)
			bounds.append("text")
				.attr("id", `${prefix}-label-elevation`)
				.attr("class", "point-label")
				.attr("x", xAnchor)
				.attr("y", yAnchor + 17)
				.html(elevationText)
				.attr("font-size", 12)
				.attr("text-anchor", textAnchor)
				.attr("fill", "#414141")
				.attr("opacity", 1)
			bounds.append("svg:image")
				.attr("id", `${prefix}-label-flag`)
				.attr("class", "point-flag")
				.attr("xlink:href", flagLink)
				.attr("height", flagHeight)
				.style("justify-content", "center")
				.attr("x", xFlagAnchor)
				.attr("y", yAnchor + 25)
				.attr("opacity", 1)
			bounds.append("rect")
				.attr("id", `${prefix}-label-border-flag`)
				.attr("class", "border-flag")
				.attr("height", flagHeight)
				.attr("width", d => {
					// Nepal has the only non-rectangular flag
					if (formattedISO2 === "NP" || formattedISO2 === "") {
						return 0
					}
					const imageDimensions = iso2FlagAspectRatios[formattedISO2]
					const imageHeight = imageDimensions['height']
					const imageWidth = imageDimensions['width']
					const pixelImageWidth = (imageWidth / imageHeight) * flagHeight
					return pixelImageWidth
				})
				.attr("x", xFlagAnchor)
				.attr("y", yAnchor + 25)
				.attr("opacity", 1)
				.attr("fill", "none")
				.style("stroke", "black")
				.style("stroke-width", .1)
				.attr("pointer-events", "none")
		}
	}


function drawLabelLines(longitude, latitude, nearXY, farXY, index, labelLineLength, bounds, prefix, update) {
	// d3.selectAll(`*[id^=${prefix}-`).remove()
	const labelBuffer = 5
	if (update) {
		d3.select(`#${prefix}-label-background`)
			.attr("x", (longitude < 0) ? farXY[0] - labelLineLength - labelBuffer - 75 : farXY[0] + labelLineLength + labelBuffer - 15)
			.attr("y", farXY[1] - 25)
	} else {
		bounds.append("rect")
			.attr("id", `${prefix}-label-background`)
			.attr("height", 70)
			.attr("width", 100)
			.attr("x", (longitude < 0) ? farXY[0] - labelLineLength - labelBuffer - 75 : farXY[0] + labelLineLength + labelBuffer - 15)
			.attr("y", farXY[1] - 25)
			.style("opacity", 1)
			.attr("fill", "white")
			.style("stroke", "black")
			.style("stroke-width", 0)
			.attr("pointer-events", "none")	
	}


	const positiveCutoff = 50
	const negativeCutoff = -50
	if (latitude < negativeCutoff || latitude > positiveCutoff) {
		let latitudeCutoff = negativeCutoff
		let angleAdjustment = (longitude < 0) ? 315 : -315
		if (latitude > positiveCutoff) {
			latitudeCutoff = positiveCutoff
			angleAdjustment = (longitude < 0) ? -315 : 315
		}
		const adjustedIndex = getPlotIndexFromLatLon(latitudeCutoff, longitude)
		const middleElevationMultiplier = 0.55
		
		const middleXY = getCoordinatesForAngle(ANGLE_SCALE(index), RADIUS_SCALE(MAX_ELEVATION * middleElevationMultiplier) / DIMENSIONS.boundedRadius)
		const adjustedMiddleXY = getCoordinatesForAngle(ANGLE_SCALE(adjustedIndex-angleAdjustment), RADIUS_SCALE(MAX_ELEVATION * middleElevationMultiplier) / DIMENSIONS.boundedRadius)
		farXY = getCoordinatesForAngle(ANGLE_SCALE(adjustedIndex), RADIUS_SCALE(MAX_ELEVATION) / DIMENSIONS.boundedRadius)
		d3.select(`#${prefix}-label-background`)
			.attr("x", (longitude < 0) ? farXY[0] - labelLineLength - labelBuffer - 75 : farXY[0] + labelLineLength + labelBuffer - 15)
			.attr("y", farXY[1] - 25)

		if ((latitude > -60 && latitude < latitudeCutoff) || (latitude < 60 && latitude > latitudeCutoff)) {
			d3.selectAll(`*[id^=${prefix}-B`).style("opacity", 0)
			d3.selectAll(`*[id^=${prefix}-C`).style("opacity", 0)
			if (update && d3.select(`#${prefix}-A1`).nodes().length !== 0) {				
				d3.select(`#${prefix}-A1`)
					.attr("x1", nearXY[0])
					.attr("y1", nearXY[1])
					.attr("x2", adjustedMiddleXY[0])
					.attr("y2", adjustedMiddleXY[1])
					.style("opacity", 1)
				d3.select(`#${prefix}-A2`)
				    .attr("x1", adjustedMiddleXY[0])
				    .attr("y1", adjustedMiddleXY[1])
				    .attr("x2", (longitude < 0) ? farXY[0] - labelLineLength : farXY[0] + labelLineLength)
				    .attr("y2", farXY[1])
				    .style("opacity", 1)
			} else {
				bounds.append("line")
					.attr("id", `${prefix}-A1`)
				    .style("stroke", "#AAAAAA")
				    .attr("stroke-width", 1)
				    .attr("x1", nearXY[0])
				    .attr("y1", nearXY[1])
				    .attr("x2", adjustedMiddleXY[0])
				    .attr("y2", adjustedMiddleXY[1])
				bounds.append("line")
					.attr("id", `${prefix}-A2`)
				    .style("stroke", "#AAAAAA")
				    .attr("stroke-width", 1)
				    .attr("x1", adjustedMiddleXY[0])
				    .attr("y1", adjustedMiddleXY[1])
				    .attr("x2", (longitude < 0) ? farXY[0] - labelLineLength : farXY[0] + labelLineLength)
				    .attr("y2", farXY[1])
			}

		} else {
			d3.selectAll(`*[id^=${prefix}-A`).style("opacity", 0)
			d3.selectAll(`*[id^=${prefix}-C`).style("opacity", 0)
			if (update && d3.select(`#${prefix}-B1`).nodes().length !== 0) {
				d3.select(`#${prefix}-B1`)
				    .attr("x1", nearXY[0])
				    .attr("y1", nearXY[1])
				    .attr("x2", middleXY[0])
				    .attr("y2", middleXY[1])
				    .style("opacity", 1)
				var updatedArc = d3.arc()
					.innerRadius(RADIUS_SCALE(MAX_ELEVATION * middleElevationMultiplier))
					.outerRadius(RADIUS_SCALE(MAX_ELEVATION * middleElevationMultiplier))
					.startAngle(ANGLE_SCALE(index))
					.endAngle(ANGLE_SCALE(adjustedIndex - angleAdjustment));

				d3.select(`#${prefix}-B2`)
					.attr("class", "arc")
					.attr("fill", "transparent")
					.attr("stroke", "#AAAAAA")
					.attr("stroke-width", 0.5)
					.attr("d", updatedArc)
					.style("opacity", 1)

				d3.select(`#${prefix}-B3`)
				    .attr("x1", adjustedMiddleXY[0])
				    .attr("y1", adjustedMiddleXY[1])
				    .attr("x2", (longitude < 0) ? farXY[0] - labelLineLength : farXY[0] + labelLineLength)
				    .attr("y2", farXY[1])
				    .style("opacity", 1)
			} else {
				bounds.append("line")
					.attr("id", `${prefix}-B1`)
				    .style("stroke", "#AAAAAA")
				    .attr("stroke-width", 1)
				    .attr("x1", nearXY[0])
				    .attr("y1", nearXY[1])
				    .attr("x2", middleXY[0])
				    .attr("y2", middleXY[1])

				var middleArc = d3.arc()
					.innerRadius(RADIUS_SCALE(MAX_ELEVATION * middleElevationMultiplier))
					.outerRadius(RADIUS_SCALE(MAX_ELEVATION * middleElevationMultiplier))
					.startAngle(ANGLE_SCALE(index))
					.endAngle(ANGLE_SCALE(adjustedIndex - angleAdjustment));

				bounds.append("path")
					.attr("id", `${prefix}-B2`)
					.attr("class", "arc")
					.attr("fill", "transparent")
					.attr("stroke", "#AAAAAA")
					.attr("stroke-width", 0.5)
					.attr("d", middleArc);

				bounds.append("line")
					.attr("id", `${prefix}-B3`)
				    .style("stroke", "#AAAAAA")
				    .attr("stroke-width", 1)
				    .attr("x1", adjustedMiddleXY[0])
				    .attr("y1", adjustedMiddleXY[1])
				    .attr("x2", (longitude < 0) ? farXY[0] - labelLineLength : farXY[0] + labelLineLength)
				    .attr("y2", farXY[1])
			}
		}

	} else {
		d3.selectAll(`*[id^=${prefix}-A`).style("opacity", 0)
		d3.selectAll(`*[id^=${prefix}-B`).style("opacity", 0)
		if (update && d3.select(`#${prefix}-C1`).nodes().length !== 0) {
			d3.select(`#${prefix}-C1`)
			    .attr("x1", nearXY[0])
			    .attr("y1", nearXY[1])
			    .attr("x2", farXY[0])
			    .attr("y2", farXY[1])
			    .style("opacity", 1)
			d3.select(`#${prefix}-C2`)
			    .attr("x1", farXY[0])
			    .attr("y1", farXY[1])
			    .attr("x2", (longitude < 0) ? farXY[0] - labelLineLength : farXY[0] + labelLineLength)
			    .attr("y2", farXY[1])
			    .style("opacity", 1)
		} else {
			bounds.append("line")
				.attr("id", `${prefix}-C1`)
			    .style("stroke", "#AAAAAA")
			    .attr("stroke-width", 1)
			    .attr("x1", nearXY[0])
			    .attr("y1", nearXY[1])
			    .attr("x2", farXY[0])
			    .attr("y2", farXY[1])
			bounds.append("line")
				.attr("id", `${prefix}-C2`)
			    .style("stroke", "#AAAAAA")
			    .attr("stroke-width", 1)
			    .attr("x1", farXY[0])
			    .attr("y1", farXY[1])
			    .attr("x2", (longitude < 0) ? farXY[0] - labelLineLength : farXY[0] + labelLineLength)
			    .attr("y2", farXY[1])
		}

	}
	return farXY

}

function getImageDimensions(url){  
	let dimensions = {}
    var img = new Image();
    img.onload = function(){
        dimensions['width'] = this.width
        dimensions['height'] = this.height
    };
    img.src = url;
    img.onload()
    return dimensions
}

async function plotFlagRow(countries, rowIndex, bounds, iso2FlagAspectRatios) {
	const flagHeight = 20
	const sideMargin = 10
	const heightMargin = 10
	let flagAdjustment = 0

	const imageDimensionsArray = []
	for (var i = 0; i < countries.length; i++) {
		const imgDimensions = getImageDimensions(`./../assets/images/flags/${countries[i].toLowerCase()}.png`)
		imageDimensionsArray.push(imgDimensions)
	}

	const countryFlagGroup = bounds.append("g").attr("id", `country-flag-group-${rowIndex}`)
	const countryFlagList = countryFlagGroup.selectAll(`.list-flag-${rowIndex}`)
		.data(countries)
		.enter()
		.append("svg:image")
			.attr("id", (d,i) => `list-flag-${d.toLowerCase()}-${i}`)
			.attr("class", `list-flag-${rowIndex}`)
			.attr("xlink:href", d => `./../assets/images/flags/${d.toLowerCase()}.png`)
			.attr("height", flagHeight)
			.style("justify-content", "center")
			.style('cursor', 'pointer')
			.attr("x", (d,i) => {
				if (i > 0) {
					const imageDimensions = iso2FlagAspectRatios[countries[i-1].toLowerCase()]
					const imageHeight = imageDimensions['height']
					const imageWidth = imageDimensions['width']
					const pixelImageWidth = (imageWidth / imageHeight) * flagHeight
					flagAdjustment += pixelImageWidth
				}
				return (i) * sideMargin + flagAdjustment
			})
			.attr("y", (d,i) => {
				const heightAdjustment = (flagHeight + heightMargin)
				return rowIndex * heightAdjustment + DIMENSIONS.boundedHeight / 2 + 10
			})
			.attr("opacity", 0)

	let borderAdjustment = 0
	const countryFlagBorder = countryFlagGroup.selectAll(`.border-flag-${rowIndex}`)
		.data(countries)
		.enter()
		.append("rect")
			.attr("id", (d,i) => `border-flag-${d.toLowerCase()}-${i}`)
			.attr("class", `border-flag-${rowIndex}`)
			.attr("height", flagHeight)
			.attr("width", (d,i) =>  {
				// Nepal has the only non-rectangular flag
				if (d === "NP") {
					return 0
				}
				const imageDimensions = iso2FlagAspectRatios[countries[i].toLowerCase()]
				const imageHeight = imageDimensions['height']
				const imageWidth = imageDimensions['width']
				const pixelImageWidth = (imageWidth / imageHeight) * flagHeight
				return pixelImageWidth
			})
			.attr("x", (d,i) => {	
				if (i > 0) {
					const imageDimensions = iso2FlagAspectRatios[countries[i-1].toLowerCase()]
					const imageHeight = imageDimensions['height']
					const imageWidth = imageDimensions['width']
					const pixelImageWidth = (imageWidth / imageHeight) * flagHeight
					borderAdjustment += pixelImageWidth
				}				
				return (i) * sideMargin + borderAdjustment
			})
			.attr("y", (d,i) => {
				const heightAdjustment = (flagHeight + heightMargin)
				return rowIndex * heightAdjustment + DIMENSIONS.boundedHeight / 2 + 10
			})
			.attr("opacity", 0)
			.attr("fill", "none")
			.style("stroke", "black")
			.style("stroke-width", .1)
			.attr("pointer-events", "none")


	const flagCenteringAdjustment = d3.select(`#country-flag-group-${rowIndex}`).node().getBoundingClientRect().width

	d3.selectAll(`.list-flag-${rowIndex}`)
		.style("transform", `translate(${-flagCenteringAdjustment / 2}px, ${0}px)`)
		.style("opacity", 1)
	d3.selectAll(`.border-flag-${rowIndex}`)
		.style("transform", `translate(${-flagCenteringAdjustment / 2}px, ${0}px)`)
		.style("opacity", 1)
	return
}

function getPlotIndexFromLatLon(latitude, longitude) {
	if (longitude < 0) {
		const adjustment = 10802
		return Math.round(NEGATIVE_SCALE(latitude) + adjustment)
	} else {
		return Math.round(POSITIVE_SCALE(latitude))
	}
}

function getAntipodeLongitude(longitude){
	let antipodeLongitude = 180 - Math.abs(longitude)
	if (longitude > 0) {
		antipodeLongitude = -1 * antipodeLongitude
	}
	return antipodeLongitude	
}


function getAntipodePlotIndex(latitude, longitude) {
	const antipodeLatitude = -latitude
	const antipodeLongitude = getAntipodeLongitude(longitude)
	return getPlotIndexFromLatLon(antipodeLatitude, antipodeLongitude, NEGATIVE_SCALE, POSITIVE_SCALE)
}

function getCoordinatesForAngle(angle, offset=1) {
	const x = Math.cos(angle - Math.PI / 2) * DIMENSIONS.boundedRadius * offset
	const y = Math.sin(angle - Math.PI / 2) * DIMENSIONS.boundedRadius * offset
	return [x, y]
}

function getPrimaryHexColorISO2(iso2, iso2FlagColors) {
	let hexColor = "#e8e8e8"
	if (iso2 === null) {
		return hexColor
	}
	const iso2Lower = iso2.toLowerCase()
	if (iso2Lower in iso2FlagColors) {
		hexColor = iso2FlagColors[iso2Lower][0]
	}
	return hexColor
}

function formatCountryMetadata(country_metadata, distances) {
	const startLat = country_metadata['start_latitude']
	const endLat = country_metadata['end_latitude']
	const lon = country_metadata['longitude']

	const startIndex = getPathIndexFromLatLon(startLat, lon)
	const endIndex = getPathIndexFromLatLon(endLat, lon)

	let smallerIndex, largerIndex
	if (startIndex <= endIndex) {
		smallerIndex = startIndex
		largerIndex = endIndex
	} else {
		smallerIndex = endIndex
		largerIndex = startIndex
	}
	const pathIndices = range(smallerIndex, largerIndex)
	const path = [];
	for (var i=0; i < pathIndices.length; i++) {
		path.push({x:pathIndices[i], y:MIN_ELEVATION}) 
	}
	return path
}


function getPathIndexFromLatLon(latitude, longitude, numIndices=NUM_INDICES) {
	let pathIndex = 0
	const halfIndex = Math.floor(NUM_INDICES / 2)
	if (longitude < 0) {
		pathIndex = halfIndex + Math.round(Math.abs(latitude + 90) / 180 * halfIndex)
	} else {
		pathIndex = Math.round(Math.abs(latitude - 90) / 180 * halfIndex)
	}
	return pathIndex
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


function makeColors(primaryColor, numDarker=4, numLighter=4, pctDarker=0.64, pctLighter=0.64, asString=true) {
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
	if (asString) {
		const stringColorScale = []
		for (var i = 0; i < colorScale.length; i++) {
			const color = colorScale[i]
			const stringColor = `#${Math.round(color["r"]).toString(16)}${Math.round(color["g"]).toString(16)}${Math.round(color["b"]).toString(16)}`
			stringColorScale.push(stringColor)
		}
		return stringColorScale
	} else {
		return colorScale
	}
	
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

const ISO3_ISO2_MAPPING = {
  AFG: "AF",
  ALA: "AX",
  ALB: "AL",
  DZA: "DZ",
  ASM: "AS",
  AND: "AD",
  AGO: "AO",
  AIA: "AI",
  ATA: "AQ",
  ATG: "AG",
  ARG: "AR",
  ARM: "AM",
  ABW: "AW",
  AUS: "AU",
  AUT: "AT",
  AZE: "AZ",
  BHS: "BS",
  BHR: "BH",
  BGD: "BD",
  BRB: "BB",
  BLR: "BY",
  BEL: "BE",
  BLZ: "BZ",
  BEN: "BJ",
  BMU: "BM",
  BTN: "BT",
  BOL: "BO",
  BIH: "BA",
  BWA: "BW",
  BVT: "BV",
  BRA: "BR",
  VGB: "VG",
  IOT: "IO",
  BRN: "BN",
  BGR: "BG",
  BFA: "BF",
  BDI: "BI",
  KHM: "KH",
  CMR: "CM",
  CAN: "CA",
  CPV: "CV",
  CYM: "KY",
  CAF: "CF",
  TCD: "TD",
  CHL: "CL",
  CHN: "CN",
  HKG: "HK",
  MAC: "MO",
  CXR: "CX",
  CCK: "CC",
  COL: "CO",
  COM: "KM",
  COG: "CG",
  COD: "CD",
  COK: "CK",
  CRI: "CR",
  CIV: "CI",
  HRV: "HR",
  CUB: "CU",
  CYP: "CY",
  CZE: "CZ",
  DNK: "DK",
  DJI: "DJ",
  DMA: "DM",
  DOM: "DO",
  ECU: "EC",
  EGY: "EG",
  SLV: "SV",
  GNQ: "GQ",
  ERI: "ER",
  EST: "EE",
  ETH: "ET",
  FLK: "FK",
  FRO: "FO",
  FJI: "FJ",
  FIN: "FI",
  FRA: "FR",
  GUF: "GF",
  PYF: "PF",
  ATF: "TF",
  GAB: "GA",
  GMB: "GM",
  GEO: "GE",
  DEU: "DE",
  GHA: "GH",
  GIB: "GI",
  GRC: "GR",
  GRL: "GL",
  GRD: "GD",
  GLP: "GP",
  GUM: "GU",
  GTM: "GT",
  GGY: "GG",
  GIN: "GN",
  GNB: "GW",
  GUY: "GY",
  HTI: "HT",
  HMD: "HM",
  VAT: "VA",
  HND: "HN",
  HUN: "HU",
  ISL: "IS",
  IND: "IN",
  IDN: "ID",
  IRN: "IR",
  IRQ: "IQ",
  IRL: "IE",
  IMN: "IM",
  ISR: "IL",
  ITA: "IT",
  JAM: "JM",
  JPN: "JP",
  JEY: "JE",
  JOR: "JO",
  KAZ: "KZ",
  KEN: "KE",
  KIR: "KI",
  PRK: "KP",
  KOR: "KR",
  KWT: "KW",
  KGZ: "KG",
  LAO: "LA",
  LVA: "LV",
  LBN: "LB",
  LSO: "LS",
  LBR: "LR",
  LBY: "LY",
  LIE: "LI",
  LTU: "LT",
  LUX: "LU",
  MKD: "MK",
  MDG: "MG",
  MWI: "MW",
  MYS: "MY",
  MDV: "MV",
  MLI: "ML",
  MLT: "MT",
  MHL: "MH",
  MTQ: "MQ",
  MRT: "MR",
  MUS: "MU",
  MYT: "YT",
  MEX: "MX",
  FSM: "FM",
  MDA: "MD",
  MCO: "MC",
  MNG: "MN",
  MNE: "ME",
  MSR: "MS",
  MAR: "MA",
  MOZ: "MZ",
  MMR: "MM",
  NAM: "NA",
  NRU: "NR",
  NPL: "NP",
  NLD: "NL",
  ANT: "AN",
  NCL: "NC",
  NZL: "NZ",
  NIC: "NI",
  NER: "NE",
  NGA: "NG",
  NIU: "NU",
  NFK: "NF",
  MNP: "MP",
  NOR: "NO",
  OMN: "OM",
  PAK: "PK",
  PLW: "PW",
  PSE: "PS",
  PAN: "PA",
  PNG: "PG",
  PRY: "PY",
  PER: "PE",
  PHL: "PH",
  PCN: "PN",
  POL: "PL",
  PRT: "PT",
  PRI: "PR",
  QAT: "QA",
  REU: "RE",
  ROU: "RO",
  RUS: "RU",
  RWA: "RW",
  BLM: "BL",
  SHN: "SH",
  KNA: "KN",
  LCA: "LC",
  MAF: "MF",
  SPM: "PM",
  VCT: "VC",
  WSM: "WS",
  SMR: "SM",
  STP: "ST",
  SAU: "SA",
  SEN: "SN",
  SRB: "RS",
  SYC: "SC",
  SLE: "SL",
  SGP: "SG",
  SVK: "SK",
  SVN: "SI",
  SLB: "SB",
  SOM: "SO",
  ZAF: "ZA",
  SGS: "GS",
  SSD: "SS",
  ESP: "ES",
  LKA: "LK",
  SDN: "SD",
  SUR: "SR",
  SJM: "SJ",
  SWZ: "SZ",
  SWE: "SE",
  CHE: "CH",
  SYR: "SY",
  TWN: "TW",
  TJK: "TJ",
  TZA: "TZ",
  THA: "TH",
  TLS: "TL",
  TGO: "TG",
  TKL: "TK",
  TON: "TO",
  TTO: "TT",
  TUN: "TN",
  TUR: "TR",
  TKM: "TM",
  TCA: "TC",
  TUV: "TV",
  UGA: "UG",
  UKR: "UA",
  ARE: "AE",
  GBR: "GB",
  USA: "US",
  UMI: "UM",
  URY: "UY",
  UZB: "UZ",
  VUT: "VU",
  VEN: "VE",
  VNM: "VN",
  VIR: "VI",
  WLF: "WF",
  ESH: "EH",
  YEM: "YE",
  ZMB: "ZM",
  ZWE: "ZW",
  XKX: "XK"
}

function getCountryISO2FromCountryMetadata(countryMetadata) {
	let iso3 =  countryMetadata['territory']
	if (iso3 == null || parseInt(iso3).toString() === iso3) {
		iso3 =  countryMetadata['country']
	}
	const iso2 = getCountryISO2(iso3)
	return iso2
}

function getCountryISO2(iso3) {
	if (iso3 in ISO3_ISO2_MAPPING) {
		return ISO3_ISO2_MAPPING[iso3]
	} else {
		return null
	}
}


export default { init, resize };
