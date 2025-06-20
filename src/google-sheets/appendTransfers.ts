export async function appendTransfers(
  values: string[][],
  sheetId: number,
  sheetName: string,
): Promise<any> {
  console.log("appendTransfers", {sheetId, values});
  console.time("appendTransfers");

  const log = (text: string) => {
    console.time("Done: " + text);
    console.log("appendTransfers", text);
  };
  const logDone = (text: string) => {
    console.timeEnd("Done: " + text);
  };

  if (values.length > 1) {
    log("Backup");
    await backupSpreedSheet();
    logDone("Backup");
  }

  try {
    // Insert a row and copy and paste existing row
    const startInsertRowIndex = 1;
    const endInsertRowIndex = startInsertRowIndex + values.length;
    const startCopyRowIndex = endInsertRowIndex + 1;
    const endCopyRowIndex = startCopyRowIndex + values.length;

    log("Inserting and coping");
    const newRowRequestBody: gapi.client.sheets.BatchUpdateSpreadsheetRequest =
      {
        requests: [
          {
            insertDimension: {
              inheritFromBefore: true,
              range: {
                dimension: "ROWS",
                startIndex: startInsertRowIndex,
                endIndex: endInsertRowIndex,
                sheetId,
              },
            },
          },
          {
            copyPaste: {
              source: {
                sheetId,
                startRowIndex: startCopyRowIndex,
                endRowIndex: endCopyRowIndex,
                startColumnIndex: 0,
                endColumnIndex: 6,
              },
              destination: {
                sheetId,
                startRowIndex: startInsertRowIndex,
                endRowIndex: endInsertRowIndex,
                startColumnIndex: 0,
                endColumnIndex: 6,
              },
              pasteType: "PASTE_NORMAL",
            },
          },
        ],
      };
    await gapi.client.sheets.spreadsheets.batchUpdate(
      {
        spreadsheetId: process.env.REACT_APP_SPREADSHEET_ID,
      },
      newRowRequestBody
    );
    logDone("Inserting and coping");

    log("Pasting values");
    
    // Update row values
    const valuesUpdateBody: gapi.client.sheets.BatchUpdateValuesRequest = {
      valueInputOption: "USER_ENTERED",
      data: [
        {
          range: `${sheetName}!A2:F${values.length + 1}`,
          values,
        },
      ],
    };
    await gapi.client.sheets.spreadsheets.values.batchUpdate(
      { spreadsheetId: process.env.REACT_APP_SPREADSHEET_ID },
      valuesUpdateBody
    );
    logDone("Pasting values");

  } finally {
    console.timeEnd("appendTransfers");
  }
}

async function backupSpreedSheet() {
  await gapi.client.drive.files.copy({
    fileId: process.env.REACT_APP_SPREADSHEET_ID,
    resource: { name: "HomeFinances_Backup_" + new Date().toISOString() },
  });
} 