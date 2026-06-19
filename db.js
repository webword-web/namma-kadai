const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let useFallback = false;
let isConnecting = true;

const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Simple JSON Database implementation matching Mongoose operations
class JSONModel {
  constructor(filename) {
    this.filepath = path.join(DB_DIR, filename);
    if (!fs.existsSync(this.filepath)) {
      fs.writeFileSync(this.filepath, JSON.stringify([], null, 2));
    }
  }

  read() {
    try {
      const data = fs.readFileSync(this.filepath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading JSON file:', err);
      return [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filepath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error writing JSON file:', err);
    }
  }

  async find(query = {}) {
    let items = this.read();
    return items.filter(item => {
      for (let key in query) {
        // Simple key-value matching
        if (query[key] && typeof query[key] === 'object' && query[key].$regex) {
          const regex = new RegExp(query[key].$regex, 'i');
          if (!regex.test(item[key])) return false;
        } else if (item[key] !== query[key]) {
          // Handle missing boolean values correctly
          if (query[key] === false && !item[key]) {
            continue;
          }
          return false;
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const items = await this.find(query);
    return items.length > 0 ? items[0] : null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(data) {
    const items = this.read();
    const newItem = {
      _id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      ...data
    };
    items.push(newItem);
    this.write(items);
    return newItem;
  }

  async insertMany(array) {
    const items = this.read();
    const newItems = array.map(item => ({
      _id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      ...item
    }));
    items.push(...newItems);
    this.write(items);
    return newItems;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const items = this.read();
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;
    
    // Handle mongoose update format (e.g. { $set: ... } or raw updates)
    const rawUpdate = update.$set ? update.$set : update;
    items[index] = { ...items[index], ...rawUpdate, updatedAt: new Date().toISOString() };
    this.write(items);
    return items[index];
  }

  async deleteMany(query = {}) {
    let items = this.read();
    const originalLength = items.length;
    items = items.filter(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return true;
      }
      return false;
    });
    this.write(items);
    return { deletedCount: originalLength - items.length };
  }

  async countDocuments(query = {}) {
    const items = await this.find(query);
    return items.length;
  }
}

// Instantiate Fallback Models
const fallbackModels = {
  Product: new JSONModel('products.json'),
  Order: new JSONModel('orders.json'),
  User: new JSONModel('users.json'),
  Review: new JSONModel('reviews.json'),
  Theme: new JSONModel('theme.json')
};

// Define Mongoose Schemas (will be used if MongoDB connects)
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  featured: { type: Boolean, default: false },
  bestSeller: { type: Boolean, default: false },
  offer: { type: String, default: '' },
  stockQuantity: { type: Number, default: 0 },
  stockStatus: { type: String, default: 'In Stock' }, // In Stock, Low Stock, Out of Stock
  createdAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
});

const OrderSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  alternativeMobile: { type: String },
  deliveryAddress: { type: String, required: true },
  landmark: { type: String },
  villageArea: { type: String, required: true },
  pincode: { type: String, required: true },
  specialInstructions: { type: String },
  items: [{
    productId: String,
    name: String,
    category: String,
    price: Number,
    quantity: Number,
    unit: String,
    image: String
  }],
  totalItems: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  deliveryCharge: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  status: { type: String, default: 'Pending' }, // Pending, Confirmed, Packed, Out For Delivery, Delivered
  createdAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
});

const ReviewSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  rating: { type: Number, required: true },
  message: { type: String, required: true },
  status: { type: String, default: 'Pending' }, // Pending, Approved, Hidden
  createdAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
});

const ThemeSchema = new mongoose.Schema({
  primaryColor: { type: String, default: '#2e7d32' },
  secondaryColor: { type: String, default: '#4caf50' },
  headerColor: { type: String, default: '#ffffff' },
  footerColor: { type: String, default: '#212529' },
  backgroundColor: { type: String, default: '#f8f9fa' },
  textColor: { type: String, default: '#333333' },
  buttonColor: { type: String, default: '#2e7d32' },
  updatedAt: { type: Date, default: Date.now }
});

let MongooseModels = {};

function getMongooseModels() {
  if (!MongooseModels.Product) {
    MongooseModels.Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
    MongooseModels.Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
    MongooseModels.User = mongoose.models.User || mongoose.model('User', UserSchema);
    MongooseModels.Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
    MongooseModels.Theme = mongoose.models.Theme || mongoose.model('Theme', ThemeSchema);
  }
  return MongooseModels;
}

// Database Connection Helper
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nammakadai';
  console.log(`Attempting to connect to MongoDB at: ${uri}`);
  try {
    // 2.5 second timeout to fail fast for local runs without MongoDB
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
      bufferCommands: false
    });
    console.log('MongoDB connected successfully!');
    useFallback = false;
    isConnecting = false;
    getMongooseModels();
  } catch (err) {
    console.warn('MongoDB connection failed. Falling back to local JSON files.');
    console.warn(`Reason: ${err.message}`);
    useFallback = true;
    isConnecting = false;
  }
};

// Create dynamic Proxy objects for the Models
const createModelProxy = (modelName) => {
  return new Proxy({}, {
    get(target, prop) {
      if (isConnecting) {
        // If query is run before connection resolution, wait or default to fallback
        console.warn(`Database connection pending. Routing '${prop}' for ${modelName} to Fallback JSON.`);
        return fallbackModels[modelName][prop].bind(fallbackModels[modelName]);
      }
      if (useFallback) {
        return fallbackModels[modelName][prop].bind(fallbackModels[modelName]);
      } else {
        const mModels = getMongooseModels();
        const mModel = mModels[modelName];
        const val = mModel[prop];
        if (typeof val === 'function') {
          return val.bind(mModel);
        }
        return val;
      }
    }
  });
};

module.exports = {
  connectDB,
  Product: createModelProxy('Product'),
  Order: createModelProxy('Order'),
  User: createModelProxy('User'),
  Review: createModelProxy('Review'),
  Theme: createModelProxy('Theme'),
  isFallback: () => useFallback
};
