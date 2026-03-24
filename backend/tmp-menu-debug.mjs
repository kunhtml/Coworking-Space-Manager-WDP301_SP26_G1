import 'dotenv/config';
import mongoose from 'mongoose';
import MenuItem from './src/models/menu_item.js';
import Category from './src/models/category.js';

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
await mongoose.connect(uri);

const total = await MenuItem.countDocuments();
const byStatus = await MenuItem.aggregate([{ $group: { _id: '$availabilityStatus', n: { $sum: 1 } } }]);
const catTotal = await Category.countDocuments();
const catActive = await Category.countDocuments({ isActive: true });
const activeCats = await Category.find({ isActive: true }).select('_id').lean();
const activeIds = activeCats.map((c) => c._id);
const publicCount = await MenuItem.countDocuments({
  availabilityStatus: 'AVAILABLE',
  $or: [{ categoryId: { $in: activeIds } }, { categoryId: null }],
});

console.log(JSON.stringify({ total, byStatus, catTotal, catActive, publicCount }, null, 2));
await mongoose.disconnect();
