const { parse } = require('csv-parse/sync');
const path = require("path");
const fs = require("fs");
const db = require(path.join(__dirname));
const { Egon, City } = require(path.join(__dirname, "Egon"));

const getHouseNumber = (houseNumber, fullAddress) => {
  const splitIdx = fullAddress.lastIndexOf(",");
  let number = fullAddress.substring(splitIdx + 1).split(/[ ]+/).slice(1);

  if(houseNumber === "0" && number.length === 1 && houseNumber !== number[0]) {
    /* houseNumber (0) is appended to number and unit is meters */
    number = `km. ${number[0]/10000}`;
  } else {
   // Last element is houseNumber
   number.pop();
   if (number[0] !== "SNC") {
     // Add houseNumber at the beginning
     number.unshift(houseNumber);
   }
   number = number.join("/");
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


const getStreetConnetti = (fullAddress) => {
  const splitted = fullAddress.split(",");
  
  return splitted[0].trim();
}


const getHouseNumberConnetti = (fullAddress) => {
  // address, houseNumber, km/barred
  const splitted = fullAddress.split(",");

  if (splitted.length < 2) return "SNC";

  let houseNumber = splitted[1].trim();

  if (splitted.length < 3) return houseNumber;

  const exponent = splitted[2].trim().split(/\s+/)

  if (exponent[0] === "SNC") {
    // snc case
    return "SNC";
  }

  if (houseNumber === "0" && exponent.length === 1) {
    // km case
    houseNumber = `km. ${exponent[0]/1000}`;
  } else { 
    // barred case
    exponent.unshift(houseNumber);
    // join 
    houseNumber = exponent.join("/");
 }

  return houseNumber;
};

const getHouseNumberSplit = (number, barred, km) => {
    barred = barred.trim();
    km = parseFloat(km)
    if(!Number.isNaN(km) && km > 0) {
        number = `km. ${km}`;
    } else if(barred.length > 0) {
        if (barred !== "SNC") {
            number = [number].concat(barred.split(/\s+/)).join("/");
        } else {
            number = barred;
        }
    }
    return number;
};

const getStreetWithHamletSplit = (street, hamlet) => {
    if (hamlet.length > 0) {
        return street + " - " + hamlet;
    }
    return street;
};

const normalizeRegion = (region) => {
  region = region.trim().toUpperCase();
  
  switch (region) {
    case "BOLZANO" :
    case "TRENTO":
      return "TRENTINO-ALTO ADIGE";
    default:
      return region;
  }
}

const normalizeProvince = (province) => {
  province = province.trim().toUpperCase().replaceAll("-", " ");
  
  switch (province) {
    case "REGGIO NELL'EMILIA":
      return "REGGIO EMILIA";
    case "REGGIO DI CALABRIA":
      return "REGGIO CALABRIA";
    default:
      return province;
  }
}

const normalizeCity = (city) => {
  city = city.trim().toUpperCase().replaceAll("-", " ").replaceAll("  ", " ");

  switch (city) {
    case "GALTELLI":
      return "GALTELLI'";
    case "REGGIO DI CALABRIA":
      return "REGGIO CALABRIA";
    case "REGGIO NELL'EMILIA":
      return "REGGIO EMILIA";
    case "COSTERMANO DEL GARDA":
      return "COSTERMANO SUL GARDA";
    default:
      return city;
  }
}

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

const getWalkinStatus = (status) => {
  switch (status) {
    case "Esistente":
      return 1;
    case "Inesistente":
      return 2;
    case "Escluso privo di UI":
      return 3;
    case "Escluso per 10%": 
      return 4;
    case "Escluso perché già coperto": 
      return 5;
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
    region = normalizeRegion(region);
    province = normalizeProvince(province);
    city = normalizeCity(city);

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
    "VALLE D'AOSTA", "TRENTINO-ALTO ADIGE"];
  
  return of.includes(region) ? 1 : tim.includes(region) ? 2 : 3;
}

(async () => {
  await db.sync();
  // Disable journaling
  await db.query("PRAGMA journal_mode=OFF;");

  const chunkSize = 200000;
  var dirs = ["Bando1Giga", "QuestionarioConsultazione2024", "Consultazione2021", "Consultazione2020", "Consultazione2019", "Consultazione2017", "Consultazione2017Bianche", "OpenDataConnettiHistory", "OpenDataConnettiCurrent", "Consultazione2021Bianche"];

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

          const delimiter = dir.startsWith("OpenDataConnetti") ? "," : ";";

          const parsedRecords = parse(readFile, {
              skipEmptyLines: true,
              bom: true,
              delimiter: delimiter,
              fromLine: 2,
              trim: true,
              onRecord: (record) => {
                  if(dir === "Bando1Giga") {
                      return [
                          Number(record[0]),
                          getCityId(record[1], record[2], record[3]),
                          getStreetWithHamletSplit(record[6], record[4]),
                          getHouseNumberSplit(record[7], record[8], record[9]/1000),
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
                          getStreetWithHamletSplit(record[5], record[4]),
                          getHouseNumberSplit(record[6], record[7], record[8]),
                          getCompactClass(record[13]),
                          getCompactClass(record[14]),
                      ]
                  } else if(dir === "Consultazione2019") {
                    return [
                      Number(record[0]),
                      getCityId(record[1], record[2], record[3]),
                      getStreetWithHamletSplit(`${record[9]} ${record[10]}`.trim(), record[4]),
                      getHouseNumberSplit(record[13], record[14], record[15].replace("KM.", "").replace(",", ".")),
                      getSpeed(record[16]),
                      getSpeed(record[17]),
                    ]
                  } else if(dir === "Consultazione2017") {
                    return [
                      Number(record[0]),
                      getCityId(record[1], record[2], record[3]),
                      getStreetWithHamletSplit(`${record[10]} ${record[11]}`.trim(), record[4]),
                      getHouseNumberSplit(record[14], record[15], record[16].replace("KM.", "").replace(",", ".")),
                      Number(record[17]),
                    ]
                  } else if(dir === "Consultazione2017Bianche") {
                    return [
                      Number(record[0]),
                      getCityId(record[1], record[2], record[3]),
                      getStreetWithHamletSplit(`${record[9]} ${record[10]}`.trim(), record[4]),
                      getHouseNumberSplit(record[13], record[14], record[15].replace("KM.", "").replace(",", ".")),
                      Number(record[16]),
                    ]
                  } else if (dir.startsWith("OpenDataConnetti")) {
                    const piano = record[0]
                    if (piano != "piano-italia-1-giga") return [];

                    let walkinStatus = getWalkinStatus(record[11]);
                    // current has walink status +10, so we can differentiate them from history
                    if (dir.startsWith("OpenDataConnettiCurrent")) walkinStatus += 10;

                    return [
                      Number(record[1]),
                      getCityId(record[3], record[4], record[5]),
                      getStreetConnetti(record[9]),
                      getHouseNumberConnetti(record[9]),
                      walkinStatus
                    ];
                  } else if (dir === "QuestionarioConsultazione2024") {
                    return [
                      Number(record[0]),
                      getCityId(record[1], record[2], record[3]),
                      getStreetWithHamletSplit(record[6], record[4]),
                      getHouseNumberSplit(record[7], record[8], (record[9].replace("KM", ""))/1000),
                      3 // 3 = in consultazione civico prossimità
                    ];
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
                          status_p1g: record[4]
                      })),
                  );
              } else if(dir === "Consultazione2020") {
                  // rimini.csv has invalid egonids...
                  if (file == "rimini.csv") {
                    for (let j = i; j < i + chunkSize && j < parsedRecords.length; j++) {
                      const record = parsedRecords[j];
                      await Egon.update({
                        class19_2020: record[4],
                        class22_2020: record[5]
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
                            class19_2020: record[4],
                            class22_2020: record[5]
                        })),
                        {
                            updateOnDuplicate: ["class19_2020", "class22_2020"],
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
                    cat18_2019: record[4],
                    cat21_2019: record[5]
                  })),
                  {
                    updateOnDuplicate: ["cat18_2019", "cat21_2019"],
                  }
                );
              } else if(dir === "Consultazione2017" || dir === "Consultazione2017Bianche") {
                await Egon.bulkCreate(
                  parsedRecords.slice(i, i + chunkSize).map((record) => ({
                    egon: record[0],
                    cityId: record[1],
                    street: record[2],
                    number: record[3],
                    speed20_2017: record[4],
                  })),
                  {
                    updateOnDuplicate: ["speed20_2017"],
                  }
                );
              } else if (dir.startsWith("OpenDataConnetti")) {
                await Egon.bulkCreate(
                  parsedRecords.slice(i, i + chunkSize)
                  .filter((record) => record.length > 0)
                  .map((record) => ({
                    egon: record[0],
                    cityId: record[1],
                    street: record[2],
                    number: record[3],
                    walkin_connetti: record[4],
                  })),
                  {
                    updateOnDuplicate: ["walkin_connetti"],
                  }
                );
              } else if (dir === "QuestionarioConsultazione2024") {
                await Egon.bulkCreate(
                  parsedRecords.slice(i, i + chunkSize).map((record) => ({
                    egon: record[0],
                    cityId: record[1],
                    street: record[2],
                    number: record[3],
                    status_p1g: record[4]
                  })), {
                    updateOnDuplicate: ["status_p1g"]
                  }
                );
              } else {
                  await Egon.bulkCreate(
                      parsedRecords.slice(i, i + chunkSize).map((record) => ({
                          egon: record[0],
                          cityId: record[1],
                          street: record[2],
                          number: record[3],
                          color_2021: record[4],
                          peakSpeed_2021: record[5],
                          below300Mbps_2021: record[6],
                      })),
                      {
                          updateOnDuplicate: ["color_2021", "peakSpeed_2021", "below300Mbps_2021"],
                      }
                  );
              }
          }

          console.log(`done processing ${file}`);
      }
      console.log(`done processing ${dir} CSV files`);
  }
  await db.query("VACUUM");
})();
