
export async function appendExpences(values: string[][]): Promise<any> {

    const sheetId = process.env.REACT_APP_EXPENSES_SHEET_ID;

    // Insert a row and copy and paste existing row
    const newRowRequestBody: gapi.client.sheets.BatchUpdateSpreadsheetRequest = {
        requests: [{
            insertDimension: {
                inheritFromBefore: true,
                range: {
                    dimension: 'ROWS',
                    endIndex: 2,
                    sheetId,
                    startIndex: 1,
                }
            },
        }, {
            copyPaste: {
                source: {
                    sheetId,
                    startRowIndex: 3,
                    endRowIndex: 4,
                    startColumnIndex: 0,
                    endColumnIndex: 8,
                },
                destination: {
                    sheetId,
                    startRowIndex: 1,
                    endRowIndex: 2,
                    startColumnIndex: 0,
                    endColumnIndex: 8,
                },
                pasteType: 'PASTE_NORMAL',
            }
        }],
    }
    await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.REACT_APP_SPREADSHEET_ID,
    }, newRowRequestBody);

    // Update row values
    const valuesUpdateBody: gapi.client.sheets.BatchUpdateValuesRequest = {
        valueInputOption: 'USER_ENTERED',
        data: [{
            range: `expense!C2:H2`,
            values,
        }],
    }
    await gapi.client.sheets.spreadsheets.values.batchUpdate({ spreadsheetId: process.env.REACT_APP_SPREADSHEET_ID }, valuesUpdateBody)

    // copy paste converted to eur value
    const copyPasteCalculatedValue: gapi.client.sheets.BatchUpdateSpreadsheetRequest = {
        requests: [{
            copyPaste: {
                source: {
                    sheetId,
                    startRowIndex: 1,
                    endRowIndex: 2,
                    startColumnIndex: 1,
                    endColumnIndex: 2,
                },
                destination: {
                    sheetId,
                    startRowIndex: 1,
                    endRowIndex: 2,
                    startColumnIndex: 0,
                    endColumnIndex: 1,
                },
                pasteType: 'PASTE_VALUES',
            }
        }],
    }
    await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.REACT_APP_SPREADSHEET_ID,
    }, copyPasteCalculatedValue);
}