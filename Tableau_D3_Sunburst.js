// Initialize the viz variable 
var vizMedicareIPChrg;

/* ------------------------------ Part 1: Tableau Section [Start] ------------------------------ */
window.onload= function() {
// When the webpage has loaded, load the viz

	// Declare sheet name for the sheet to pass data to D3.
	var Tableau_Sheet_Name = "D3 Support IP Detail";
	// Explicitly define ordered dimensions to D3 hierarchical data conversion.
	var Ordered_Dimension_List_to_D3 = ["Provider State", "Zip Code Desc", "Provider Name"];
	// Define particular Measure from Tableau to go into D3.
	var Measure_Name = "SUM(IP_Measure_Swap)";
	var Display_Measure_Name = "Discharges";
	
	var placeholder = document.getElementById('myMedicareIPViz');
	var vizURL = 'https://public.tableau.com/views/MedicareChargeProject_0/IPChargeDashboardD3Pair';
	var options = {
		width: '1200px',	//Original '1050px'
		height: '720px',	//Original '1000px'
		hideToolbar: true,
		hideTabs: true,
	
		onFirstInteractive: function () {
			// Function call to get tableau data after Tableau visualization is complete.
			Pass_Tableau_Data_to_D3(vizMedicareIPChrg, Tableau_Sheet_Name, Ordered_Dimension_List_to_D3, 
						Measure_Name, Display_Measure_Name, Draw_D3_Sunburst);
			
		}		
	};

	vizMedicareIPChrg = new tableau.Viz(placeholder, vizURL, options);

	// Listen for parameter change/selection for "IP Charge Dashboard D3 Pair"
	vizMedicareIPChrg.addEventListener('parametervaluechange', function(parameterEvent) {
		//console.log('Parameter Event Listener Activated.'); //Debug code
		
		parameterEvent.getParameterAsync().then( function(obj_Parameter){
			var para_CurrentValue = obj_Parameter.getCurrentValue().formattedValue;
			
			console.log("Current Parameter Value: " + para_CurrentValue);
			console.log(para_CurrentValue);
			
			switch(para_CurrentValue){
				case "Total Discharges": 
					Display_Measure_Name =  "Discharges"
				break;

				case "Total IP Covered Charges": 
					Display_Measure_Name =  "Inpatient Covered Charges"
				break;

				case "Total IP Payments": 
					Display_Measure_Name =  "Inpatient Payments"
				break;				

				case "Total IP Medicare Payments": 
					Display_Measure_Name =  "Inpatient Medicare Payments"
				break;
				
				default:
					Display_Measure_Name = "Error: Review Tableau Parameter";
			}
			
			// Function call to get tableau data, transform and load to D3 chart generation after parameter change event.
			Pass_Tableau_Data_to_D3(vizMedicareIPChrg, Tableau_Sheet_Name, Ordered_Dimension_List_to_D3, 
						Measure_Name, Display_Measure_Name, Draw_D3_Sunburst);
															
		});		
	});
	

	// Listen for filter change/selection for "IP Charge Dashboard D3 Pair"
	vizMedicareIPChrg.addEventListener('filterchange', function(filterEvent) {

		filterEvent.getFilterAsync().then( function(filterChangeField){
			if (filterChangeField.getFieldName() === "Fiscal Year" || filterChangeField.getFieldName() === "DRG Definition") {

				// Function call to get tableau data, transform and load to D3 chart generation 
				// after filter change to "Fiscal Year" or "DRG Definition".
				Pass_Tableau_Data_to_D3(vizMedicareIPChrg, Tableau_Sheet_Name, Ordered_Dimension_List_to_D3, 
							Measure_Name, Display_Measure_Name, Draw_D3_Sunburst);
			}			
		});
	});
	
};

/* ------------------------------- Part 1: Tableau Section [End] ------------------------------- */


/* --------------- Part 2: Convert Tableau Data to D3 Hierarchical Data [Start] --------------- */

// Import data from target dashboard-worksheet using Tableau Javascript API
// and converting the data into a format for D3 input.
//
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
			//console.log('***** Debug output getData() *****');	// Debug output
			//console.log(Tableau_Array_of_Array);			// Debug output
			//console.log('***** Debug output getColumns() *****');	// Debug output
			//console.log(Array_of_Columns);												// Debug output
			
			/*Convert Tableau data into Array of Objects for D3 processing. */
			var Tableau_Array_of_Objects = ReduceToObjectTablulated(Array_of_Columns, Tableau_Array_of_Array);
			console.log('***** Display Tableau Array_Of_Objects *****');	// Debug output
			console.log(Tableau_Array_of_Objects);												// Debug output

			TableauTreeData = Convert_To_TreeData(Tableau_Array_of_Objects, arrayDimensionNames, strMeasureName, strDisplayName);
						
			//console.log('***** Display Tree Data *****');	// Debug output
			//console.log(TableauTreeData);			// Debug output

			//Verify callback object type is a function to call the draw D3 chart
			if(typeof callback === "function"){
				
				//Javascript callback function to dynamically draw D3 chart
				callback(TableauTreeData, strDisplayName);
			}
			
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


