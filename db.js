var db = process.env.DB_PORT_27017_TCP_ADDR || 'mongodb://localhost/testdb';
module.exports = {
    url: db
};
