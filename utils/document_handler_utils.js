import axios from "axios";
import { TELEGRAM_API_BASEURL } from "./constants.js";
import { require } from "./utils.js";
import { TELEGRAM_BOT_TOKEN } from "./config.js";
const XLSX = require("xlsx");
import moment from "moment";

// Reference 1: https://stackoverflow.com/a/55082618
// Reference 2: https://www.npmjs.com/package/xlsx
export const getCsvStringFromXls = (xlsFileName, sheetName) => {
  const workbook = XLSX.readFile(xlsFileName);
  const worksheet = workbook.Sheets[sheetName];
  const csv = XLSX.utils.sheet_to_csv(worksheet, { bookType: "csv" });
  return csv;
};

export const getCsvFileName = (fileName) => {
  const dotIndex = fileName.lastIndexOf(".");
  return fileName.substring(0, dotIndex) + ".csv";
};

/**
 *
 * @param {*} csv
 * @returns a list of strings (each string is a line)
 */
export const getFilteredCsvLines = (csv) => {
  const lines = csv.split("\n");
  const filteredLines = [];

  // Skip all lines before reaching dotted lines
  let i = 0;
  while (i < lines.length) {
    if (lines[i].startsWith("**")) {
      break;
    }
    i++;
  }

  filteredLines.push(lines[++i]);
  i += 2;

  while (i < lines.length) {
    if (lines[i].startsWith("****")) break;
    filteredLines.push(lines[i]);
    i++;
  }

  return filteredLines.slice(0, filteredLines.length - 1);
};

export const getFileData = async (filePath) => {
  const { data: fileData } = await axios.get(
    `${TELEGRAM_API_BASEURL}/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`,
    {
      responseType: "arraybuffer",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/x-msexcel",
      },
    }
  );
  return fileData;
};

// Reference 1: https://stackoverflow.com/a/50220546
// Reference 2: https://stackoverflow.com/a/60468824
export const getFilePath = async (fileId) => {
  const { data: filePathData } = await axios.get(
    `${TELEGRAM_API_BASEURL}/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
  );
  if (!filePathData.ok) throw new Error("Error getting file path");
  const {
    result: { file_path: filePath },
  } = filePathData;
  return filePath;
};

export const getReplyMessage = (filteredCsvLines) => {
  const transactions = filteredCsvLines.map((line) => line.split(","));
  const today = moment().format("DD/MM/YY");
  const todayTransactions = transactions.filter((row) => row[0] === today);

  const transactionObjs = [];
  for (const transaction of todayTransactions) {
    const date = transaction[0];
    const desc = transaction[1];
    const refNum = transaction[2];
    const withdrawal = Number(transaction[4]);
    const deposit = Number(transaction[5]);
    transactionObjs.push({ date, desc, refNum, withdrawal, deposit });
  }

  let message = `Summary for ${today}\n\n`;
  const depositTransactions = transactionObjs.filter((o) => o.withdrawal === 0);
  message += "Deposits:\n";
  if (depositTransactions.length === 0) {
    message += "No deposits\n";
  } else {
    for (let i = 0; i < depositTransactions.length; i++) {
      const { desc, deposit } = depositTransactions[i];
      message += `${i + 1}. ${deposit.toFixed(2)}/- ${desc}\n`;
    }
  }
  message += "\n";

  const withdrawalTransactions = transactionObjs.filter((o) => o.deposit === 0);
  message += "Withdrawals:\n";
  if (withdrawalTransactions.length === 0) {
    message += "No withdrawals\n";
  } else {
    for (let i = 0; i < withdrawalTransactions.length; i++) {
      const { desc, withdrawal } = withdrawalTransactions[i];
      message += `${i + 1}. ${withdrawal.toFixed(2)}/- ${desc}\n`;
    }
  }
  message += "\n";

  const totalDeposit = depositTransactions.reduce(
    (sum, { deposit }) => sum + deposit,
    0
  );
  const totalWithdrawal = withdrawalTransactions.reduce(
    (sum, { withdrawal }) => sum + withdrawal,
    0
  );

  message += `Total Deposit: ${totalDeposit.toFixed(2)}/-\n`;
  message += `Total Withdrawal: ${totalWithdrawal.toFixed(2)}/-\n`;

  return message;
};
