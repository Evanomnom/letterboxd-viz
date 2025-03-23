@echo off
echo Starting fresh Git setup for Letterboxd Visualizer...

:: Check for any existing .git directories in client
if exist client\.git (
  echo Removing separate Git repository from client folder...
  rmdir /s /q client\.git
  echo Client Git repository removed.
)

:: Check if there's a main .git directory
if exist .git (
  echo Removing main Git repository...
  rmdir /s /q .git
  echo Main Git repository removed.
)

:: Create screenshots directory for README
echo Creating screenshots directory...
mkdir screenshots 2>nul
type nul > screenshots\.gitkeep

:: Initialize a new git repo
echo Initializing new Git repository...
git init

:: Explicitly add everything including the client directory
echo Adding all files to Git (including client)...
git add .

:: Check what will be committed
echo Files staged for commit:
git status

:: Perform the initial commit
echo Creating initial commit...
git commit -m "Initial commit: Letterboxd Diary Visualizer with client folder"

echo.
echo Repository initialized successfully!
echo.
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
pause 