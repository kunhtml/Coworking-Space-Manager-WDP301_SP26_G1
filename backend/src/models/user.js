import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
    {
        fullName: String,
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        passwordHash: {
            type: String,
            required: true
        },
        phone: String,
        role: String,
        membershipStatus: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

const User = mongoose.model("User", userSchema, "users");

export default User;