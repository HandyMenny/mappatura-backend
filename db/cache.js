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
    let json, data;
    try {
      json = await client.get(key);
    } catch(err) {
      console.log(err);
    }
    if (json) {
      data = JSON.parse(json);
      client.expire(key, expire);
    } else {
      data = await queryFunc();
      client.set(key, JSON.stringify(data), {
        EX: expire,
      });
    }
    return data;
  }
}

module.exports = cache;
