const express = require('express')
var path = require('path');

var fs = require('fs');
var d3 = require("d3");
// const URLFETCH = 'http://localhost:1000/fetch';


//define app
const app = express();


async function lineplot(){
	let population_select = $("#population_value").val()
	console.log(population_select)
	$("#linechart").empty()


	const selected_country =  $("#countries_value").val()
	let data = await d3.csv('/data_1.csv')
	let data2 = eulersmethod()
	const dateparse = d3.timeParse("%Y-%m-%d")
	const countryaccessor = d => d.Country
	const xaccessor = d => dateparse(d.Date)
	const xaccessor2 = d => d.date
	let yaccessor = d => +d.Cumulative_Cases
	let yaccessornew = d => +d.Difference
	let yaccessor2 = d=> +d.population_select
	let yaccessor3 = d=> +d.infected
	// let yaccessor2 = d => +d.Cumulative_Cases

	if (population_select == 'Infected'){
		yaccessor = d => +d.Cumulative_Cases
		yaccessor2 = d => +d.infected
	}
	if (population_select == 'Recovered'){
		yaccessor = d => +d.Recovered
		yaccessor2 = d => +d.Recovered
	}
	if (population_select == 'Deaths'){
		yaccessor = d => +d.Deaths
		yaccessor2 = d => +d.Deaths
	}



	let selected_data = []
	data.forEach(d=>{
		if (countryaccessor(d)===selected_country){
			selected_data.push(d)
		}
	})

	function eulersmethod(){
		let results = []
		let beta = parseFloat($("#beta").val())
		let sigma = parseFloat($("#sigma").val())
		let gamma = parseFloat($("#gamma").val())
		let epsilon = parseFloat($("#epsilon").val())
		let total_pop = parseInt($("#initial_total").val())
		let suscep_val = total_pop
		let infected_val = parseInt($("#initial_infected").val())
		let recovered_val = parseInt($("#initial_recovered").val())
		let death_val = parseInt($("#initial_death").val())
		let days = parseFloat($("#days").val())
		let exposed_val = parseFloat($("#initial_exposed").val())
		let cfr = parseFloat($("#cfr").val())
		let start_date = $("#datevalue").val()
		let dateparse = d3.timeParse("%Y-%m-%d")
		var start = 0;
		var death = 0;
		// var date = '2003-03-16'.split('-');
		var date = start_date.split('-');
		while (start<days){
			start+=1
			suscep_val = suscep_val - ((beta*suscep_val*infected_val)/total_pop +epsilon*recovered_val)
			infected_val = infected_val +(sigma*exposed_val-gamma*infected_val)
			exposed_val = exposed_val + ((beta*suscep_val*infected_val)/total_pop)-sigma*exposed_val
			recovered_val = recovered_val + gamma*infected_val - epsilon*recovered_val
			Cumulative_Cases = infected_val + exposed_val
			date[2] = Number(date[2])+1

			death = cfr*recovered_val
			recovered = recovered_val-death
			results.push({'day':start,'date': dateparse(date.join('-')),'susceptible':parseInt(suscep_val),'infected':parseInt(infected_val),'Cumulative_Cases':parseInt(Cumulative_Cases),'Recovered':parseInt(recovered),'Deaths':parseInt(death)})
		}
		// console.log(results)
		return(results)
	}
	eulersmethod()


	let index = selected_data.length
	let cumulative =0
	for(i=0;i<index;i++){
		entry = selected_data[i]
		if (i==0){
			current_val = yaccessor(entry)
			prev_val = current_val
			cumulative = current_val
			entry["Difference"]=cumulative
		}else{
			current_val = yaccessor(selected_data[i])
			prev_val = yaccessor(selected_data[i-1])
			diff_prev = yaccessornew(selected_data[i-1])

			gained = current_val-prev_val
			if (gained>0){
				if(current_val<diff_prev){
					if (current_val<prev_val){
						cumulative = current_val+diff_prev
					}else{cumulative=cumulative+current_val-prev_val}
				}else{cumulative = current_val}
			}else if(gained<0){
				cumulative = cumulative+current_val
			}else if(gained==0){
				cumulative = cumulative
			}
			entry["Difference"]=cumulative
	}
}
		console.log(selected_data)
		let index2 = data2.length
		let cumulative2 =0

		// let yaccessor = d => +d.Cumulative_Cases
		let yaccessor4 = d => +d.Deaths
		let yaccessor5 = d =>+d.Recovered
		if ($("#population_value").val()=='Infected'){
			yaccessor_new = yaccessor3
		}else if ($("#population_value").val()=='Deaths') {
			yaccessor_new=yaccessor4
		}else if ($("#population_value").val()=='Recovered') {
			yaccessor_new=yaccessor5
		}
		for(i=0;i<index2;i++){
			entry = data2[i]
			if (i==0){
				current_val = yaccessor_new(entry)
				prev_val = current_val
				cumulative2 = current_val
				entry["Difference"]=cumulative2
			}else{
				current_val = yaccessor_new(data2[i])
				prev_val = yaccessor_new(data2[i-1])
				if (current_val<prev_val){
					cumulative2=cumulative2
				}else if(current_val>prev_val){
					cumulative2=current_val
				}
				entry["Difference"]=cumulative2
			}
		}


		let cumu_cases = parseFloat(selected_data[selected_data.length-1].Cumulative_Cases)
		let death_count = parseFloat(selected_data[selected_data.length-1].Deaths)
		if (death_count==0){
			cfr=0
		}else{cfr = death_count/cumu_cases}
		$("#cfr_out").text(cfr);

		function mse(){
			let value = 0
			let pred = eulersmethod()
			let actual = selected_data
			let days = parseFloat($("#days").val())
			if ($("#population_value").val()=='Infected'){
				yaccessor_new = yaccessor3
			}else if ($("#population_value").val()=='Deaths') {
				yaccessor_new=yaccessor4
			}else if ($("#population_value").val()=='Recovered') {
				yaccessor_new=yaccessor5
			}
			for (i=0;i<days;i++){
				pred_val = yaccessor_new(pred[i])
				actual_val = yaccessornew(actual[i])
				mse = Math.pow((actual_val-pred_val),2)/days
				value +=mse
			}

			return(value)
		}
		let mse_out = mse()
		let rmse_out = Math.sqrt(mse_out)
		$("#mse").text(mse_out);
		$("#rmse").text(rmse_out);

	let newdata = selected_data
	let dimensions = {
		width: 1300,
		height:500,
		margin:{
			top:15,
			bottom:40,
			right:15,
			left:60,
		},
	}
	let all_data = newdata.concat(data2)


	dimensions.boundedwidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
	dimensions.boundedheight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

	const wrapper = d3.select("#linechart")
	const svg = wrapper.append('svg')
	svg.attr('width',dimensions.width)
	svg.attr('height',dimensions.height)

	const bounds = wrapper.append('g')
		.style('transform',`translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`)



	const yscale = d3.scaleLinear()
		.domain(d3.extent(all_data,yaccessornew))
		.range([dimensions.boundedheight,0])
		.nice()


	const xscale = d3.scaleTime()
		.domain(d3.extent(newdata,xaccessor))
		.range([0,dimensions.boundedwidth])
		// .nice()

//ADJUSTED
	const linegenerator = d3.line()
		.x(d=>xscale(xaccessor(d)))
		.y(d=>yscale(yaccessornew(d)))

	const line = bounds.append('path')
		.attr('d',linegenerator(newdata))
		.attr('fill','none')
		.attr('stroke','red')
		.attr('stroke-width',2)

//ADJUSTED
	const linegenerator2 = d3.line()
		.x(d=>xscale(xaccessor2(d)))
		.y(d=>yscale(yaccessornew(d)))


	const line2 = bounds.append('path')
		.attr('d',linegenerator2(data2))
		.attr('fill','none')
		.attr('stroke','orange')
		.attr('stroke-width',2)

	const yaxisgenerator = d3.axisLeft()
		.scale(yscale)


	const yaxis = bounds.append('g')
		.call(yaxisgenerator)
		.style('font-size','1.05em')


	const xaxisgenerator = d3.axisBottom()
		.scale(xscale)


	const xaxis = bounds.append('g')
		.call(xaxisgenerator)
		.style('transform',`translateY(${dimensions.boundedheight}px)`)
		.style('font-size','1.05em')


	const xaxislabel=xaxis.append('text')
		.attr('x',dimensions.boundedwidth/2)
		.attr('y',dimensions.margin.bottom+30)
		.attr('fill','black')
		.style('font-size','2em')
		.html("Dates")

	const yaxislabel = yaxis.append('text')
		.attr('x',-dimensions.boundedheight/2)
		.attr('y',-dimensions.margin.left)
		.attr('fill','black')
		.style('font-size','1.7em')
		.style('transform','rotate(-90deg)')
		.style('text-anchor','middle')
		.html("Cumulative Number of Cases")
	// console.log(newdata)
	$("#no_inf_val").text(newdata[0].Cumulative_Cases);
	$("#no_rec_val").text(newdata[0].Recovered);
	$("#no_deaths").text(newdata[0].Deaths);
	$("#no_days").text(newdata.length-5);
	$("#first_date").text(selected_data[0].Date);
}






