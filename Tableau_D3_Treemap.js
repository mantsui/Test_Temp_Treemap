// Initialize the viz variable 
var vizMedicareOPChrg;

/* ------------------------------ Part 1: Tableau Section [Start] ------------------------------ */
window.onload= function() {
// When the webpage has loaded, load the viz

	// Declare sheet name for the sheet to pass data to D3.
	var Tableau_Sheet_Name = "D3 Support OP Detail";
	// Explicitly define ordered dimensions to D3 hierarchical data conversion.
	var Ordered_Dimension_List_to_D3 = ["Provider State", "Zip Code Desc", "Provider_Name"];
	// Define particular Measure from Tableau to go into D3.
	var Measure_Name = "SUM(OP_Measure_Swap)";
	var Display_Measure_Name = "Outpatient Services";
	
	var placeholder = document.getElementById('myMedicareOPViz');
	var vizURL = 'https://public.tableau.com/views/MedicareChargeProject_0/OPChargeDashboardD3Pair';
	var options = {
		width: '750px',
		height: '680px',
		hideToolbar: true,
		hideTabs: true,
	
		onFirstInteractive: function () {
			// Function call to get tableau data after Tableau visualization is complete.
			Pass_Tableau_Data_to_D3(vizMedicareOPChrg, Tableau_Sheet_Name, Ordered_Dimension_List_to_D3, 
						Measure_Name, Display_Measure_Name, 
						Draw_D3_Treemap);
			
		}		
	};

	vizMedicareOPChrg = new tableau.Viz(placeholder, vizURL, options);

	// Listen for parameter change/selection for "OP Charge Dashboard D3 Pair"
	vizMedicareOPChrg.addEventListener('parametervaluechange', function(parameterEvent) {
		//console.log('Parameter Event Listener Activated.'); //Debug code
		
		parameterEvent.getParameterAsync().then( function(obj_Parameter){
			var para_CurrentValue = obj_Parameter.getCurrentValue().formattedValue;
			
			console.log("Current Parameter Value: " + para_CurrentValue);
			console.log(para_CurrentValue);
			resetTextFilterTo(vizMedicareOPChrg, "OP Map D3", "Provider State");//Test
			resetTextFilterTo(vizMedicareOPChrg, "OP Map D3", "Zip Code Desc");//Test
			
			switch(para_CurrentValue){
				case "Total Outpatient Services": 
					Display_Measure_Name =  "Outpatient Services"
				break;

				case "Total OP Charges": 
					Display_Measure_Name =  "Outpatient Charges"
				break;

				case "Total OP Payments": 
					Display_Measure_Name =  "Outpatient Payments"
				break;				
				
				default:
					Display_Measure_Name = "Error: Review Tableau Parameter";
			}
			
			// Function call to get tableau data, transform and load to D3 chart generation after parameter change event.
			Pass_Tableau_Data_to_D3(vizMedicareOPChrg, Tableau_Sheet_Name, Ordered_Dimension_List_to_D3, 
						Measure_Name, Display_Measure_Name, 
						Draw_D3_Treemap);
		});		
	});	


	// Listen for filter change/selection for "OP Charge Dashboard D3 Pair"
	vizMedicareOPChrg.addEventListener('filterchange', function(filterEvent) {

		filterEvent.getFilterAsync().then( function(filterChangeField){
			if (filterChangeField.getFieldName() === "Calendar Year" || filterChangeField.getFieldName() === "APC") {

				// Function call to get tableau data, transform and load to D3 chart generation 
				// after filter change to "Calendar Year" or "APC".
				Pass_Tableau_Data_to_D3(vizMedicareOPChrg, Tableau_Sheet_Name, Ordered_Dimension_List_to_D3, 
							Measure_Name, Display_Measure_Name,
							Draw_D3_Treemap);
			}			
		});
	});
	
};

/* ------------------------------- Part 1: Tableau Section [End] ------------------------------- */


