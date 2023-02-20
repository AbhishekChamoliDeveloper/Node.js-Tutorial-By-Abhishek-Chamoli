const xlsx = require("xlsx");
const path = require("path");

const userFilePath = path.join(__dirname, "users.xlsx");

exports.loadUsers = () => {
  const workbook = xlsx.readFile(userFilePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const users = xlsx.utils.sheet_to_json(sheet);
  return users;
};

exports.writeUsers = (users) => {
  const sheet = xlsx.utils.json_to_sheet(users);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, sheet, "Users");
  xlsx.writeFile(workbook, userFilePath);
};
