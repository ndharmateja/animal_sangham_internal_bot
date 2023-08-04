import { require } from "../utils/utils.js";
const fs = require("fs").promises;
import { XLS_MIME_TYPE } from "../utils/constants.js";
import {
  getCsvFileName,
  getCsvStringFromXls,
  getFileData,
  getFilePath,
  getFilteredCsvLines,
  getReplyMessage,
} from "../utils/document_handler_utils.js";

export const startHandler = (ctx) =>
  ctx.reply(
    "Download statement from HDFC App in 'XLS' format and send that document as a message here to get today's summary"
  );

export const documentHandler = async (ctx) => {
  try {
    const {
      document: { file_name: fileName, mime_type: mimeType, file_id: fileId },
    } = ctx.message;
    const replyMessage = await saveXlsDocumentAsCsv(fileName, mimeType, fileId);
    console.log("to reply: " + replyMessage);
    ctx.reply(replyMessage);
  } catch (error) {
    ctx.reply(`Error: ${error.message}`);
  }
};

const saveXlsDocumentAsCsv = async (xlsFileName, mimeType, fileId) => {
  // Check mime type
  if (mimeType !== XLS_MIME_TYPE) {
    throw new Error("Only xls documents accepted for now.");
  }

  // Get file path
  const filePath = await getFilePath(fileId);
  console.log(`Got the file path: ${filePath}`);

  // Get file data
  const fileData = await getFileData(filePath);
  console.log("Got the file data");

  // Write to xls file
  await fs.writeFile(xlsFileName, fileData);
  console.log(`${xlsFileName} saved`);

  // Get csv string from the xls file
  const sheetName = "Sheet 1";
  const csv = getCsvStringFromXls(xlsFileName, sheetName);

  // Filter only transaction rows
  const filteredCsv = getFilteredCsvLines(csv);
  console.log("Filtered transaction rows");

  // Get message to respond
  const replyMessage = getReplyMessage(filteredCsv);

  // save filtered rows as csv
  const csvFileName = getCsvFileName(xlsFileName);
  await fs.writeFile(csvFileName, filteredCsv);
  console.log(`${csvFileName} saved`);

  // delete xls and csv files
  await fs.unlink(csvFileName);
  await fs.unlink(xlsFileName);
  console.log(`Deleted ${xlsFileName} and ${csvFileName}`);

  // Return reply
  return replyMessage;
};
