const pool = require('../../config/db.config')

async function findUserByMsisdn(msisdn) {
        const [row] = await pool.query (
            'SELECT * FROM users WHERE msisdn = ? ',
            [msisdn]
        )
        return row[0]
}
module.exports = {
    findUserByMsisdn,
}