#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Initializing GitHub repository for Letterboxd Visualizer...${NC}"

# Create screenshots directory for README
mkdir -p screenshots
touch screenshots/.gitkeep

# Initialize git repo
git init

# Stage files
git add .

# Initial commit
git commit -m "Initial commit: Letterboxd Diary Visualizer"

# Instructions for connecting to GitHub
echo -e "\n${GREEN}Repository initialized locally!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Create a new repository on GitHub (don't initialize with README, .gitignore, or license)"
echo -e "2. Run the following commands to connect and push to your GitHub repository:"
echo -e "\n   ${GREEN}git remote add origin https://github.com/YOUR_USERNAME/letterboxd-viz.git${NC}"
echo -e "   ${GREEN}git branch -M main${NC}"
echo -e "   ${GREEN}git push -u origin main${NC}"
echo -e "\nReplace 'YOUR_USERNAME' with your GitHub username."
echo -e "\n${YELLOW}Note:${NC} Remember this is a personal project, so make sure to mention in the README that it's not for commercial use." 