const parse = require("csv-parse/lib/sync");
const path = require("path");
const fs = require("fs");
const db = require(path.join(__dirname));
const { Egon } = require(path.join(__dirname, "Egon"));

const getHouseNumber = (address) => {
  const splitIdx = address.lastIndexOf(",");
  let number = address.substring(splitIdx + 1);
  number = number.split(/[ ]+/).slice(1).reverse();
  if (number[1] === "SNC") {
    number.shift();
  }

  number = number.join("/");

  return number;
};

(async () => {
  await db.sync();

  const files = fs.readdirSync(path.join(__dirname, "..", "csv"));

  console.log("begin processing CSV files...");

  for (let file of files) {
    console.log(`begin reading of ${file}`);

    const readFile = fs.readFileSync(path.join(__dirname, "..", "csv", file));

    console.log("done");
    console.log(`begin parsing of ${file}`);

    const parsedRecords = parse(readFile, {
      skipEmptyLines: true,
      bom: true,
      delimiter: ";",
      fromLine: 2,
      onRecord: (record) => {
        return [
          Number(record[0]),
          record[1],
          record[2],
          record[3],
          record[4],
          getHouseNumber(record[6]),
          record[7],
          Number(record[8]),
          Number(record[9]),
        ];
      },
    });

    console.log("done");
    console.log(`begin writing ${file} to db`);

    await Egon.bulkCreate(
      parsedRecords.map((record) => ({
        egon: record[0],
        region: record[1],
        province: record[2],
        city: record[3],
        street: record[4],
        number: record[5],
        color: record[6],
        peakSpeed: record[7],
        below300Mbps: record[8],
      })),
    );

    console.log(`done processing ${file}`);
  }
  console.log("done processing CSV files");
})();
