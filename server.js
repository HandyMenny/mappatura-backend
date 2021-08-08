const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { Sequelize, Op } = require("sequelize");
const db = require("./db");
const { Egon } = require("./db/Egon");
const regions = require("./regions.json");
const { handleError } = require("./error");

(async () => {
  const app = express();

  await db.sync();
  console.log("connected to db");

  app.use(express.json());
  app.use(morgan("common"));
  app.use(cors());
  app.use(helmet());
  app.set("trust proxy", 1);

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
      handleError("could not find any provinces for the provided region", res);
    }
  });

  // Cities query (by province).
  app.get("/:province/cities", async (req, res) => {
    try {
      const cities = await Egon.findAll({
        attributes: ["city"],
        group: ["city"],
        where: { province: req.params.province },
      });

      res.json(cities.map((obj) => obj.city));
    } catch (error) {
      handleError(
        error.message || "error retrieving cities for the provided province",
        res,
      );
    }
  });

  // Streets query (by province and city).
  // Slicing is done on client (for performance reasons).
  app.get("/:province/:city/streets", async (req, res) => {
    try {
      const { province, city } = req.params;

      const streets = await Egon.findAll({
        where: { province, city },
        attributes: ["street"],
        group: ["street"],
      });

      res.json(streets.map((obj) => obj.street));
    } catch (error) {
      handleError(
        error.message || "error retrieving streets for the provided city",
        res,
      );
    }
  });

  // Numbers query (by province, city, street)
  app.get("/:province/:city/:street/numbers", async (req, res) => {
    try {
      const { province, city, street } = req.params;
      const numbers = await Egon.findAll({
        where: { province, city, street },
        attributes: ["number", "egon"],
      });

      res.json(numbers);
    } catch (error) {
      handleError(error.message || "error retrieving numbers for this street");
    }
  });

  // Final query (egon data).
  app.get("/egon", async (req, res) => {
    try {
      if (!req.query.id) {
        throw new Error("you must provide the egon id");
      }

      const data = await Egon.findOne({
        where: { egon: req.query.id },
      });

      if (!data) {
        throw new Error("no data available for this egon");
      }

      res.json(data);
    } catch (error) {
      handleError(
        error.message || "error retrieving streets for the provided city",
        res,
      );
    }
  });

  app.get("*", (req, res) => {
    res.status(404).json({ error: "route not found" });
  });

  app.listen(5000, () => console.log("server started on port 5000"));
})();
