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

ObjectMetadataSchema.index({ 'lom.general.title': 'text' });
ObjectMetadataSchema.index({ 'lom.general.description': 'text' });
ObjectMetadataSchema.index({ 'lom.educational.description': 'text' });
ObjectMetadataSchema.index({ 'lom.rights.description': 'text' });
ObjectMetadataSchema.index({ 'lom.classification.description': 'text' });

ObjectMetadataSchema.index({ 'lom.general.keyword': 1 });
ObjectMetadataSchema.index({ 'lom.general.language': 1 });

ObjectMetadataSchema.index({ 'lom.lifecycle.version': 1 });
ObjectMetadataSchema.index({ 'lom.lifecycle.status': 1 });
ObjectMetadataSchema.index({ 'lom.lifecycle.contribute.role': 1 });
ObjectMetadataSchema.index({ 'lom.lifecycle.contribute.entity': 1 });
ObjectMetadataSchema.index({ 'lom.lifecycle.contribute.date': 1 });

ObjectMetadataSchema.index({ 'lom.technical.format': 1 });
ObjectMetadataSchema.index({ 'lom.technical.size': 1 });
ObjectMetadataSchema.index({ 'lom.technical.location': 1 });

ObjectMetadataSchema.index({ 'lom.educational.interactivityType': 1 });
ObjectMetadataSchema.index({ 'lom.educational.learningResourceType': 1 });
ObjectMetadataSchema.index({ 'lom.educational.intendedEndUserRole': 1 });
ObjectMetadataSchema.index({ 'lom.educational.context': 1 });
ObjectMetadataSchema.index({ 'lom.educational.typicalAgeRange': 1 });
ObjectMetadataSchema.index({ 'lom.educational.difficulty': 1 });
ObjectMetadataSchema.index({ 'lom.educational.typicalLearningTime': 1 });
ObjectMetadataSchema.index({ 'lom.educational.language': 1 });

ObjectMetadataSchema.index({ 'lom.rights.cost': 1 });
ObjectMetadataSchema.index({ 'lom.rights.copyrightAndOtherRestrictions': 1 });

ObjectMetadataSchema.index({ 'lom.classification.purpose': 1 });
ObjectMetadataSchema.index({ 'lom.classification.keyword': 1 });

ObjectMetadataSchema.index({ objectId: 1 }, { unique: true });
ObjectMetadataSchema.index({ 'metadata.general.language': 1 });
ObjectMetadataSchema.index({ 'metadata.general.keyword': 1 });
ObjectMetadataSchema.index({ 'metadata.educational.learningResourceType': 1 });
ObjectMetadataSchema.index({ 'metadata.educational.interactivityType': 1 });
ObjectMetadataSchema.index({ 'metadata.educational.context': 1 });
ObjectMetadataSchema.index({ 'metadata.educational.difficulty': 1 });
ObjectMetadataSchema.index({ 'metadata.rights.cost': 1 });

module.exports = mongoose.model('ObjectMetadata', ObjectMetadataSchema);

