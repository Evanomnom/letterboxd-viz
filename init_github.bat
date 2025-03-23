@echo off
echo Initializing GitHub repository for Letterboxd Visualizer...

:: Create screenshots directory for README
mkdir screenshots 2>nul
type nul > screenshots\.gitkeep

:: Initialize git repo if not already initialized
if not exist .git (
  git init
  echo Git repository initialized.
) else (
  echo Git repository already exists.
)

:: Stage files
git add .
echo Files staged for commit.

:: Initial commit
git commit -m "Initial commit: Letterboxd Diary Visualizer"
echo Initial commit created.

:: Instructions for connecting to GitHub
echo.
echo Repository initialized locally!
echo Next steps:
echo 1. Create a new repository on GitHub (don't initialize with README, .gitignore, or license)
echo 2. Run the following commands to connect and push to your GitHub repository:
echo.
echo    git remote add origin https://github.com/YOUR_USERNAME/letterboxd-viz.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo Replace 'YOUR_USERNAME' with your GitHub username.
echo.
echo Note: Remember this is a personal project, so make sure to mention in the README that it's not for commercial use.
echo.
pause 