/* ------------------- Part 4: D3 Tree Layout (IP Medicare Charge) Section [Start] ------------------- */

let Draw_D3_Sunburst = function(nodeData, strDisplayName){
	
  // Define the dimensions of the visualization.
  var width = 660,		//480
      height = 660,		//480
      radius = (Math.min(width, height) / 2);

  /* Define the scales that will translate data values into visualization 
		 properties. The "x" scale will represent angular position within the
		 visualization, so it ranges linearly from 0 to 2π. The "y" scale will 
		 represent area, so it ranges from 0 to the full radius of the
		 visualization. Since area varies as the square of the radius, 
		 this scale takes the square root of the input domain before mapping to
		 the output range.  */
  var x = d3.scaleLinear()
			.range([0, 2 * Math.PI]);

  var y = d3.scaleSqrt()
      .range([0, radius]);

  var color = d3.scaleOrdinal(d3.schemeSet3);
  //var color = d3.scaleOrdinal()
  //  .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
  //var sequentialScaleColor = d3.scaleSequential(d3.interpolatePiYG);
  //var sequentialScaleColor = d3.scaleSequential()
  //  .domain([0, 2000000]);

  // Declare Data structure
  var partition = d3.partition();

  // Size arcs
  var arc = d3.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
			.innerRadius(function(d) { return Math.max(0, y(d.y0)); })
      .outerRadius(function(d) { return Math.max(0, y(d.y1)); });
			
  //Remove and create svg for chart refreshing
  d3.select("svg").remove();	  
	  
	  
  /* Create the SVG container for the visualization and define its 
		 dimensions. Within that container, add a group element (`<g>`) 
		 that can be transformed via a translation to account for the 
		 margins and to center the visualization in the container.*/  	  
  var svg = d3.select(document.getElementById("D3_Sunburst"))
			.append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");
  
  // Find data root
  var root = d3.hierarchy(nodeData);
  root.sum(function(d) { return d.size; });
  
	console.log("***** root data *****");	// Debug output
	console.log(root);			// Debug output
	
  svg.selectAll("path")
      .data(partition(root).descendants())
      .enter().append("path")
      .attr("d", arc)

      .style("fill", function(d) { return color((d.children ? d : d.parent).data.name); })	  
      .on("click", click)	// Initiate D3 event listener for mouse click on D3 chart
      .append("title")
      .text( Text_ToolTip );	// Initiate and call text tooltip


  // Function for click event  
  function click(d) {
    svg.transition()
        .duration(750)
        .tween("scale", function() {
          var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
              yd = d3.interpolate(y.domain(), [d.y0, 1]),
              yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
          return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
        })
				.selectAll("path")
				.attrTween("d", function(d) { return function() { return arc(d); }; });

		// From mouse click on D3 chart apply filter from D3 to 
		// Tableau Medicare Inpatient Charge Dashboard.
		Apply_Filter_Tableau_Medicare_Inpatient_Charge(d);
  }
  
  // Create text tooltip for D3 Chart
  function Text_ToolTip(d){
		var Value_Field_Name = strDisplayName;
		var Tooltip = ""; 
		var formatComma = d3.format(",");
			
		// Define whether dollar sign display on tooltip
		var DollarSign = "";
		
		// Add dollar sign to tooltip if value is not "Discharges"
		if( Value_Field_Name.toUpperCase().indexOf("DISCHARGES") === -1 ) {
			DollarSign = "$";
		}
		
		Tooltip = d.data.name + "\n" + Value_Field_Name + ": " + DollarSign + formatComma(d.value);

		//console.log("Height: " + d.height);			// Debug output
		//console.log("Depth: " + d.depth);			// Debug output
		//console.log("Value_Field_Name: " + d.data.name);	// Debug output
		//console.log("Value: " + d.value);			// Debug output
		//console.log("Size: " + d.data.size);			// Debug output

		return Tooltip;
  }   
  
  d3.select(self.frameElement).style("height", height + "px");

}


// Apply filter update to Tableau Medicare Inpatient Charge Dashboard.
function Apply_Filter_Tableau_Medicare_Inpatient_Charge(d){

	// Run Tableau Javascript API function to update filter to Tableau worksheet.
	switch(d.depth){
		case 0:
			resetTextFilterTo(vizMedicareIPChrg, "IP Map D3", "Provider State");
		break;
		
		case 1: 
			setFilterTo(vizMedicareIPChrg, "IP Map D3", "Provider State", d.data.name);
			
			// Reset Tableau filter for "Zip Code Desc"
			resetTextFilterTo(vizMedicareIPChrg, "IP Map D3", "Zip Code Desc");
		break;
	
		case 2:
			setFilterTo(vizMedicareIPChrg, "IP Map D3", "Zip Code Desc", d.data.name);
		break;
		
	}
}


/* -------------------- Part 4: D3 Tree Layout (IP Medicare Charge) Section [End] -------------------- */
