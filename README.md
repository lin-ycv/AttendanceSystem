# Attendance System

A super simple automated attendance system using HTML form and Google Apps Script. This is not meant as a fool-proof method of tracking attendance, but an automated method. It works as following:
1. Attendee opens [index.html](index.html) (either locally or hosted online)
2. Attendee enters their ID and pressed submmit
3. ID and their device IP is sent to a Google Web-App (GWA) to be proccessed
4. GWA logs the submission, then starts validations to check if it should count towards attendance
5. First checks if it's submitted on the day of the course/event (checks day of the week)
6. Then checks for different ID submittion from the same IP (blocks all submission from that IP)*
7. Lastly checks for IP before compiling the logs into an attendance sheet 
    * there's a 10 min delay to the compilation, counted from the last submission, so it only compiles once after everyone has submitted

## Setup
1. Create a Google Spreadsheet and populate it to match [Spreadsheet.xls](GD\Spreadsheet.xls)
    * the sheet names have to match, including captitalization
2. Edit the spreadsheet as needed (note: if you change the order of the columns, the Apps Script needs to be adjusted accordingly)
    * the number after IP Address is the day of the week of the course/event
3. Create a Apps Script on that Spreadsheet, paste in [GS.js](GD\GS.js) and adjust accordingly
    * on [line 66](GD\GS.js#L66), you can adjust the delay before compilation
    * on [line 128](GD\GS.js#L128), set the IP address constraint (or remove if not needed)
4. Deploy it to get the web-app URL and replace the placeholder in [index.html on line 96](index.html#L96)

----
*WAN IP is use, if devices are behind a DHCP service like a router, all devices will report the same IP address.