/* --------------- Part 2: Convert Tableau Data to D3 Hierarchical Data [Start] --------------- */

// Import data from target dashboard-worksheet using Tableau Javascript API
// and converting the data into a format for D3 input.
let Pass_Tableau_Data_to_D3 = function(vizName, sheetName, arrayDimensionNames, strMeasureName, strDisplayName, callback){
	
	var sheet = vizName.getWorkbook().getActiveSheet().getWorksheets().get(sheetName);
	
	var Array_of_Columns;
	var Tableau_Array_of_Array;
	var TableauTreeData;
			
	options = {
		maxRows: 0, // Max rows to return. Use 0 to return all rows
		ignoreAliases: false,
		ignoreSelection: true,
		includeAllColumns: false
	};

	// Get and reformat tableau data for D3 processing 
	sheet.getSummaryDataAsync(options).then(function(TableauData){
			Array_of_Columns = TableauData.getColumns();
			Tableau_Array_of_Array = TableauData.getData();
			console.log('TableauData.getColumns(), Array_of_Columns ', Array_of_Columns);  //Debug output
			console.log('TableauData.getData() Tableau_Array_of_Array ', Tableau_Array_of_Array);  //Debug output
			
			/*Convert Tableau data into Array of Objects for D3 processing. */
			var Tableau_Array_of_Objects = ReduceToObjectTablulated(Array_of_Columns, Tableau_Array_of_Array);
			//console.log('***** Display Tableau Array_Of_Objects *****');	// Debug output
			//console.log(Tableau_Array_of_Objects);												// Debug output

			renameObjInArray(Tableau_Array_of_Objects, "Provider_Name", "key");
			renameObjInArray(Tableau_Array_of_Objects, "SUM(OP_Measure_Swap)", "value");
			
			stringToNumericObjInArray(Tableau_Array_of_Objects);
			
			console.log('Tableau_Array_of_Objects ', Tableau_Array_of_Objects);	// Debug output

			var Tableau_data = d3.nest().key(function(d) { return d["Provider State"]; }).key(function(d) { return d["Zip Code Desc"]; }).entries(Tableau_Array_of_Objects);
			console.log('Tableau_data ', Tableau_data);	// Debug output
			
			// Verify callback object type is a function to call the draw D3 chart
			/*if(typeof callback === "function"){
				// Javascript callback function to dynamically draw D3 chart
				callback({title: "Medicare Outpatient Services"}, {key: strDisplayName, values: Tableau_data});
			}*/			
	});
	
};


// Tableau .getData() returns an array (rows) of arrays (columns) of objects, 
// which have a formattedValue property.
// Convert and flatten "Array of Arrays" to "Array of objects" in 
// field:values convention for easier data format for D3.
function ReduceToObjectTablulated(cols, data){
	
	var Array_Of_Objects = [];
	
	for (var RowIndex = 0; RowIndex < data.length; RowIndex++) {
		var SingleObject = new Object();
		
		for (var FieldIndex = 0; FieldIndex < Object.keys(data[RowIndex]).length; FieldIndex++) {
			var FieldName = cols[FieldIndex].getFieldName();
			
			SingleObject[FieldName] = data[RowIndex][FieldIndex].formattedValue;

		} // Looping through the object number of properties (aka: Fields) in object
		
		Array_Of_Objects.push(SingleObject);	// Dynamically append object to the array

		//console.log('*****************');	// Debug output
		//console.log(SingleObject);		// Debug output
		//console.log(Array_Of_Objects);	// Debug output
		
	} //Looping through data array of objects.
	
	//console.log('***** Display Array_Of_Objects *****');	// Debug output
	//console.log(Array_Of_Objects);												// Debug output	
	return Array_Of_Objects;
}


