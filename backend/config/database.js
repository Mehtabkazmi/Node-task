const mongoose = require('mongoose');

exports.connectDatabase = () => {
    mongoose.connect(process.env.MONGO_URI)
        .then((conn) => console.log("databse connected"))
        .catch((e) => console.log(e))
}