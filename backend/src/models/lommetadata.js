const mongoose = require('mongoose');
const { Schema } = mongoose;


const LOMSchema = new Schema({
  general: {
    title:        { type: String, trim: true },
    description:  { type: String, trim: true },
    keyword:      [String],
    language:     { type: String, default: 'portuguese' },
  },
  lifecycle: {
    version:      { type: String },
    status:       { type: String },         
    contribute:   [{ role: String, entity: String, date: Date }],
  },
  technical: {
    format:       { type: String },      
    size:         { type: Number },         
    location:     { type: String },   
  },
  educational: {
    interactivityType:      { type: String }, 
    learningResourceType:   { type: String }, 
    intendedEndUserRole:    { type: String }, 
    context:                { type: String }, 
    typicalAgeRange:        { type: String }, 
    difficulty:             { type: String },
    typicalLearningTime:    { type: String },
    description:            { type: String },
    language:               { type: String },
  },
  rights: {
    cost:        { type: String },
    copyrightAndOtherRestrictions: { type: String },
    description: { type: String },
  },
  classification: {
    purpose:      { type: String },
    description:  { type: String },
    keyword:      [String],
  },
}, { timestamps: true });

module.exports = mongoose.model('LOMMetadata', LOMSchema);
