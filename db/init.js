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

const getStreetWithHamlet = (street, address) => {
  const splitIdx = address.indexOf(',');
  const streetStart = address.indexOf(street);
  if(splitIdx < streetStart) {
    let hamlet = address.substring(0, splitIdx).trim();
    if (hamlet.length > 0) {
      return street + " - " + hamlet;
    }
  }
  return street;
};

(async () => {
  await db.sync();

  const chunkSize = 100000;
  const files = fs.readdirSync(path.join(__dirname, "..", "csv"));

  console.log("begin processing CSV files...");

  for (let file of files) {
    if (file == ".keep") {
      continue;
    }

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
          getStreetWithHamlet(record[4], record[6]),
          getHouseNumber(record[6]),
          record[7],
          Number(record[8]),
          Number(record[9]),
        ];
      },
    });

    console.log("done");
    console.log(`begin writing ${file} to db`);

    for(let i = 0; i < parsedRecords.length; i += chunkSize) {
      await Egon.bulkCreate(
          parsedRecords.slice(i, i + chunkSize).map((record) => ({
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
    }

    console.log(`done processing ${file}`);
  }
  console.log("done processing CSV files");
})();