// Convert tablulated data into hierarchical data for most advanced D3 charts
// Not all D3 charts requires hierarchical data as input (ie: simple D3 line chart, simple D3 bar chart)
function Convert_To_TreeData(FlatData, arrayDimensionNames, strValueName, strDisplayValue){
	
	// Clone a local array of Dimension Names so the array argument is pass by value and not by pass reference
	var localArrayDimensionNames = arrayDimensionNames.slice();
	
	var TreeData = { name : strDisplayValue, children : [] };
	var final_Child_Level = localArrayDimensionNames.pop();
	var non_Final_Children_Levels = localArrayDimensionNames;

	// Convert tabulated data to tree data.
	// For each data row, loop through the expected levels traversing the output tree
	FlatData.forEach(function(d){
		// Keep this as a reference to the current level
		var depthCursor = TreeData.children;
		// Go down one level at a time
		non_Final_Children_Levels.forEach(function( property, depth ){

			// Look to see if a branch has already been created
			var index;
			depthCursor.forEach(function(child,i){
				if ( d[property] == child.name ) index = i;
			});
			// Add a branch if it isn't there
			if ( isNaN(index) ) {
				depthCursor.push({ name : d[property], children : []});
				index = depthCursor.length - 1;
			}
			// Now reference the new child array as we go deeper into the tree
			depthCursor = depthCursor[index].children;
			// This is a leaf, so add the last element to the specified branch

			//Remove all commas in a text string
			var TempString = d[strValueName].replace(/,/g,"");
			Target_Key = Math.round(+TempString); //Convert String to Numeric
			
			if ( depth === non_Final_Children_Levels.length - 1 ) {
				depthCursor.push({ name : d[final_Child_Level], size : Target_Key });
			}
		});
	});
	
	return TreeData;
}

/* ---------------- Part 2: Convert Tableau Data to D3 Hierarchical Data [End] ---------------- */


/* Part 3: Supporting Tableau Javascript Functions for Filter, Mark, Parameter Updates Section [Start] */

// Set Tableau workbook parameter to the specified value(s)
function setParameterTo(vizName, parameterName, value) {
  var mainWorkbook = vizName.getWorkbook();
  mainWorkbook.changeParameterValueAsync(parameterName, value); 
}

// Highlight the specified dimension (mark) to the specified value(single)
function setSingleMarkTo(vizName, sheetName, markName, singleValue) {
	var sheet = vizName.getWorkbook().getActiveSheet().getWorksheets().get(sheetName);
    sheet.selectMarksAsync(markName, singleValue, tableau.SelectionUpdateType.REPLACE); 
}

// Filter the specified dimension to the specified value(s)
function setFilterTo(vizName, sheetName, filterName, values) {
	var sheet = vizName.getWorkbook().getActiveSheet().getWorksheets().get(sheetName);
    sheet.applyFilterAsync(filterName, values, tableau.FilterUpdateType.REPLACE); 
}

function resetTextFilterTo(vizName, sheetName, filterName) {
	var sheet = vizName.getWorkbook().getActiveSheet().getWorksheets().get(sheetName);
    sheet.applyFilterAsync(filterName, "", tableau.FilterUpdateType.ALL); 
}

/* Part 3: Supporting Tableau Javascript Functions for Filter, Mark, Parameter Updates Section [End] */


/* ------------- Part 4: D3 Zoomable Treemap (OP Medicare Charge) Section [Start] ------------- */

var defaults = {
		margin: {top: 24, right: 0, bottom: 0, left: 0},
		rootname: "TOP",
		format: ",d",
		title: "",
		width: 600,
		height: 700
};

