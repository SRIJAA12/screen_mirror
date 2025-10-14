@echo off
echo.
echo ========================================
echo   RESTORING SAMPLE STUDENTS DATA
echo ========================================
echo.

cd /d "%~dp0"

echo Running sample students restoration...
node restore-sample-students.js

echo.
echo ========================================
echo   RESTORATION COMPLETE
echo ========================================
echo.
echo Sample Students Available:
echo   • CS2021001 - Rajesh Kumar
echo   • CS2021002 - Priya Sharma  
echo   • IT2021003 - Arjun Patel
echo   • CS2021004 - Sneha Reddy
echo   • IT2021005 - Vikram Singh
echo.
echo Login Credentials:
echo   Password: password123 (for all)
echo   Lab ID: CC1
echo   System: CC1-01, CC1-02, etc.
echo.
pause
