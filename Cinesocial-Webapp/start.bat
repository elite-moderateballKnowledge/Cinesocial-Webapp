@echo off
echo Starting CineSocial Backend...
start cmd /k "cd backend && npm start"

echo Starting CineSocial Frontend...
start cmd /k "cd frontend && npm run dev"

echo Both servers are starting in separate windows!
