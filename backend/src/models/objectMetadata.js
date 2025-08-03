const mongoose = require('mongoose');
const { Schema } = mongoose;
const LOMSchema = require('./lommetadata').schema;

const ObjectMetadataSchema = new Schema({
  objectId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  lom: {
    type: LOMSchema,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ObjectMetadata', ObjectMetadataSchema);
