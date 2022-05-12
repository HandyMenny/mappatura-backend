const express = require("express");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const listEndpoints = require("express-list-endpoints");
const db = require("./db");
const { Egon, City } = require("./db/Egon");
const regions = require("./regions.json");
const { HTTPError, handleError } = require("./error");

(async () => {
  const app = express();

  await db.sync();
  console.log("connected to db");

  app.use(express.json());
  app.use(morgan("tiny"));
  app.use(cors());
  app.use(helmet());
  app.set("trust proxy", 1);
  app.use(
    rateLimit({
      windowMs: 10 * 60 * 1000,
      max: 100,
      handler: (req, res) => handleError(429, "too many requests", res),
    })
  );

  // Regions query.
  app.get("/regions", (req, res) => {
    res.json(Object.keys(regions));
  });

  // Provinces query (by region):
  app.get("/:region/provinces", (req, res) => {
    try {
      const provinces = regions[req.params.region].provinces;
      res.json(provinces);
    } catch (_) {
      handleError(
        404,
        "could not find any provinces for the provided region",
        res
      );
    }
  });

  // Cities query (by province).
  app.get("/:province/cities", async (req, res) => {
    try {
      const cities = await City.findAll({
        attributes: ["name"],
        where: { province: req.params.province },
      });

      res.json(cities.map((obj) => obj.name));
    } catch (error) {
      handleError(
        500,
        "error retrieving cities for the provided province",
        res
      );
    }
  });

  // Streets query (by province and city).
  // Slicing is done on client (for performance reasons).
  app.get("/:province/:city/streets", async (req, res) => {
    try {
      const { province, city } = req.params;

      const streets = await Egon.findAll({
        attributes: ["street"],
        group: ["street"],
        include: {
          attributes: [],
          model: City,
          where: { province, name: city}
        }
      });

      res.json(streets.map((obj) => obj.street));
    } catch (error) {
      handleError(500, "error retrieving streets for the provided city", res);
    }
  });

  // Numbers query (by province, city, street)
  app.get("/:province/:city/:street/numbers", async (req, res) => {
    try {
      const { province, city, street } = req.params;
      let numbers = await Egon.findAll({
        where: { street },
        attributes: ["number", "egon"],
        include: {
          attributes: [],
          model: City,
          where: {province, name: city}
        }
      });

      // Sort numbers.
      numbers
        .sort((a, b) => {
          if (a.number === "SNC") {
            return -1;
          }
          if (b.number === "SNC") {
            return 1;
          }
          return (
            a.number.length - b.number.length ||
            a.number.localeCompare(b.number)
          );
        })
        .sort((a, b) => {
          const aNum = Number(a.number.split("/")[0]);
          const bNum = Number(b.number.split("/")[0]);

          return aNum - bNum;
        });

      res.json(numbers);
    } catch (error) {
      handleError(500, "error retrieving numbers for this street", res);
    }
  });

  // Final query (egon data).
  app.get("/egon", async (req, res) => {
    try {
      if (!req.query.id) {
        throw new HTTPError(400, "you must provide the egon id");
      }

      const data = await Egon.findOne({
        where: { egon: req.query.id },
      });

      if (!data) {
        throw new HTTPError(404, "no data available for this egon");
      }

      res.json(data);
    } catch (error) {
      handleError(
        error.statusCode || 500,
        error.message || "error retrieving streets for the provided city",
        res
      );
    }
  });

  app.get("/", (req, res) => {
    const endpoints = listEndpoints(app).flatMap(({ path, methods }) =>
      !(path === "*" || path === "/")
        ? {
            path,
            methods,
            query: path === "/egon" ? ["id"] : undefined,
          }
        : []
    );

    res.json(endpoints);
  });

  // Catch all errors.
  app.get("*", (req, res) => {
    res.status(404).json({ error: "route not found" });
  });

  app.listen(5000, () => console.log("server started on port 5000"));
})();
