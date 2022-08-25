const express = require("express");
const mongoose = require("mongoose");
const { HOST, PORT, MONGO_IP, MONGO_PORT, MONGO_USER, MONGO_PASS, REDIS_URL, REDIS_PORT, SESSION_SECRET } = require("./config.js");
const cors = require("cors")

const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");

const redis = require("redis");
const redisURL = `redis://${REDIS_URL}:${REDIS_PORT}`
const session = require("express-session");
let RedisStore = require("connect-redis")(session);

/**
 * connect redis
 */
let redisClient = redis.createClient({
    url: redisURL,
    legacyMode: true
});
(async () => {
    await redisClient.connect();
})();
redisClient.on('connect', () => console.log('::> Redis Client to connected Successfully'));
redisClient.on('error', (err) => console.log('<:: failed redisClient Error', err));

const app = express();
/**
 * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
 * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
 */
const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASS}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`

const connectWithRetry = () => {
    mongoose
        .connect(mongoURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        })
        .then(() => { console.log("::> Mongoose to connected successfully"); })
        .catch((e) => {
            console.log(e)
            setTimeout(connectWithRetry, 5000)
        });
}

connectWithRetry();

app.enable("trust proxy");
app.use(cors({}))
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    cookie: {
        secure: false,
        resave: false,
        saveUninitialized: false,
        httpOnly: true,
        maxAge: 30000,
    },
}));

app.use(express.json());

app.get("/api/v1", (req, res) => {
    res.send("<h2>HI There!!!</h2>");
});

// localhost:3000/posts
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter)
app.listen(PORT, () => console.log(`::> lisning on http://${HOST}:${PORT} ...`));