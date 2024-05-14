import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const svgRef = useRef();
  const legendRef = useRef();
  const colorScale = useRef(d3.scaleOrdinal(d3.schemeCategory10)); 
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    d3.csv('https://raw.githubusercontent.com/brybrycha/dsc106_p3/main/my-app/public/dsc_course.csv').then(data => {
      console.log(data);
      setData(data);

      const allCourses = Array.from(new Set(data.map(d => d.name)));
      colorScale.current = d3.scaleOrdinal()  // **Reinitialize color scale with specific domain**
        .domain(allCourses)
        .range(d3.schemeCategory10);
    });
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      drawChart();
      drawLegend();
    }
  }, [data, searchTerm]);

  const drawChart = () => {
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 30, right: 50, bottom: 30, left: 20 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const filteredData = data.filter(d => {
      const normalizedSearchTerm = searchTerm.toLowerCase();
      const normalizedCourseName = d.name.toLowerCase();
    
      if (normalizedCourseName.includes(normalizedSearchTerm)) {
        if (normalizedSearchTerm === "dsc10") {
          return normalizedCourseName === "dsc10";
        }
        return true;
      }
      return false;
    });
      

    const parseTime = d3.timeParse('%Y-%m-%dT%H:%M:%S');
    const xScale = d3.scaleTime()
      .domain(d3.extent(filteredData, d => parseTime(d.time)))
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => parseFloat(d.waitlisted))])
      .range([height, 0]);

    const line = d3.line()
      .x(d => xScale(parseTime(d.time)))
      .y(d => yScale(parseFloat(d.waitlisted)));

    const groupedData = Array.from(d3.group(filteredData, d => d.name), ([key, value]) => ({ key, value }));

    const color = colorScale;

    groupedData.forEach(d => {
      svg.append('path')
        .datum(d.value)
        .attr('fill', 'none')
        .attr('stroke', colorScale.current(d.key))
        .attr('stroke-width', 2)
        .attr('d', line)
        .transition()
        .duration(750);
    });

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale));

    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .on('zoom', zoomed);

    svg.call(zoom)
      .on('wheel', zoomed);

    function zoomed(event) {
      const new_xScale = event.transform.rescaleX(xScale);
      svg.select('.x-axis').call(d3.axisBottom(new_xScale));
      svg.selectAll('path').attr('transform', event.transform);
    }


  };


  const drawLegend = () => {
    const legend = d3.select(legendRef.current);

    const groupedData = Array.from(d3.group(data, d => d.name), ([key, value]) => ({ key, value }));

    const color = d3.scaleOrdinal()
      .domain(groupedData.map(d => d.key))
      .range(d3.schemeCategory10);

    const legendItems = legend.selectAll('.legend-item')
      .data(groupedData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    legendItems.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', d => color(d.key));

    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 10)
      .text(d => d.key)
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle');
  };

  return (
    <div className="App">
       <div className="search-container">
          <i className="search-icon">&#x1F50D;</i> {/* Unicode for a magnifying glass icon */}
          <input
            type = "text"
            className="search-box" // Apply the CSS class
            placeholder = "Enter course name..."  
            value = {searchTerm}
            onChange = {e => setSearchTerm(e.target.value)}
          />
        </div>
      <svg ref={svgRef}></svg>
      <svg ref={legendRef} className="legend"></svg>
    </div>
  );
}

export default App;
