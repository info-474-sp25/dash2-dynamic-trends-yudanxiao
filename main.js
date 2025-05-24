// main.js

// 1) Set up margins and dimensions
const margin = { top: 50, right: 100, bottom: 60, left: 70 };
const width  = 900 - margin.left - margin.right;
const height = 400 - margin.top  - margin.bottom;

// 2) Create SVG canvas
const svg = d3.select('#lineChart1')
  .attr('width',  width  + margin.left + margin.right)
  .attr('height', height + margin.top  + margin.bottom)
  .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// 3) Label offsets for placing endpoint labels neatly
const labelOffsets = {
  Phoenix:      { dx: -25, dy: -20 },
  Jacksonville: { dx: -25, dy: 10  },
  Charlotte:    { dx: 10,  dy: 15  },
  Philadelphia: { dx: 0,   dy:-15  },
  Chicago:      { dx: 0,   dy: 0   },
  Indianapolis: { dx:-25,  dy: 15  }
};

// 4) Globals to hold data and scales
let cityData;
let xScale, yScale, color;

// 5) Widget selections
const citySelect  = d3.select('#citySelect');
const monthRange  = d3.select('#monthRange');
const monthLabel  = d3.select('#monthLabel');

// 6) Load & preprocess data
d3.csv('weather.csv').then(raw => {
  // Parse dates and temps
  const parsed = raw.map(d => ({
    Month:   new Date(d.date).getMonth() + 1,
    AvgTemp: +d.actual_mean_temp,
    city:    d.city
  }));

  // Roll up to monthly averages by city
  const rolled = d3.rollup(
    parsed,
    v => d3.mean(v, d => d.AvgTemp),
    d => d.city,
    d => d.Month
  );

  // Convert to array-of-objects
  cityData = Array.from(rolled, ([city, monthMap]) => ({
    city,
    values: Array.from(monthMap, ([Month, AvgTemp]) => ({ Month, AvgTemp }))
                 .sort((a, b) => a.Month - b.Month)
  }));

  // Build scales
  xScale = d3.scaleLinear()
             .domain([1, 12])
             .range([0, width]);

  yScale = d3.scaleLinear()
             .domain([0, d3.max(cityData, c => d3.max(c.values, v => v.AvgTemp))])
             .nice()
             .range([height, 0]);

  color = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(cityData.map(c => c.city));

  // Populate city dropdown with "All Cities" first
  const options = ['All Cities'].concat(cityData.map(d => d.city));
  citySelect.selectAll('option')
    .data(options)
    .enter()
    .append('option')
      .attr('value', d => d === 'All Cities' ? 'all' : d)
      .text(d => d);

  // Initialize month label
  monthLabel.text('All Months');

  // Initial chart draw (all cities, full year)
  updateChart(cityData.map(d => d.city), +monthRange.node().value);
});

// 7) Chart update function
function updateChart(selectedCities, maxMonth) {
  // Clear previous chart
  svg.selectAll('*').remove();

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
     .text('Avg Mean Temp (°F)');

  // Line generator
  const lineGen = d3.line()
    .x(d => xScale(d.Month))
    .y(d => yScale(d.AvgTemp));

  // Plot each selected city
  cityData
    .filter(c => selectedCities.includes(c.city))
    .forEach(({ city, values }) => {
      // Filter up to the chosen month
      const vals = values.filter(v => v.Month <= maxMonth);

      // Draw line
      svg.append('path')
        .datum(vals)
        .attr('fill', 'none')
        .attr('stroke', color(city))
        .attr('stroke-width', 2)
        .attr('d', lineGen);

      // Draw endpoint label
      const last   = vals[vals.length - 1];
      const offset = labelOffsets[city] || { dx: 8, dy: 0 };

      svg.append('text')
        .attr('x', xScale(last.Month) + offset.dx)
        .attr('y', yScale(last.AvgTemp) + offset.dy)
        .attr('alignment-baseline', 'middle')
        .style('font-size', '12px')
        .text(city);
    });
}

// 8) Widget event handlers

// City dropdown
citySelect.on('change', () => {
  const val = citySelect.node().value;
  const selectedCities = val === 'all'
    ? cityData.map(d => d.city)
    : [val];
  updateChart(selectedCities, +monthRange.node().value);
});

// Month slider
monthRange.on('input', () => {
  const m = +monthRange.node().value;
  monthLabel.text(m === 12 ? 'All Months' : `Months 1–${m}`);

  const val = citySelect.node().value;
  const selectedCities = val === 'all'
    ? cityData.map(d => d.city)
    : [val];

  updateChart(selectedCities, m);
});