async function animated() {
	const getRandomNumberInRange = (min, max) => Math.random() * (max - min) + min

	const getRandomValue = arr => arr[Math.floor(getRandomNumberInRange(0, arr.length))]

	const sentenceCase = str => [
		str.slice(0, 1).toUpperCase(),
		str.slice(1),
	].join("")
	// 1. Access data

	const dataset = await d3.json("./sars.json")

	const sexAccessor = d => d.sex
	const sexes = ["female", "male"]
	const sexIds = d3.range(sexes.length)

	const stateAccessor = d => d.state
	const stateNames = [
		"Susceptible","Exposed","Infected","Recovered","Death"
	]
	const stateIds = d3.range(stateNames.length)

	const ageAccessor = d => d.age
	const ageNames = ["young", "middle", "old"]
	const ageIds = d3.range(ageNames.length)

	const getStatusKey = ({sex, age}) => [sex, age].join("--")

	const stackedProbabilities = {}
	dataset.forEach(startingPoint => {
		const key = getStatusKey(startingPoint)
		let stackedProbability = 0
		stackedProbabilities[key] = stateNames.map((state, i) => {
			stackedProbability += (startingPoint[state] / 100)
			if (i == stateNames.length - 1) {
				// account for rounding error
				return 1
			} else {
				return stackedProbability
			}
		})
	})

	let currentPersonId = 0
	function generatePerson(elapsed) {
		currentPersonId++

		const sex = getRandomValue(sexIds)
		const age = getRandomValue(ageIds)
		const statusKey = getStatusKey({
			sex: sexes[sex],
			age: ageNames[age],
		})
		const probabilities = stackedProbabilities[statusKey]
		const state = d3.bisect(probabilities, Math.random())

		return {
			id: currentPersonId,
			sex,
			age,
			state,
			startTime: elapsed + getRandomNumberInRange(-0.1, 0.1),
			yJitter: getRandomNumberInRange(-20, 20),
		}
	}

	// 2. Create chart dimensions

	const width = d3.min([
		window.innerWidth * 0.9,
		2000
	])
	let dimensions = {
		width: width,
		height: 1000,
		margin: {
			top: 10,
			right: 200,
			bottom: 10,
			left: 120,
		},
		pathHeight: 50,
		endsBarWidth: 30,
		endingBarPadding: 10,
	}
	dimensions.boundedWidth = dimensions.width
		- dimensions.margin.left
		- dimensions.margin.right
	dimensions.boundedHeight = dimensions.height
		- dimensions.margin.top
		- dimensions.margin.bottom

	// 3. Draw canvas

	const wrapper = d3.select("#wrapper")
		.append("svg")
			.attr("width", dimensions.width)
			.attr("height", dimensions.height)

	const bounds = wrapper.append("g")
			.style("transform", `translate(${
				dimensions.margin.left
			}px, ${
				dimensions.margin.top
			}px)`)

	// 4. Create scales

	const xScale = d3.scaleLinear()
		.domain([0, 1])
		.range([0, dimensions.boundedWidth])
		.clamp(true)

	const startYScale = d3.scaleLinear()
		.domain([ageIds.length, -1])
		.range([0, dimensions.boundedHeight])

	const endYScale = d3.scaleLinear()
		.domain([stateIds.length, -1])
		.range([0, dimensions.boundedHeight])

	const yTransitionProgressScale = d3.scaleLinear()
		.domain([0.45, 0.55]) // x progress
		.range([0, 1])        // y progress
		.clamp(true)

	const colorScale = d3.scaleLinear()
		.domain(d3.extent(ageIds))
		.range(["#12CBC4", "#B53471"])
		.interpolate(d3.interpolateHcl)

	// 5. Draw data

	const linkLineGenerator = d3.line()
		.x((d, i) => i * (dimensions.boundedWidth / 5))
		.y((d, i) => i <= 2
			? startYScale(d[0])
			: endYScale(d[1])
		)
		.curve(d3.curveMonotoneX)
	const linkOptions = d3.merge(
		ageIds.map(startId => (
			stateIds.map(endId => (
				new Array(6).fill([startId, endId])
			))
		))
	)
	const linksGroup = bounds.append("g")
	const links = linksGroup.selectAll(".category-path")
		.data(linkOptions)
		.enter().append("path")
			.attr("class", "category-path")
			.attr("d", linkLineGenerator)
			.attr("stroke-width", dimensions.pathHeight)

	// 6. Draw peripherals

	const startingLabelsGroup = bounds.append("g")
			.style("transform", "translateX(-20px)")

	const startingLabels = startingLabelsGroup.selectAll(".start-label")
		.data(ageIds)
		.enter().append("text")
			.attr("class", "label start-label")
			.attr("y", (d, i) => startYScale(i))
			.text((d, i) => sentenceCase(ageNames[i]))
			.style('font-size','1.5em')

	const startLabel = startingLabelsGroup.append("text")
			.attr("class", "start-title")
			.attr("y", startYScale(ageIds[ageIds.length - 1]) - 90)
			.text("Age")
			.style('font-size','2em')
	const startLabelLineTwo = startingLabelsGroup.append("text")
			.attr("class", "start-title")
			.attr("y", startYScale(ageIds[ageIds.length - 1]) - 60)
			.text("Groups")
			.style('font-size','2em')

	const startingBars = startingLabelsGroup.selectAll(".start-bar")
		.data(ageIds)
		.enter().append("rect")
			.attr("x", 20)
			.attr("y", d => startYScale(d) - (dimensions.pathHeight/ 2))
			.attr("width", dimensions.endsBarWidth)
			.attr("height", dimensions.pathHeight)
			.attr("fill", colorScale)

	const endingLabelsGroup = bounds.append("g")
			.style("transform", `translateX(${
				dimensions.boundedWidth + 50
			}px)`)


	const endingLabels = endingLabelsGroup.selectAll(".end-label")
		.data(stateNames)
		.enter().append("text")
			.attr("class", "label end-label")
			.attr("y", (d, i) => endYScale(i) - 45)
			.text(d => d)
			.style('font-size',25)

	const maleMarkers = endingLabelsGroup.selectAll(".male-marker")
		.data(stateIds)
		.enter().append("circle")
			.attr("class", "ending-marker male-marker")
			.attr("r", 5.5)
			.attr("cx", 5)
			.attr("cy", d => endYScale(d) + 5)

	const trianglePoints = [
		"-7,  6",
		" 0, -6",
		" 7,  6",
	].join(" ")
	const femaleMarkers = endingLabelsGroup.selectAll(".female-marker")
		.data(stateIds)
		.enter().append("polygon")
			.attr("class", "ending-marker female-marker")
			.attr("points", trianglePoints)
			.attr("transform", d => `translate(5, ${endYScale(d) + 45})`)

	const legendGroup = bounds.append("g")
			.attr("class", "legend")
			.attr("transform", `translate(${dimensions.boundedWidth}, 100)`)

	const femaleLegend = legendGroup.append("g")
			.attr("transform", `translate(${
				- dimensions.endsBarWidth * 5
				+ dimensions.endingBarPadding/2
				+ 1
			}, 0)`)
	femaleLegend.append("polygon")
			.attr("points", trianglePoints)
			.attr("transform", "translate(-7, 0)")
	femaleLegend.append("text")
			.attr("class", "legend-text-left")
			.text("Female")
			.attr("x", -20)
			.style('font-size',30)
	femaleLegend.append("line")
			.attr("class", "legend-line")
			.attr("x1", -dimensions.endsBarWidth / 2 + 1)
			.attr("x2", -dimensions.endsBarWidth / 2 + 1)
			.attr("y1", 12)
			.attr("y2", 37)

	const maleLegend = legendGroup.append("g")
			.attr("transform", `translate(${
				- dimensions.endsBarWidth *3
				- 4
			}, 0)`)
	maleLegend.append("circle")
			.attr("r", 5.5)
			.attr("transform", "translate(5, 0)")
	maleLegend.append("text")
			.attr("class", "legend-text-right")
			.text("Male")
			.style('font-size',30)
			.attr("x", 15)
	maleLegend.append("line")
			.attr("class", "legend-line")
			.attr("x1", dimensions.endsBarWidth / 2 - 3)
			.attr("x2", dimensions.endsBarWidth / 2 - 3)
			.attr("y1", 12)
			.attr("y2", 37)

	// 7. Set up interactions

	const maximumPeople = 10000
	let people = []
	const markersGroup = bounds.append("g")
			.attr("class", "markers-group")
	const endingBarGroup = bounds.append("g")
			.attr("transform", `translate(${dimensions.boundedWidth}, 0)`)

	function updateMarkers(elapsed) {
		const xProgressAccessor = d => (elapsed - d.startTime) / 5000
		if (people.length < maximumPeople) {
			people = [
				...people,
				...d3.range(2).map(() => generatePerson(elapsed)),
			]
		}

		const females = markersGroup.selectAll(".marker-circle")
			.data(people.filter(d => (
				xProgressAccessor(d) < 1
				&& sexAccessor(d) == 0
			)), d => d.id)
			females.enter().append("circle")
				.attr("class", "marker marker-circle")
				.attr("r", 5.5)
				.style("opacity", 0)
			females.exit().remove()

		const males = markersGroup.selectAll(".marker-triangle")
			.data(people.filter(d => (
				xProgressAccessor(d) < 1
				&& sexAccessor(d) == 1
			)), d => d.id)
			males.enter().append("polygon")
				.attr("class", "marker marker-triangle")
				.attr("points", trianglePoints)
				.style("opacity", 0)
			males.exit().remove()

		const markers = d3.selectAll(".marker")

		markers.style("transform", d => {
					const x = xScale(xProgressAccessor(d))
					const yStart = startYScale(ageAccessor(d))
					const yEnd = endYScale(stateAccessor(d))
					const yChange = yEnd - yStart
					const yProgress = yTransitionProgressScale(
						xProgressAccessor(d)
					)
					const y =  yStart
						+ (yChange * yProgress)
						+ d.yJitter
					return `translate(${ x }px, ${ y }px)`
				})
				.attr("fill", d => colorScale(ageAccessor(d)))
			.transition().duration(100)
				.style("opacity", d => xScale(xProgressAccessor(d)) < 10
					? 0
					: 1
				)

		const endingGroups = stateIds.map(endId => (
			people.filter(d => (
				xProgressAccessor(d) >= 1
				&& stateAccessor(d) == endId
			))
		))
		const endingPercentages = d3.merge(
			endingGroups.map((peopleWithSameEnding, endingId) => (
				d3.merge(
					sexIds.map(sexId => (
						ageIds.map(ageId => {
							const peopleInBar = peopleWithSameEnding.filter(d => (
								sexAccessor(d) == sexId
							))
							const countInBar = peopleInBar.length
							const peopleInBarWithSameStart = peopleInBar.filter(d => (
								ageAccessor(d) == ageId
							))
							const count = peopleInBarWithSameStart.length
							const numberOfPeopleAbove = peopleInBar.filter(d => (
								ageAccessor(d) > ageId
							)).length

							return {
								endingId,
								ageId,
								sexId,
								count,
								countInBar,
								percentAbove: numberOfPeopleAbove / (peopleInBar.length || 1),
								percent: count / (countInBar || 1),
							}
						})
					))
				)
			))
		)

		endingBarGroup.selectAll(".ending-bar")
			.data(endingPercentages)
			.join("rect")
				.attr("class", "ending-bar")
				.attr("x", d => -dimensions.endsBarWidth * (d.sexId + 1)
					- (d.sexId * dimensions.endingBarPadding)
				)
				.attr("width", dimensions.endsBarWidth)
				.attr("y", d => endYScale(d.endingId)
					- dimensions.pathHeight / 2
					+ dimensions.pathHeight * d.percentAbove
				)
				.attr("height", d => d.countInBar
					? dimensions.pathHeight * d.percent
					: dimensions.pathHeight
				)
				.attr("fill", d => d.countInBar
					? colorScale(d.ageId)
					: "#dadadd"
				)

		endingLabelsGroup.selectAll(".ending-value")
			.data(endingPercentages)
			.join("text")
				.attr("class", "ending-value")
				.attr("x", d => (d.ageId) * 70
					+ 70
				)
				.attr("y", d => endYScale(d.endingId)
					- dimensions.pathHeight / 2
					+ 14 * d.sexId*3
					+ 35
				)
				.attr("fill", d => d.countInBar
					? colorScale(d.ageId)
					: "#dadadd"
				)
				.text(d => d.count)
				.style("font-size",20)
	}
	d3.timer(updateMarkers)
}





app.use('/', express.static(__dirname + '/'));

// set server to port 8000 and listen
app.listen(1000, () => {
  console.log('Example app listening on port 1000!')
});
