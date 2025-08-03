require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;


mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB conectado em', uri))
  .catch(err => {
    console.error('Erro ao conectar no MongoDB:', err);
    process.exit(1);
  });

module.exports = mongoose;

