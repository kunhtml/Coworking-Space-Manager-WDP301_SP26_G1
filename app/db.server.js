// app/db.server.js
import mongoose from "mongoose";

export async function connectDB() {
  console.log("🔌 Hàm connectDB đang thực hiện kết nối...");
  
  // Tắt chế độ chờ lệnh để hiện lỗi thật ngay lập tức
  mongoose.set("bufferCommands", false); 

  try {
    // Thử dùng 127.0.0.1 thay vì localhost để ổn định hơn
    await mongoose.connect("mongodb://127.0.0.1:27017/DATABASE", {
      serverSelectionTimeoutMS: 5000, // Chỉ đợi 5s nếu không thấy server
    });
    console.log("✅ [DATABASE] Kết nối thành công!");
  } catch (error) {
    console.error("❌ [DATABASE] Lỗi kết nối:", error.message);
  }
}