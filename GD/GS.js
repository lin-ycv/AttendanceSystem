function debugSimulatePost() {
  try {
    let sampleData = {
      id: "10min",
      ip: "127.0.0.1"
    };

    let fakeEvent = {
      postData: {
        contents: JSON.stringify(sampleData)
      }
    };

    // Call your doPost function with the simulated event
    let response = doPost(fakeEvent);
    Logger.log(response);
  } catch (error) {
    Logger.log('Error: ' + error);
  }
}

// Create a global variable to store the last submission time
let lastSubmissionTime = null;

function doPost(e) {
  try {
    let logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log');
    let data = JSON.parse(e.postData.contents);
    
    let timestamp = new Date();
    let dayOfWeek = timestamp.getDay();
    let weekOfYear = getWeekNumber(timestamp); // Get week of the year
    let id = data.id;
    let ip = data.ip;
    
    logSheet.appendRow([timestamp, dayOfWeek, weekOfYear, id, ip]);

    // Reset the last submission time and set the trigger for the tally function
    lastSubmissionTime = new Date();
    setTallyTrigger();
    
    // Return a response to the client
    return ContentService.createTextOutput('Data logged successfully');
  } catch (error) {
    console.error('Error in doPost function: ' + error);
    return ContentService.createTextOutput('An error occurred');
  }
}

// Function to get the week number of the year
function getWeekNumber(date) {
  let d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  let yearStart = new Date(d.getFullYear(), 0, 1);
  let weekNumber = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return weekNumber;
}

// Function to set the trigger for the tally function after 10 minutes
function setTallyTrigger() {
  // Delete any existing triggers
  deleteExistingTrigger();
  
  // Set a new trigger after 10 minutes
  let triggerTime = new Date(lastSubmissionTime.getTime() + 10 * 60 * 1000);
  ScriptApp.newTrigger('runTally')
    .timeBased()
    .at(triggerTime)
    .create();
}

// Function to delete the existing trigger for the tally function
function deleteExistingTrigger() {
  let triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'runTally') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function runTally() {
  try {
    let logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log');
    let attendanceSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Attendance');

    // Get the value from cell F1 as the desired day of the week
    let desiredDayOfWeek = logSheet.getRange('F1').getValue();

    // Get the data from the Log sheet excluding the headers
    let logData = logSheet.getRange(2, 2, logSheet.getLastRow() - 1, logSheet.getLastColumn()-2).getValues();

    // Find the largest week of the year
    let largestWeek = Math.max(...logData.map(row => row[1])); // Column index for week of year

    // Create a map to track the count of each IP occurrence
    let ipCounts = new Map();

    // Filter the log data to only include entries from the largest week of the year
    let filteredLogData = [];

    for (let row of logData) {
      let weekOfYear = row[1];
      let dayOfWeek = row[0];
      let ip = row[3];

      if (weekOfYear === largestWeek && dayOfWeek === desiredDayOfWeek) {
        if (!ipCounts.has(ip)) {
          ipCounts.set(ip, 1);
          filteredLogData.push(row);
        } else {
          ipCounts.set(ip, ipCounts.get(ip) + 1);
        }
      }
    }

    // Exclude entries with IPs that occurred more than once
    filteredLogData = filteredLogData.filter(row => ipCounts.get(row[3]) === 1);

    // Loop through the filtered data to update the Attendance sheet
    for (let row of filteredLogData) {
      let id = row[2]; // Assuming index 2 is the column index for ID
      let weekOfYear = row[1];
      let ip = row[3];
  
      // Check if the IP begins with "xxx.xxx."
      if (ip.startsWith("xxx.xxx.")) {
        // Check if the ID exists in the Attendance sheet
        let idRange = attendanceSheet.getRange(1,1,attendanceSheet.getLastRow(),1);
        let idValues = idRange.getValues();
        let idRow = idValues.findIndex(value => value[0] === id);

        // If ID doesn't exist, append a new row
        if (idRow === -1) {
          idRow = idValues.length + 1;        
          attendanceSheet.getRange(idRow, 1).setValue(id);
        } else {
          // Since findIndex returns zero-based index, we need to add 1 to get the row number
          idRow += 1;
        }
        
        // Check if the week of year column exists in the header
        let weekColumn = weekOfYear;
        let headerRow = attendanceSheet.getRange(1,1,1,attendanceSheet.getLastColumn()) .getValues()[0];
        let columnIndex = headerRow.indexOf(weekColumn);

        if (columnIndex === -1) {
          let lastColumn = headerRow.length+1;
          attendanceSheet.getRange(1, lastColumn).setValue(weekColumn);
          columnIndex = lastColumn;
        } else {
          columnIndex += 1;
        }

        // Increment the tally for the specific ID and week of year
        attendanceSheet.getRange(idRow, columnIndex).setValue(1);
      }
    }

    // Reset the last submission time
    lastSubmissionTime = null;

    // Delete the trigger for the tally function
    deleteExistingTrigger();

    console.log(filteredLogData);

  } catch (error) {
    console.error('Error in tally function: ' + error);
  }
}