function Draw_D3_Treemap(o, data) {
	var root,
			opts = $.extend(true, {}, defaults, o),
			formatNumber = d3.format(opts.format),
			rname = opts.rootname,
			margin = opts.margin,
			theight = 36 + 16;
			
	var D3_Measure_Name = data.key;
			
	console.log("+++++ opts +++++");//Test
	console.log(opts);//Test	
	console.log("D3_Measure_Name: " + D3_Measure_Name);//Test
	//console.log(data.key);//Test
	
	$('#D3_Treemap').width(opts.width).height(opts.height);
	var width = opts.width - margin.left - margin.right,
			height = opts.height - margin.top - margin.bottom - theight,
			transitioning;
	
	var color = d3.scale.category20c();
	
	var x = d3.scale.linear()
			.domain([0, width])
			.range([0, width]);
	
	var y = d3.scale.linear()
			.domain([0, height])
			.range([0, height]);
	
	var treemap = d3.layout.treemap()
			.children(function(d, depth) { return depth ? null : d._children; })
			.sort(function(a, b) { return a.value - b.value; })
			.ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
			.round(false);

  //Remove and create svg for chart refreshing
  d3.select("svg").remove();
			
	var svg = d3.select("#D3_Treemap").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.bottom + margin.top)
			.style("margin-left", -margin.left + "px")
			.style("margin.right", -margin.right + "px")
		.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.style("shape-rendering", "crispEdges");
	
	var grandparent = svg.append("g")
			.attr("class", "grandparent");
	
	grandparent.append("rect")
			.attr("y", -margin.top)
			.attr("width", width)
			.attr("height", margin.top);
	
	grandparent.append("text")
			.attr("x", 6)
			.attr("y", 6 - margin.top)
			.attr("dy", ".75em");

	//if (opts.title) {	//Test
		//$("#D3_Treemap").prepend("<p class='title'>" + opts.title + "</p>");
	//}
	if (data instanceof Array) {
		root = { key: rname, values: data };
	} else {
		root = data;
	}
		
	initialize(root);
	accumulate(root);
	layout(root);
	
	console.log("********** Root Output **********");	// Debug output
	console.log(root);
	console.log("");	// Debug output
	
	display(root);

	if (window.parent !== window) {
		var myheight = document.documentElement.scrollHeight || document.body.scrollHeight;
		window.parent.postMessage({height: myheight}, '*');
	}

	function initialize(root) {
		root.x = root.y = 0;
		root.dx = width;
		root.dy = height;
		root.depth = 0;
	}

	// Aggregate the values for internal nodes. This is normally done by the
	// treemap layout, but not here because of our custom implementation.
	// We also take a snapshot of the original children (_children) to avoid
	// the children being overwritten when when layout is computed.
	function accumulate(d) {
		return (d._children = d.values)
				? d.value = d.values.reduce(function(p, v) { return p + accumulate(v); }, 0)
				: d.value;
	}

	// Compute the treemap layout recursively such that each group of siblings
	// uses the same size (1×1) rather than the dimensions of the parent cell.
	// This optimizes the layout for the current zoom state. Note that a wrapper
	// object is created for the parent node for each group of siblings so that
	// the parent’s dimensions are not discarded as we recurse. Since each group
	// of sibling was laid out in 1×1, we must rescale to fit using absolute
	// coordinates. This lets us use a viewport to zoom.
	function layout(d) {
		if (d._children) {
			treemap.nodes({_children: d._children});
			d._children.forEach(function(c) {
				c.x = d.x + c.x * d.dx;
				c.y = d.y + c.y * d.dy;
				c.dx *= d.dx;
				c.dy *= d.dy;
				c.parent = d;
				layout(c);
			});
		}
	}

	function display(d) {
		grandparent
				.datum(d.parent)
				.on("click", transition)
			.select("text")
				.text(name(d));

		var g1 = svg.insert("g", ".grandparent")
				.datum(d)
				.attr("class", "depth");

		var g = g1.selectAll("g")
				.data(d._children)
			.enter().append("g");

		g.filter(function(d) { return d._children; })
				.classed("children", true)
				.on("click", transition);

		var children = g.selectAll(".child")
				.data(function(d) { return d._children || [d]; })
			.enter().append("g");

		children.append("rect")
				.attr("class", "child")
				.call(rect)
				.append("title")
				//Tooltip Text
				.text(function(d) { 
				
					var PrefixString = "";

					switch(D3_Measure_Name){
						case "Outpatient Services": 
							PrefixString =  "Outpatient Services: "
						break;

						case "Outpatient Charges": 
							PrefixString =  "Charges $"
						break;

						case "Outpatient Payments": 
							PrefixString =  "Payments $"
						break;				
						
						default:
							PrefixString = "Error: No display name assigned";
					}				

					return d.key + "\n" + PrefixString + numberWithCommas( Math.round(d.value) );
				});
		children.append("text")
				.attr("class", "ctext")
				.text(function(d) { return d.key; })
				.call(text2);

		g.append("rect")
				.attr("class", "parent")
				.call(rect);

		var t = g.append("text")
				.attr("class", "ptext")
				.attr("dy", ".75em")

		t.append("tspan")
				.text(function(d) { return d.key; });
		t.append("tspan")
				.attr("dy", "1.0em")
				// Summary Tooltip Text
				.text(function(d) {

					var PrefixString = "";

					switch(D3_Measure_Name){
						case "Outpatient Services": 
							PrefixString =  "Services: "
						break;

						case "Outpatient Charges": 
							PrefixString =  "Charges $"
						break;

						case "Outpatient Payments": 
							PrefixString =  "Payments $"
						break;				
						
						default:
							PrefixString = "Error: No display name assigned";
					}
					

					return PrefixString + numberWithCommas( Math.round(d.value) );
				});
				
		t.call(text);

		g.selectAll("rect")
				.style("fill", function(d) { return color(d.key); });

				
		// Transition function for click event
		function transition(d) {
			if (transitioning || !d) return;
			transitioning = true;

			var g2 = display(d),
					t1 = g1.transition().duration(750),
					t2 = g2.transition().duration(750);

			// Update the domain only after entering new elements.
			x.domain([d.x, d.x + d.dx]);
			y.domain([d.y, d.y + d.dy]);

			// Enable anti-aliasing during the transition.
			svg.style("shape-rendering", null);

			// Draw child nodes on top of parent nodes.
			svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

			// Fade-in entering text.
			g2.selectAll("text").style("fill-opacity", 0);

			// Transition to the new view.
			t1.selectAll(".ptext").call(text).style("fill-opacity", 0);
			t1.selectAll(".ctext").call(text2).style("fill-opacity", 0);
			t2.selectAll(".ptext").call(text).style("fill-opacity", 1);
			t2.selectAll(".ctext").call(text2).style("fill-opacity", 1);
			t1.selectAll("rect").call(rect);
			t2.selectAll("rect").call(rect);

			// Remove the old node when the transition is finished.
			t1.remove().each("end", function() {
				svg.style("shape-rendering", "crispEdges");
				transitioning = false;
			});
			
			
			try {
				switch(d["parent"]["key"]){
					case "Outpatient Services": 
						// This is D3 zoom to "Provider State" level.
						setFilterTo(vizMedicareOPChrg, "OP Map D3", "Provider State", d["key"]);
						resetTextFilterTo(vizMedicareOPChrg, "OP Map D3", "Zip Code Desc");
					break;

					case "Outpatient Charges": 
						// This is D3 zoom to "Provider State" level.
						setFilterTo(vizMedicareOPChrg, "OP Map D3", "Provider State", d["key"]);
						resetTextFilterTo(vizMedicareOPChrg, "OP Map D3", "Zip Code Desc");
					break;

					case "Outpatient Payments": 
						// This is D3 zoom to "Provider State" level.
						setFilterTo(vizMedicareOPChrg, "OP Map D3", "Provider State", d["key"]);
						resetTextFilterTo(vizMedicareOPChrg, "OP Map D3", "Zip Code Desc");
					break;
					
					default:
						// This is D3 zoom to "Zip Desc" level.
						setFilterTo(vizMedicareOPChrg, "OP Map D3", "Zip Code Desc", d["key"]);
				}				
				
			}
			catch(err){
				// This is D3 zoom to highest level, national level.
				resetTextFilterTo(vizMedicareOPChrg, "OP Map D3", "Zip Code Desc");
				resetTextFilterTo(vizMedicareOPChrg, "OP Map D3", "Provider State");
			}
		}

		return g;
	}

	function text(text) {
		text.selectAll("tspan")
				.attr("x", function(d) { return x(d.x) + 6; })
		text.attr("x", function(d) { return x(d.x) + 6; })
				.attr("y", function(d) { return y(d.y) + 6; })
				.style("opacity", function(d) { return this.getComputedTextLength() < x(d.x + d.dx) - x(d.x) ? 1 : 0; });
	}

	function text2(text) {
		text.attr("x", function(d) { return x(d.x + d.dx) - this.getComputedTextLength() - 6; })
				.attr("y", function(d) { return y(d.y + d.dy) - 6; })
				.style("opacity", function(d) { return this.getComputedTextLength() < x(d.x + d.dx) - x(d.x) ? 1 : 0; });
	}

	function rect(rect) {
		rect.attr("x", function(d) { return x(d.x); })
				.attr("y", function(d) { return y(d.y); })
				.attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
				.attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
	}

	// D3 Zoomable Treemap Header Title Bar
	function name(d) {
		var PrefixString = "";

		switch(D3_Measure_Name){
			case "Outpatient Services": 
				PrefixString =  "Services: "
			break;

			case "Outpatient Charges": 
				PrefixString =  "Charges $"
			break;

			case "Outpatient Payments": 
				PrefixString =  "Payments $"
			break;				
			
			default:
				PrefixString = "Error: No display name assigned";
		}
		

		return d.parent
				? name(d.parent) + " / " + d.key + " (" + PrefixString + numberWithCommas( Math.round(d.value) ) + ")"
				: d.key + " (" + PrefixString + numberWithCommas( Math.round(d.value) ) + ")";
				
	}
}


