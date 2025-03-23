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
  const [currentYear, setCurrentYear] = useState(null);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  
  const contributionChartRef = useRef(null);
  
  // Filter movies for a specific date
  const getMoviesForDate = useCallback((dateStr) => {
    if (!diaryData || !dateStr) return [];
    const movies = diaryData.filter(movie => movie.date === dateStr);
    // Reverse the array to show movies in chronological viewing order (oldest to newest)
    // instead of the default reverse chronological order from the API
    const sortedMovies = [...movies].reverse();
    console.log(`Movies for date ${dateStr}:`, sortedMovies);
    return sortedMovies;
  }, [diaryData]);

  // Get all movies for a specific month, sorted by viewing date
  const getMoviesForMonth = useCallback((year, month) => {
    if (!diaryData) return [];
    
    // Filter movies that were watched in the specified month and year
    const movies = diaryData.filter(movie => {
      if (!movie.date) return false;
      const dateParts = movie.date.split('-');
      return dateParts.length === 3 && 
             parseInt(dateParts[0]) === year && 
             parseInt(dateParts[1]) === month;
    });
    
    // Create a map of movies by date for easier sorting
    const moviesByDate = {};
    
    movies.forEach(movie => {
      if (!moviesByDate[movie.date]) {
        moviesByDate[movie.date] = [];
      }
      moviesByDate[movie.date].push(movie);
    });
    
    // Reverse the order of movies for each day (oldest to newest)
    Object.keys(moviesByDate).forEach(date => {
      moviesByDate[date] = moviesByDate[date].reverse();
    });
    
    // Sort by date (ascending - earliest to latest)
    const sortedDates = Object.keys(moviesByDate).sort();
    
    // Flatten the movies back into a single array
    const sortedMovies = [];
    sortedDates.forEach(date => {
      sortedMovies.push(...moviesByDate[date]);
    });
    
    console.log(`Found ${sortedMovies.length} movies for ${year}-${month}`);
    return sortedMovies;
  }, [diaryData]);
  
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
        
        console.log('Diary data received:', response.data);
        
        // Check the first few entries for poster URLs
        if (response.data.length > 0) {
          console.log('Sample poster URLs:');
          for (let i = 0; i < Math.min(5, response.data.length); i++) {
            console.log(`Movie ${i+1}: ${response.data[i].filmTitle}`);
            console.log(`- Poster URL: ${response.data[i].posterUrl || 'None'}`);
          }
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
      ratingSum += parseFloat(rating) * ratingCounts[rating];
    });
    
    const avgRating = totalRated > 0 ? (ratingSum / totalRated).toFixed(1) : 'N/A';
    
    // Process dates for contribution chart
    const dateMap = {};
    const weekMap = {};
    
    // Get the range of dates
    let minDate = new Date();
    let maxDate = new Date(2000, 0, 1);
    
    // Count movies by day and week for the contribution chart
    data.forEach(entry => {
      if (entry.date) {
        const dateObj = new Date(entry.date);
        if (!isNaN(dateObj.getTime())) {
          const dateStr = dateObj.toISOString().split('T')[0];
          
          if (dateObj < minDate) minDate = new Date(dateObj);
          if (dateObj > maxDate) maxDate = new Date(dateObj);
          
          dateMap[dateStr] = (dateMap[dateStr] || 0) + 1;
          
          // Calculate week number (ISO week: first day is Monday, first week has first Thursday)
          const firstDayOfYear = new Date(dateObj.getFullYear(), 0, 1);
          const pastDaysOfYear = (dateObj - firstDayOfYear) / 86400000;
          const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
          
          // Create a week key in format YYYY-WW
          const weekKey = `${dateObj.getFullYear()}-${weekNum.toString().padStart(2, '0')}`;
          weekMap[weekKey] = (weekMap[weekKey] || 0) + 1;
        }
      }
    });
    
    // Use the full date range from the user's history
    // For startDate, use January 1st of the earliest year
    // For endDate, use December 31st of the latest year
    const startDate = new Date(minDate.getFullYear(), 0, 1);
    const endDate = new Date(maxDate.getFullYear(), 11, 31);
    
    // Set current year to the most recent year by default
    setCurrentYear(maxDate.getFullYear());
    
    // Count movies by month
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
    const moviesByMonth = {};
    
    data.forEach(entry => {
      if (entry.date) {
        const dateParts = entry.date.split('-');
        if (dateParts.length === 3) {
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
      moviesByMonth,
      dateMap,
      weekMap,
      startDate,
      endDate
    });
  };
  
  // Create the GitHub-style contribution chart
  const createContributionChart = useCallback(() => {
    if (!contributionChartRef.current || !stats?.dateMap || !currentYear) return;
    
    // Clear previous chart
    d3.select(contributionChartRef.current).selectAll('*').remove();
    
    const { dateMap, startDate, endDate } = stats;
    
    // Count movies per year
    const moviesPerYear = {};
    Object.entries(dateMap).forEach(([dateStr, count]) => {
      const year = dateStr.split('-')[0];
      moviesPerYear[year] = (moviesPerYear[year] || 0) + count;
    });
    
    // Define month names
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Define dimensions
    const cellSize = 15;
    const cellMargin = 3;
    const fullCellSize = cellSize + cellMargin;
    
    // Determine the date range
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    
    // Create grid cells for each day for the current year only
    const gridData = [];
    
    // Get first day of current year
    const yearStart = new Date(currentYear, 0, 1);
    // Get last day of current year
    const yearEnd = new Date(currentYear, 11, 31);
    
    // Create dates for each day in the year
    let currentDate = new Date(yearStart);
    while (currentDate <= yearEnd) {
      const month = currentDate.getMonth();
      const day = currentDate.getDate();
      const dayOfWeek = currentDate.getDay(); // 0-6, Sunday to Saturday
      const dateStr = currentDate.toISOString().split('T')[0];
      
      gridData.push({
        year: currentYear,
        month,
        day,
        dayOfWeek,
        dateStr,
        count: dateMap[dateStr] || 0
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Define dimensions for the chart
    const margin = { top: 50, right: 40, bottom: 50, left: 30 };
    const daysPerWeek = 7;
    
    // Calculate total number of days in the year
    const totalDays = gridData.length;
    // Calculate how many columns we need (days/7 rounded up)
    const totalColumns = Math.ceil(totalDays / daysPerWeek);
    // Set the width based on the number of columns
    const width = totalColumns * fullCellSize + margin.left + margin.right;
    const height = daysPerWeek * fullCellSize + margin.top + margin.bottom;
    
    // Create the SVG element
    const chartContainer = d3.select(contributionChartRef.current);
    
    // Add year navigation controls
    const yearControlsDiv = chartContainer.selectAll('.year-controls').data([0]);
    
    const yearControlsEnter = yearControlsDiv.enter()
      .append('div')
      .attr('class', 'year-controls')
      .style('margin-bottom', '15px')
      .style('display', 'flex')
      .style('justify-content', 'center')
      .style('align-items', 'center');
    
    // Merge enter and update selections
    const yearControls = yearControlsEnter.merge(yearControlsDiv);
    
    // Clear existing year controls content and recreate
    yearControls.selectAll('*').remove();
    
    // Add previous year button
    yearControls.append('button')
      .attr('class', 'year-nav-btn prev-year')
      .text('← Previous Year')
      .style('margin-right', '10px')
      .style('opacity', currentYear <= startYear ? '0.5' : '1')
      .style('cursor', currentYear <= startYear ? 'default' : 'pointer')
      .on('click', function() {
        if (currentYear > startYear) {
          setCurrentYear(currentYear - 1);
        }
      });
    
    // Add year display with movie count
    const currentYearMovies = moviesPerYear[currentYear.toString()] || 0;
    yearControls.append('div')
      .attr('class', 'current-year-display')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('margin', '0 15px')
      .html(`${currentYear} <span style="font-size: 16px; color: #bbb;">(${currentYearMovies} movies)</span>`);
    
    // Add next year button
    yearControls.append('button')
      .attr('class', 'year-nav-btn next-year')
      .text('Next Year →')
      .style('margin-left', '10px')
      .style('opacity', currentYear >= endYear ? '0.5' : '1')
      .style('cursor', currentYear >= endYear ? 'default' : 'pointer')
      .on('click', function() {
        if (currentYear < endYear) {
          setCurrentYear(currentYear + 1);
        }
      });
    
    // Remove existing SVG and recreate
    chartContainer.selectAll('svg').remove();
    
    const svg = chartContainer.append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Define the color scale based on number of movies watched - using GitHub-style greens
    // Now using a fixed scale from 0-4+ for all users
    const colorScale = d3.scaleSequential()
      .domain([0, 4]) // Fixed scale from 0-4 for all users
      .interpolator(d3.interpolateGreens);
    
    // Function to map actual movie count to color scale (anything above 4 gets the 4 color)
    const getColor = (count) => {
      if (count === 0) return '#2c2c2c';
      return colorScale(Math.min(count, 4));
    };
    
    // Create a continuous calendar layout
    // First, get day of week for first day of year (to offset the grid)
    const firstDayOfWeek = new Date(currentYear, 0, 1).getDay();
    
    // Calculate total weeks in the year for the grid
    const totalWeeks = Math.ceil((getDayOfYear(new Date(currentYear, 11, 31)) + firstDayOfWeek) / 7);
    
    // Create a grid of all possible cells - this ensures no gaps
    const calendarGrid = [];
    for (let week = 0; week < totalWeeks; week++) {
      for (let day = 0; day < 7; day++) {
        // Calculate the actual day of year this cell represents
        const dayOfYear = week * 7 + day - firstDayOfWeek;
        
        // Only create cells for valid days in the year
        if (dayOfYear >= 0 && dayOfYear < gridData.length) {
          const dayData = gridData[dayOfYear];
          calendarGrid.push({
            week,
            weekday: day,
            dayOfYear,
            data: dayData
          });
        }
      }
    }
    
    // Add month labels at appropriate positions
    const monthLabelPositions = [];
    for (let m = 0; m < 12; m++) {
      // Find the first day of this month
      const firstDayOfMonth = new Date(currentYear, m, 1);
      const dayOfYear = getDayOfYear(firstDayOfMonth) - 1;
      const adjustedDayOfYear = dayOfYear + firstDayOfWeek;
      const weekNum = Math.floor(adjustedDayOfYear / 7);
      
      monthLabelPositions.push({
        month: m,
        x: weekNum * fullCellSize
      });
    }
    
    // Add month labels
    svg.selectAll('.month-label')
      .data(monthLabelPositions)
      .enter()
      .append('text')
      .attr('class', 'month-label')
      .attr('x', d => d.x)
      .attr('y', -15)
      .attr('text-anchor', 'start')
      .attr('fill', '#aaa')
      .attr('cursor', 'pointer')
      .text(d => monthNames[d.month].substring(0, 3))
      .on('mouseover', function() {
        d3.select(this).attr('fill', '#4c9a52');
      })
      .on('mouseout', function() {
        d3.select(this).attr('fill', '#aaa');
      })
      .on('click', function(event, d) {
        const monthNumber = d.month + 1; // Convert from 0-indexed to 1-indexed
        
        // Get all movies for this month
        const moviesForMonth = getMoviesForMonth(currentYear, monthNumber);
        
        // Set selected date to show the month and year
        setSelectedDate(`${monthNames[d.month]} ${currentYear}`);
        
        // Set selected movies to all movies in this month
        setSelectedMovies(moviesForMonth);
        
        // Reset day highlighting
        svg.selectAll('rect.day')
          .attr('stroke', '#1f1f1f')
          .attr('stroke-width', 1);
      });
    
    // Add day of week labels
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    svg.selectAll('.day-label')
      .data(dayNames)
      .enter()
      .append('text')
      .attr('class', 'day-label')
      .attr('x', -5)
      .attr('y', (d, i) => i * fullCellSize + cellSize / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#888')
      .attr('font-size', '10px')
      .text(d => d);
    
    // Position each day in the grid using the calendar grid
    calendarGrid.forEach(cell => {
      // We already verified this cell has valid data
      const day = cell.data;
      
      // Create the rectangle for this day
      svg.append('rect')
        .attr('class', 'day')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('x', cell.week * fullCellSize)
        .attr('y', cell.weekday * fullCellSize)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('fill', getColor(day.count))
        .attr('stroke', '#1f1f1f')
        .attr('stroke-width', 1)
        .on('mouseover', function() {
          d3.select(this)
            .attr('stroke', '#4c9a52')
            .attr('stroke-width', 2);
        })
        .on('mouseout', function() {
          d3.select(this)
            .attr('stroke', '#1f1f1f')
            .attr('stroke-width', 1);
        })
        .on('click', function() {
          // Get the date string from the day data
          const dateStr = day.dateStr;
          setSelectedDate(dateStr);
          
          // Filter movies for this date
          const movies = getMoviesForDate(dateStr);
          setSelectedMovies(movies);
          
          // Highlight this cell and reset others
          svg.selectAll('rect.day')
            .attr('stroke', '#1f1f1f')
            .attr('stroke-width', 1);
            
          d3.select(this)
            .attr('stroke', '#4c9a52')
            .attr('stroke-width', 2);
        })
        .append('title')
        .text(`${monthNames[day.month]} ${day.day}, ${day.year}: ${day.count} movie${day.count !== 1 ? 's' : ''}`);
    });
    
    // Add legend at the bottom of the chart with more space
    const legendY = daysPerWeek * fullCellSize + 20; // Position below the grid with padding
    const legendX = 0; // Left-aligned
    
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendX},${legendY})`);
    
    // Fixed legend with 0-4+ values
    const legendItems = [
      { value: 0, label: '0' },
      { value: 1, label: '1' },
      { value: 2, label: '2' },
      { value: 3, label: '3' },
      { value: 4, label: '4+' }
    ];
    
    legend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', '#e0e0e0')
      .attr('font-size', '12px')
      .text('Movies per day:');
    
    const legendItemWidth = 50; // Wider spacing for better readability
    
    legend.selectAll('.legend-item')
      .data(legendItems)
      .enter()
      .append('rect')
      .attr('class', 'legend-item')
      .attr('x', (d, i) => 100 + i * legendItemWidth)
      .attr('y', -10)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('fill', d => {
        if (d.value === 0) return '#2c2c2c';
        return colorScale(d.value);
      })
      .attr('stroke', '#1f1f1f')
      .attr('stroke-width', 1);
    
    legend.selectAll('.legend-label')
      .data(legendItems)
      .enter()
      .append('text')
      .attr('class', 'legend-label')
      .attr('x', (d, i) => 100 + i * legendItemWidth + cellSize / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#aaa')
      .attr('font-size', '10px')
      .text(d => d.label);
      
    // Helper function to get day of year
    function getDayOfYear(date) {
      const start = new Date(date.getFullYear(), 0, 0);
      const diff = date - start;
      const oneDay = 1000 * 60 * 60 * 24;
      return Math.floor(diff / oneDay);
    }
  }, [stats, currentYear, getMoviesForMonth, getMoviesForDate]);
  
  // Create charts once data is loaded
  useEffect(() => {
    if (!loading && !error && stats && diaryData.length > 0) {
      createContributionChart();
    }
  }, [loading, error, stats, diaryData, createContributionChart]);

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
      <h2>Letterboxd Statistics for {username}</h2>
      
      {loading && <div className="loading">Loading diary data...</div>}
      
      {error && <div className="error">{error}</div>}
      
      {!loading && !error && stats && (
        <div className="stats-container">
          <div className="chart-container">
            <h3>Year Activity</h3>
            <div ref={contributionChartRef} className="contribution-chart"></div>
          </div>
          
          {selectedMovies && selectedMovies.length > 0 && (
            <div className="movie-list-container">
              <h3>
                {selectedDate && selectedDate.includes('-') ? 
                  `Movies watched on ${new Date(selectedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}` : 
                  `Movies watched in ${selectedDate}`}
                <span className="movie-count">({selectedMovies.length})</span>
              </h3>
              <div className="movie-list">
                {selectedMovies.map((movie, index) => (
                  <div key={index} className="movie-item">
                    <div className="movie-details">
                      <h4>{movie.filmTitle} {movie.filmYear && `(${movie.filmYear})`}</h4>
                      <div className="rating-container">
                        {movie.rating && movie.rating !== 'Not rated' && (
                          <div className="movie-rating">
                            {Array.from({ length: Math.floor(parseFloat(movie.rating)) }).map((_, i) => (
                              <span key={i} className="star">★</span>
                            ))}
                            {movie.rating % 1 !== 0 && <span className="half-star">½</span>}
                          </div>
                        )}
                        {movie.liked && <div className="liked-badge">♥</div>}
                        {movie.rewatch && <div className="rewatch-badge">↻</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="back-button" style={{ marginTop: '20px' }}>
        <Link to="/">
          <button>Try Another Username</button>
        </Link>
      </div>
    </div>
  );
};

export default Visualization; 