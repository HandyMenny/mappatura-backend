const parse = require('csv-parse/sync');
const path = require("path");
const fs = require("fs");
const db = require(path.join(__dirname));
const { Egon, City } = require(path.join(__dirname, "Egon"));

const getHouseNumber = (houseNumber, fullAddress) => {
  const splitIdx = fullAddress.lastIndexOf(",");
  let number = fullAddress.substring(splitIdx + 1).split(/[ ]+/).slice(1);

  if(houseNumber === "0" && number.length === 1 && houseNumber !== number[0]) {
    /* houseNumber (0) is appended to number */
    number = `km. ${number[0]/10}`;
  } else {
   // Last element is houseNumber
   number.pop();
   if (number[0] !== "SNC") {
     // Add houseNumber at the beginning
     number.unshift(houseNumber);
   }
   number = number.join("/");
  }
  if (number == 0) {
    number = "SNC";
  }

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

const getHouseNumber1Giga = (number, barred, km) => {
    barred = barred.trim();
    km = km.trim();
    if(km.length > 0) {
        number = `km. ${parseInt(km)}`;
    } else if(barred.length > 0) {
        if (barred !== "SNC") {
            number = [number].concat(barred.split(/\s+/)).join("/");
        } else {
            number = barred;
        }
    }
    if (number == 0) {
      number = "SNC";
    }
    return number;
};

const getStreetWithHamlet1Giga = (street, hamlet) => {
    if (hamlet.length > 0) {
        return street + " - " + hamlet;
    }
    return street;
};

/*
 * 1st letter '' = bianco, g = grigio, n = nero
 * 2nd letter v = vhcn, '' or 'n' = no_vhcn
 * 3rd letter r = rame, w = fwa, f = fo
 *
 * (compact to reduce db size)
 */
const getCompactClass = (classString) => {
    switch (classString) {
        case "bianco":
        case "non_coperti":
            return "";
        case "grigio_novhcn_fwa":
            return "gnw";
        case "grigio_novhcn_rame":
            return "gnr";
        case "grigio_vhcn_fwa":
            return "gvw";
        case "grigio_vhcn_fo":
            return "gvf";
        case "grigio_vhcn_fo":
            return "gvf";
        case "nero_novhcn":
            return "n";
        case "nero_vhcn_fwa":
            return "nvw";
        case "nero_vhcn_fo":
            return "nvf";
        default:
            throw `invalid value:${classString}`;
    }
}

/*
 * 100 = NGA VHCN
 * 30 = NGA NO VHCN
 * 0 = NO NGA
 *
 */
const getSpeed = (catString) => {
  switch (catString) {
    case "NGA-VHCN":
      return 100;
    case "NGA":
      return 30;
    default:
      return 0;
  }
}

const cities = [];
let cityCounter = 0;
/*
   Generate and id for the given city and stores the city in the cities array
   The cities array will be used to import cities.
 */
const getCityId = (region, province, city) => {
    const procity = province + city;
    // Check if id already generated
    if(!(procity in cities)) {
        cities[procity] = {
           id: cityCounter++,
           region: region,
           province: province,
           name: city
       };
    }
    return cities[procity].id;
}

/* Return bando1Giga Winner
   1 = OF
   2 = TIM
   3 =
 */
const getWinner = (region) => {
  const of = ["CAMPANIA", "EMILIA-ROMAGNA", "FRIULI-VENEZIA GIULIA", "LAZIO", "LOMBARDIA", "PUGLIA", "SICILIA",
    "TOSCANA", "VENETO"];
  const tim = ["ABRUZZO", "BASILICATA", "CALABRIA", "LIGURIA", "MARCHE", "MOLISE", "PIEMONTE", "SARDEGNA", "UMBRIA",
    "VALLE D'AOSTA"];
  
  return of.includes(region) ? 1 : tim.includes(region) ? 2 : 3;
}

(async () => {
  await db.sync();
  // Disable journaling
  await db.query("PRAGMA journal_mode=OFF;");

  const chunkSize = 200000;
  var dirs = ["Consultazione2021", "Consultazione2021Bianche", "Bando1Giga", "Consultazione2020", "Consultazione2019", "Consultazione2017", "Consultazione2017Bianche"];

  // Import cities from db
  (await City.findAll()).forEach(it => {
    it.imported = true
    cities[it.province + it.name] = it;
    cityCounter = it.id + 1;
  });

  for (const dir of dirs) {
      const files = fs.readdirSync(path.join(__dirname, "..", `csv/${dir}`));

      console.log(`begin processing ${dir} CSV files...`);

      for (let file of files) {
          if (file == ".keep") {
              continue;
          }

          console.log(`begin reading of ${file}`);

          const readFile = fs.readFileSync(path.join(__dirname, "..", `csv/${dir}`, file));

          console.log("done");
          console.log(`begin parsing of ${file}`);

          const parsedRecords = parse(readFile, {
              skipEmptyLines: true,
              bom: true,
              delimiter: ";",
              fromLine: 2,
              trim: true,
              onRecord: (record) => {
                  if(dir === "Bando1Giga") {
                      return [
                          Number(record[0]),
                          getCityId(record[1], record[2], record[3]),
                          getStreetWithHamlet1Giga(record[6], record[4]),
                          getHouseNumber1Giga(record[7], record[8], record[9]),
                          getWinner(record[1])
                      ]
                  } else if (dir === "Consultazione2021Bianche") {
                      return [
                          Number(record[0]),
                          getCityId(record[1], record[2], record[3]),
                          record[4],
                          record[5],
                          null,
                          Number(record[6]),
                          Number(record[7]),
                      ];
                  } else if(dir === "Consultazione2020") {
                      return [
                          Number(record[0]),
                          getCityId(record[1], record[2].toUpperCase(), record[3]),
                          getStreetWithHamlet1Giga(record[5], record[4]),
                          getHouseNumber1Giga(record[6], record[7], record[8]),
                          getCompactClass(record[13]),
                          getCompactClass(record[14]),
                      ]
                  } else if(dir === "Consultazione2019") {
                    return [
                      Number(record[0]),
                      getCityId(record[1], record[2], record[3]),
                      getStreetWithHamlet1Giga(`${record[9]} ${record[10]}`.trim(), record[4]),
                      getHouseNumber1Giga(record[13], record[14], record[15].replace("KM.", "").replace(",", "")),
                      getSpeed(record[16]),
                      getSpeed(record[17]),
                    ]
                  } else if(dir === "Consultazione2017") {
                    return [
                      Number(record[0]),
                      getCityId(record[1], record[2], record[3]),
                      getStreetWithHamlet1Giga(`${record[10]} ${record[11]}`.trim(), record[4]),
                      getHouseNumber1Giga(record[14], record[15], record[16].replace("KM.", "").replace(",", "")),
                      Number(record[17]),
                    ]
                  } else if(dir === "Consultazione2017Bianche") {
                    return [
                      Number(record[0]),
                      getCityId(record[1], record[2], record[3]),
                      getStreetWithHamlet1Giga(`${record[9]} ${record[10]}`.trim(), record[4]),
                      getHouseNumber1Giga(record[13], record[14], record[15].replace("KM.", "").replace(",", "")),
                      Number(record[16]),
                    ]
                  } else {
                      return [
                          Number(record[0]),
                          getCityId(record[1], record[2], record[3]),
                          getStreetWithHamlet(record[4], record[6]),
                          getHouseNumber(record[5], record[6]),
                          record[7],
                          Number(record[8]),
                          Number(record[9]),
                      ];
                  }
              },
          });
          console.log("done");
          console.log(`begin writing ${file} to db`);

          // Import all cities - A bit naif but working
          await City.bulkCreate(
              Object.entries(cities).filter(([key, value]) => !value.imported).map(([key, value]) => {
                  // Set imported to true, to avoid re-importing
                  value.imported = true;
                  return value;
              })
          );

          for (let i = 0; i < parsedRecords.length; i += chunkSize) {
              if (dir === "Bando1Giga") {
                  await Egon.bulkCreate(
                      parsedRecords.slice(i, i + chunkSize).map((record) => ({
                          egon: record[0],
                          cityId: record[1],
                          street: record[2],
                          number: record[3],
                          bando1Giga: record[4]
                      })),
                      {
                          updateOnDuplicate: ["bando1Giga", "street", "number"],
                      }
                  );
              } else if(dir === "Consultazione2020") {
                  // rimini.csv has invalid egonids...
                  if (file == "rimini.csv") {
                    for (let j = i; j < i + chunkSize && j < parsedRecords.length; j++) {
                      const record = parsedRecords[j];
                      await Egon.update({
                        class19: record[4],
                        class22: record[5]
                      }, {
                        where: {cityId: record[1], street: record[2], number: record[3]},
                        validate: false
                      })
                    }
                  } else {
                    await Egon.bulkCreate(
                        parsedRecords.slice(i, i + chunkSize).map((record) => ({
                            egon: record[0],
                            cityId: record[1],
                            street: record[2],
                            number: record[3],
                            class19: record[4],
                            class22: record[5]
                        })),
                        {
                            updateOnDuplicate: ["class19", "class22"],
                        }
                    );
                  }
              } else if(dir === "Consultazione2019") {
                await Egon.bulkCreate(
                  parsedRecords.slice(i, i + chunkSize).map((record) => ({
                    egon: record[0],
                    cityId: record[1],
                    street: record[2],
                    number: record[3],
                    cat18: record[4],
                    cat21: record[5]
                  })),
                  {
                    updateOnDuplicate: ["cat18", "cat21"],
                  }
                );
              } else if(dir === "Consultazione2017" || dir === "Consultazione2017Bianche") {
                await Egon.bulkCreate(
                  parsedRecords.slice(i, i + chunkSize).map((record) => ({
                    egon: record[0],
                    cityId: record[1],
                    street: record[2],
                    number: record[3],
                    speed20: record[4],
                  })),
                  {
                    updateOnDuplicate: ["speed20"],
                  }
                );
              } else {
                  await Egon.bulkCreate(
                      parsedRecords.slice(i, i + chunkSize).map((record) => ({
                          egon: record[0],
                          cityId: record[1],
                          street: record[2],
                          number: record[3],
                          color: record[4],
                          peakSpeed: record[5],
                          below300Mbps: record[6],
                      })),
                  );
              }
          }

          console.log(`done processing ${file}`);
      }
      console.log(`done processing ${dir} CSV files`);
  }
  await db.query("VACUUM");
})();
