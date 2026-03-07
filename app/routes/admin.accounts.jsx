import mongoose from "mongoose";

const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
  fullName: String, email: String, phone: String, role: String, status: String
}), "users");

export async function loader() {
  const accounts = await User.find().lean();
  return { accounts }; // Trả về object trực tiếp
}

export async function action({ request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id");

  if (intent === "create") {
    await User.create({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      role: formData.get("role"),
      status: "Active"
    });
    return { success: true };
  }

  if (intent === "update") {
    const otp = formData.get("otp");
    if (otp !== "123456") {
       // Thay vì dùng json(), ta ném lỗi hoặc trả về object kèm status nếu cần
       return { error: "Invalid OTP", status: 400 }; 
    }

    await User.findByIdAndUpdate(id, {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      status: formData.get("status")
    });
    return { success: true };
  }
}