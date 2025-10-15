@echo off
echo 🗑️ Cleaning up unnecessary files...
echo.

REM Keep these important files:
REM - email-config-tool.html
REM - debug-srijaa-student.html  
REM - student-management-system.html
REM - forgot-password-tester.html
REM - check-student-data.html
REM - COLLEGE_STUDENT_SETUP_GUIDE.md
REM - EMAIL_SETUP_GUIDE.md
REM - TESTING_GUIDE.md

echo Removing duplicate/unnecessary files...

REM Remove duplicate testing files
if exist "add-student-direct.html" (
    del "add-student-direct.html"
    echo ✅ Removed add-student-direct.html
)

if exist "add-test-student.js" (
    del "add-test-student.js"
    echo ✅ Removed add-test-student.js
)

if exist "cleanup-database.html" (
    del "cleanup-database.html"
    echo ✅ Removed cleanup-database.html
)

if exist "complete-test.html" (
    del "complete-test.html"
    echo ✅ Removed complete-test.html
)

if exist "debug-session.html" (
    del "debug-session.html"
    echo ✅ Removed debug-session.html
)

if exist "emergency-clear.html" (
    del "emergency-clear.html"
    echo ✅ Removed emergency-clear.html
)

if exist "force-add-student.html" (
    del "force-add-student.html"
    echo ✅ Removed force-add-student.html
)

if exist "force-add-test-student.html" (
    del "force-add-test-student.html"
    echo ✅ Removed force-add-test-student.html
)

if exist "restore-sample-data.html" (
    del "restore-sample-data.html"
    echo ✅ Removed restore-sample-data.html
)

if exist "restore-sample-students.bat" (
    del "restore-sample-students.bat"
    echo ✅ Removed restore-sample-students.bat
)

if exist "restore-sample-students.js" (
    del "restore-sample-students.js"
    echo ✅ Removed restore-sample-students.js
)

if exist "test-first-signin.html" (
    del "test-first-signin.html"
    echo ✅ Removed test-first-signin.html
)

if exist "test-forgot-password.html" (
    del "test-forgot-password.html"
    echo ✅ Removed test-forgot-password.html
)

if exist "test-session-management.html" (
    del "test-session-management.html"
    echo ✅ Removed test-session-management.html
)

if exist "test-student-login.html" (
    del "test-student-login.html"
    echo ✅ Removed test-student-login.html
)

REM Remove duplicate documentation files
if exist "ENHANCED_SESSION_TESTING.md" (
    del "ENHANCED_SESSION_TESTING.md"
    echo ✅ Removed ENHANCED_SESSION_TESTING.md
)

if exist "ENHANCED_SESSION_TESTING_V2.md" (
    del "ENHANCED_SESSION_TESTING_V2.md"
    echo ✅ Removed ENHANCED_SESSION_TESTING_V2.md
)

if exist "IP_ADDRESS_UPDATE_SUMMARY.md" (
    del "IP_ADDRESS_UPDATE_SUMMARY.md"
    echo ✅ Removed IP_ADDRESS_UPDATE_SUMMARY.md
)

if exist "SESSION_FIXES_SUMMARY.md" (
    del "SESSION_FIXES_SUMMARY.md"
    echo ✅ Removed SESSION_FIXES_SUMMARY.md
)

if exist "setup-email.md" (
    del "setup-email.md"
    echo ✅ Removed setup-email.md
)

echo.
echo ✅ Cleanup completed!
echo.
echo 📁 Remaining important files:
echo   - email-config-tool.html (Email setup)
echo   - debug-srijaa-student.html (Student debugging)
echo   - student-management-system.html (Student management)
echo   - forgot-password-tester.html (Password testing)
echo   - check-student-data.html (Data verification)
echo   - COLLEGE_STUDENT_SETUP_GUIDE.md (Setup guide)
echo   - EMAIL_SETUP_GUIDE.md (Email guide)
echo   - TESTING_GUIDE.md (Testing guide)
echo.
echo 🎉 Your workspace is now clean and organized!
pause
