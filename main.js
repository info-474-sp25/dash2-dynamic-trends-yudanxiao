// main.js
// Static D3 Line Chart with Adjusted Endpoint Labels
const margin = { top: 50, right: 100, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select('#lineChart1')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// Label offset map to prevent overlap (dx, dy)
const labelOffsets = {
    Phoenix:     { dx: -25, dy: -20 },  // push Phoenix up & left
    Jacksonville:{ dx: -25, dy: 10 },   // push Jacksonville down & left
    Charlotte:   { dx:   10, dy: 15 },
    Philadelphia:{ dx:   0, dy: -15 },
    Chicago:     { dx:   0, dy: 0 },
    Indianapolis:{ dx:   -25, dy:15 }
  };
  
// Load and process data
d3.csv('weather.csv').then(raw => {
  // Parse daily records
  const parsed = raw.map(d => ({
    date: new Date(d.date),
    month: new Date(d.date).getMonth() + 1,
    temp: +d.actual_mean_temp,
    city: d.city
  }));

  // Aggregate monthly means per city
  const rolledUp = d3.rollup(
    parsed,
    v => d3.mean(v, d => d.temp),
    d => d.city,
    d => d.month
  );

  // Convert to array form
  const cityData = Array.from(rolledUp, ([city, monthMap]) => ({
    city,
    values: Array.from(monthMap, ([Month, AvgTemp]) => ({ Month, AvgTemp }))
      .sort((a, b) => a.Month - b.Month)
  }));

  // Scales
  const xScale = d3.scaleLinear()
    .domain([1, 12])
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(cityData, c => d3.max(c.values, v => v.AvgTemp))])
    .nice()
    .range([height, 0]);

  // Color palette
  const color = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(cityData.map(c => c.city));

  // Draw axes
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks(12));

  svg.append('g')
    .call(d3.axisLeft(yScale));

  // Axis labels
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height + 40)
    .attr('text-anchor', 'middle')
    .text('Month');

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -50)
    .attr('text-anchor', 'middle')
    .text('Average Actual Mean Temp (°F)');

  // Line generator
  const line = d3.line()
    .x(d => xScale(d.Month))
    .y(d => yScale(d.AvgTemp));

  // Draw lines and adjusted labels
  cityData.forEach(({ city, values }) => {
    // Draw line path
    svg.append('path')
      .datum(values)
      .attr('fill', 'none')
      .attr('stroke', color(city))
      .attr('stroke-width', 2)
      .attr('d', line);

    // Compute endpoint
    const last    = values[values.length - 1];
    // apply the dx/dy offsets (falling back to 8px right if none defined)
    const offset  = labelOffsets[city] || { dx: 8, dy: 0 };
    const xPos    = xScale(last.Month) + offset.dx;
    const yPos    = yScale(last.AvgTemp) + offset.dy;

    // Draw label
    svg.append('text')
      .attr('x', xPos)
      .attr('y', yPos)
      .attr('alignment-baseline', 'middle')
      .style('font-size', '12px')
      .text(city);
  });
});

    // ==========================================
    //         CHART 2 (if applicable)
    // ==========================================

    // 3.b: SET SCALES FOR CHART 2


    // 4.b: PLOT DATA FOR CHART 2


    // 5.b: ADD AXES FOR CHART 


    // 6.b: ADD LABELS FOR CHART 2


    // 7.b: ADD INTERACTIVITY FOR CHART 2
