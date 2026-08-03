const Queue = require("bull")
const RediConfig = require("../config/redis.config")


const reelTranscodeQueue = new Queue("reel-transcode", {
    redis: RediConfig
})


module.exports = reelTranscodeQueue