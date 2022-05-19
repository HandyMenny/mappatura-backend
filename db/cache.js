const { createClient } = require("redis");
const client = createClient();

const cache = {
  initialize: async () => {
    client.on('error', (err) => console.log('Redis Client Error', err));
    try {
      await client.connect();
      console.log("connected to redis");
      await client.flushAll();
    } catch(err) {
      console.log(err);
    }
  },
  getOrQuery: async (key, expire, queryFunc) => {
    let json;
    try {
      json = await client.get(key);
    } catch(err) {
      console.log(err);
    }
    if (json) {
      client.expire(key, expire);
    } else {
      const data = await queryFunc();
      json = JSON.stringify(data);
      client.set(key, json, {
        EX: expire,
      });
    }
    return json;
  }
}

module.exports = cache;
