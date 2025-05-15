module.exports = function (mongoose) {
    // Disable useFindAndModify deprecation warning (it was deprecated in Mongoose 5.7)
    mongoose.set('useFindAndModify', false);

    // Establish MongoDB connection
    mongoose
        .connect(process.env.CONNECTION_URI, {
            useNewUrlParser: true, // Parses the connection string correctly
            useUnifiedTopology: true, // Avoids legacy connection handling
            dbName: 'a3adda007', // Ensure you're connecting to the correct DB
        })
        .then(() => {
            console.log('MongoDB Connected...');
        })
        .catch(err => {
            console.error('MongoDB connection error:', err);
        });
};
