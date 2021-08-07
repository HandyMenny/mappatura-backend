module.exports = {
  apps: [
    {
      name: "mappatura2021-backend",
      script: "npm start",
      autorestart: true,
      max_restarts: 50,
      watch: false,
    },
  ],
  deploy: {
    production: {
      user: "theedoran",
      host: "23.88.35.144",
      key: "deploy.key",
      ref: "origin/main",
      repo: "git@github.com:theedoran/mappatura2021-backend.git",
      path: "/home/theedoran/mappatura2021-backend",
      "post-deploy":
        "npm i && pm2 reload ecosystem.config.js --env production && pm2 save && git checkout package-lock.json",
      env: {
        NODE_ENV: "production",
      },
    },
  },
};
