const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Function to scrape Letterboxd diary data
async function scrapeLetterboxdDiary(username) {
  try {
    let allDiaryEntries = [];
    let currentPage = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      const url = `https://letterboxd.com/${username}/films/diary/page/${currentPage}/`;
      console.log(`Scraping page ${currentPage}: ${url}`);
      
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      const entriesOnPage = [];
      
      // Find all diary entries
      $('.diary-entry-row').each((index, element) => {
        // Extract date from the diary-day link
        const dateDay = $(element).find('.diary-day a').text().trim();
        const dateLink = $(element).find('.diary-day a').attr('href');
        // Extract date in format YYYY/MM/DD from the link
        let date = '';
        if (dateLink) {
          const dateMatch = dateLink.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
          if (dateMatch && dateMatch.length >= 4) {
            date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
          }
        }
        
        // Extract film details
        const filmTitle = $(element).find('.headline-3 a').text().trim();
        const filmYear = $(element).find('.td-released span').text().trim();
        
        // Extract rating - check for the rating classes
        let rating = 'Not rated';
        const ratingElement = $(element).find('.td-rating');
        
        // First try to get the rating from the rateit element (for logged-in view)
        const ratingValue = $(element).find('.rateit-range').attr('aria-valuenow');
        if (ratingValue) {
          // Convert from 10-scale to 5-scale and maintain decimals
          rating = (parseInt(ratingValue) / 2).toFixed(1); // Use toFixed to keep one decimal place
        } 
        // If that doesn't work, fall back to the class-based approach (public view)
        else {
          const ratingClass = $(element).find('.rating').attr('class');
          if (ratingClass) {
            const ratedMatch = ratingClass.split(' ').find(className => className.startsWith('rated-'));
            if (ratedMatch) {
              // Handle "rated-X" format by extracting just the number
              let numericRating = ratedMatch.replace('rated-', '');
              
              // Handle different rating classes:
              // For 0.5 to 5.0 ratings, they use "rated-1" through "rated-10"
              // Convert to 5-star scale (divide by 2)
              if (!isNaN(numericRating)) {
                // Use toFixed to maintain decimal precision
                rating = (parseInt(numericRating) / 2).toFixed(1);
              } else {
                // If it's not a numeric rating, just use the string as is
                rating = numericRating;
              }
            }
          }
        }
        
        // Check if film was liked - multiple approaches
        let liked = false;
        
        // Check for the liked icon (logged-in view)
        if ($(element).find('.td-like .icon-liked').length > 0) {
          liked = true;
        } 
        // Fall back to the general like class (public view)
        else if ($(element).find('.like').length > 0) {
          liked = true;
        }
        
        // Check if it was a rewatch
        const rewatch = !$(element).find('.td-rewatch').hasClass('icon-status-off');
        
        console.log(date, filmTitle, filmYear, rating, liked, rewatch);
        
        entriesOnPage.push({
          date,
          filmTitle,
          filmYear,
          rating,
          liked,
          rewatch
        });
      });
      
      // Add entries from this page to our collection
      allDiaryEntries = [...allDiaryEntries, ...entriesOnPage];
      
      // Check if there's a "next" pagination link
      hasMorePages = $('.pagination').find('a.next').length > 0;
      
      // If no entries were found on this page, stop
      if (entriesOnPage.length === 0) {
        hasMorePages = false;
      }
      
      // Increment page counter
      currentPage++;
      
      // Add a small delay between requests to be respectful
      if (hasMorePages) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return allDiaryEntries;
  } catch (error) {
    console.error(`Error scraping Letterboxd diary for ${username}:`, error);
    throw new Error('Failed to scrape Letterboxd diary data');
  }
}

// API endpoint to get diary data
app.get('/api/diary/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const diaryData = await scrapeLetterboxdDiary(username);
    res.json(diaryData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 