// Apply filter update to Tableau Medicare Inpatient Charge Dashboard.
function Apply_Filter_Tableau_Medicare_Outpatient_Charge(d){

	// Run Tableau Javascript API function to update filter to Tableau worksheet.
	switch(d.depth){
		case 0:
			resetTextFilterTo(vizMedicareOPChrg, "OP Map D3", "Provider State");
		break;
		
		case 1: 
			setFilterTo(vizMedicareOPChrg, "OP Map D3", "Provider State", d.data.name);
			
			// Reset Tableau filter for "Zip Code Desc"
			resetTextFilterTo(vizMedicareOPChrg, "OP Map D3", "Zip Code Desc");
		break;
	
		case 2:
			setFilterTo(vizMedicareIPChrg, "OP Map D3", "Zip Code Desc", d.data.name);
		break;
		
	}
}


// Supporting functions
function renameKeys(obj, newKeys) {
	const keyValues = Object.keys(obj).map(key => {
		const newKey = newKeys[key] || key;
		return { [newKey]: obj[key] };
	});
	return Object.assign({}, ...keyValues);
}

function renameObjInArray(arr, OldName, NewName) {

	for(var i=0; i<arr.length; i++) {

		arr[i] = renameKeys(arr[i], { [OldName]: NewName });
	}
}

function stringToNumericObjInArray(arr) {
	for(var i=0; i<arr.length; i++) {
		arr[i] = convertObjValue(arr[i]);
	}
}

function convertObjValue(obj) {
	var newValue = parseFloat( (obj.value.replace(/,/g,"")) );
	obj.value = newValue;
	
	return obj;
}

function numberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


/* -------------- Part 4: D3 Zoomable Treemap (OP Medicare Charge) Section [End] -------------- */
