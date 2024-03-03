const pg = require("pg");
const express = require("express");
const client = new pg.Client(
  process.env.DATABASE_URL ||
    "postgres://localhost/the_acme_ice_cream_shop_flavors_db"
);
const app = express();
app.use(express.json());
app.use(require("morgan")("dev"));
app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
    SELECT * FROM flavors ORDER BY created_at DESC;
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (err) {
    next(err);
  }
});
app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
    INSERT INTO flavors (flavor_name, ranking, is_favorite)
    VALUES($1, $2, $3)
    RETURNING *;
    `;
    const response = await client.query(SQL, [
      req.body.flavor_name,
      req.body.ranking,
      req.body.is_favorite,
    ]);
    res.send(response.rows[0]);
  } catch (err) {
    next(err);
  }
});
app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
    UPDATE flavors
    SET flavor_name=$1, ranking=$2, updated_at=now(), is_favorite=$4
    WHERE id=$3 RETURNING *
  `;
    const response = await client.query(SQL, [
      req.body.flavor_name,
      req.body.ranking,
      req.params.id,
      req.body.is_favorite,
    ]);
    res.send(response.rows[0]);
  } catch (err) {
    next(err);
  }
});
app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
    DELETE FROM flavors 
    WHERE id=$1
    `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

const init = async () => {
  await client.connect();
  console.log("connected to database");
  let SQL = `
  DROP TABLE IF EXISTS flavors;
  CREATE TABLE flavors(
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    ranking INTEGER DEFAULT 3 NOT NULL,
    flavor_name VARCHAR(255) NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE
  );
  `;
  await client.query(SQL);
  console.log("tables created");
  SQL = `
  INSERT INTO flavors(flavor_name, ranking) VALUES('strawberry', 5);
  INSERT INTO flavors(flavor_name, ranking, is_favorite) VALUES('kiwi', 4, true);
  INSERT INTO flavors(flavor_name, ranking) VALUES('chocolate', 2);
`;
  await client.query(SQL);
  console.log("data seeded");
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
