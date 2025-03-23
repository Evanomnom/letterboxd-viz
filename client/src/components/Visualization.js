import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import * as d3 from 'd3';

const Visualization = () => {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diaryData, setDiaryData] = useState([]);
  const [stats, setStats] = useState(null);
  
  const monthlyChartRef = useRef(null);
  const ratingsChartRef = useRef(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/diary/${username}`);
        
        if (response.data.length === 0) {
          setError(`No diary entries found for user "${username}". Make sure the username is correct and the diary is public.`);
          setLoading(false);
          return;
        }
        
        setDiaryData(response.data);
        calculateStats(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching diary data:', err);
        setError(`Failed to fetch diary data for "${username}". ${err.response?.data?.error || err.message}`);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [username]);
  
  // Calculate statistics from diary data
  const calculateStats = (data) => {
    const totalMovies = data.length;
    
    // Count ratings
    const ratingCounts = {};
    let totalRated = 0;
    
    data.forEach(entry => {
      if (entry.rating && entry.rating !== 'Not rated') {
        totalRated++;
        ratingCounts[entry.rating] = (ratingCounts[entry.rating] || 0) + 1;
      }
    });
    
    // Calculate average rating
    let ratingSum = 0;
    Object.keys(ratingCounts).forEach(rating => {
      ratingSum += parseInt(rating) * ratingCounts[rating];
    });
    
    const avgRating = totalRated > 0 ? (ratingSum / totalRated).toFixed(1) : 'N/A';
    
    // Count movies by month
    const moviesByMonth = {};
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    data.forEach(entry => {
      if (entry.date) {
        // Parse the date format YYYY-MM-DD
        const dateParts = entry.date.split('-');
        if (dateParts.length === 3) {
          // Get month number (0-indexed in JS Date)
          const monthIndex = parseInt(dateParts[1]) - 1;
          const monthName = monthNames[monthIndex];
          
          moviesByMonth[monthName] = (moviesByMonth[monthName] || 0) + 1;
        }
      }
    });
    
    setStats({
      totalMovies,
      totalRated,
      avgRating,
      ratingCounts,
      moviesByMonth
    });
  };
  
  // Use useCallback to memoize the chart creation functions
  const createMonthlyChart = useCallback(() => {
    if (!monthlyChartRef.current || !stats?.moviesByMonth) return;
    
    // Clear previous chart
    d3.select(monthlyChartRef.current).selectAll('*').remove();
    
    const data = Object.entries(stats.moviesByMonth).map(([month, count]) => ({ month, count }));
    
    // Sort by month
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
    
    data.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
    
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = monthlyChartRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const svg = d3.select(monthlyChartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // X axis
    const x = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([0, width])
      .padding(0.2);
    
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end')
      .style('fill', '#bbb');
    
    // Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) * 1.1])
      .range([height, 0]);
    
    svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('fill', '#bbb');
    
    // Bars
    svg.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', d => x(d.month))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.count))
      .attr('fill', '#ff8000');
    
    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('fill', '#e0e0e0')
      .text('Movies Watched by Month');
  }, [stats]);
  
  const createRatingsChart = useCallback(() => {
    if (!ratingsChartRef.current || !stats?.ratingCounts) return;
    
    // Clear previous chart
    d3.select(ratingsChartRef.current).selectAll('*').remove();
    
    const data = Object.entries(stats.ratingCounts)
      .map(([rating, count]) => ({ rating: parseFloat(rating), count }))
      .sort((a, b) => a.rating - b.rating);
    
    console.log("Rating data for chart:", data);
    
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = ratingsChartRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const svg = d3.select(ratingsChartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // X axis with decimal values
    const x = d3.scaleBand()
      .domain(data.map(d => d.rating.toString()))
      .range([0, width])
      .padding(0.2);
    
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('fill', '#bbb');
    
    // Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) * 1.1])
      .range([height, 0]);
    
    svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('fill', '#bbb');
    
    // Bars
    svg.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', d => x(d.rating.toString()))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.count))
      .attr('fill', '#ff8000');
    
    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('fill', '#e0e0e0')
      .text('Rating Distribution');
  }, [stats]);
  
  // Create charts once data is loaded
  useEffect(() => {
    if (!loading && !error && stats && diaryData.length > 0) {
      createMonthlyChart();
      createRatingsChart();
    }
  }, [loading, error, stats, diaryData, createMonthlyChart, createRatingsChart]);

  if (loading) {
    return (
      <div className="loading">
        Loading diary data for {username}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="visualization-container">
        <div className="error">{error}</div>
        <Link to="/">
          <button>Try Another Username</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="visualization-container">
      <h2>Diary Visualization for {username}</h2>
      
      {stats && (
        <div className="stats-summary">
          <div className="stat-card">
            <h3>Total Movies</h3>
            <div className="stat-value">{stats.totalMovies}</div>
          </div>
          
          <div className="stat-card">
            <h3>Rated Movies</h3>
            <div className="stat-value">{stats.totalRated}</div>
          </div>
          
          <div className="stat-card">
            <h3>Average Rating</h3>
            <div className="stat-value">{stats.avgRating}</div>
          </div>
        </div>
      )}
      
      <div className="chart-container">
        <div 
          ref={monthlyChartRef} 
          className="chart monthly-chart"
          style={{ width: '100%', height: '300px', marginBottom: '30px' }}
        ></div>
        
        <div 
          ref={ratingsChartRef} 
          className="chart ratings-chart"
          style={{ width: '100%', height: '300px' }}
        ></div>
      </div>
      
      <div className="back-button" style={{ marginTop: '20px' }}>
        <Link to="/">
          <button>Try Another Username</button>
        </Link>
      </div>
    </div>
  );
};

export default Visualization; 