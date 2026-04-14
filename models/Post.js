const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  // This is the link to the User model
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

PostSchema.virtual('summary').get(function() {
  if (!this.content) return '';
  return this.content.length > 50 ? this.content.substring(0, 50) + '...' : this.content;
});

module.exports = mongoose.model('Post', PostSchema);
