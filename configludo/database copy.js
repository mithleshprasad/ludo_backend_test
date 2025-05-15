module.exports = function (mongoose) {
    mongoose.set('useFindAndModify', false);
    mongoose
        .connect(process.env.CONNECTION_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: 'a3adda007',
        })
        .then(() => {
            console.log('MongoDB Connected…');
        })
        .catch(err => console.error(err));
};
