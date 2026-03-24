import 'dotenv/config';
import mongoose from 'mongoose';
import MenuItem from './src/models/menu_item.js';
import Category from './src/models/category.js';
import { normalizeMenuAvailability } from './src/constants/domain.js';

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
await mongoose.connect(uri);

const activeCats = await Category.find({ isActive: true }).select('_id').lean();
const activeIds = activeCats.map((c) => String(c._id));
const items = await MenuItem.find().populate('categoryId', 'isActive').lean();
const publicItems = items
  .filter((item) => {
    const catId = item?.categoryId?._id ? String(item.categoryId._id) : (item?.categoryId ? String(item.categoryId) : null);
    return catId === null || activeIds.includes(catId);
  })
  .map((item) => ({ ...item, availabilityStatus: normalizeMenuAvailability(item?.availabilityStatus, item?.stockQuantity) }))
  .filter((item) => item.availabilityStatus === 'AVAILABLE');

console.log(JSON.stringify({ totalItems: items.length, publicItems: publicItems.length }, null, 2));
await mongoose.disconnect();
