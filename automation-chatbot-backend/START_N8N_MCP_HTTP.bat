@echo off
REM Start n8n-mcp in HTTP mode for FastAPI integration

echo ================================================
echo Starting n8n-mcp in HTTP mode
echo ================================================
echo.

REM Change to n8n-mcp directory
cd /d "D:\workflow bridge\n8n-mcp"

echo Starting n8n-mcp HTTP server on port 3001...
echo.
echo Press Ctrl+C to stop the server
echo.

REM Set environment variables for Windows
set MCP_MODE=http
set PORT=3001
set USE_FIXED_HTTP=true
set AUTH_TOKEN=aB3dE7fG9hJ2kL4mN6pQ8rS0tU5vW1xY

REM Start in HTTP mode with fixed implementation
node dist/mcp/index.js

pause

