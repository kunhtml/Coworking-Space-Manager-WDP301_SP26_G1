import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Chưa đăng nhập." });
  }
  try {
    const token = auth.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET || "nexus_secret");
    next();
  } catch {
    res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};

export const requireStaff = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Chưa đăng nhập." });
  }
  try {
    const token = auth.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET || "nexus_secret");
    // Normalize role để chấp nhận cả 'admin'/'Admin', 'staff'/'Staff'
    const role = (req.user.role || "").toLowerCase();
    if (!["staff", "admin"].includes(role)) {
      return res.status(403).json({ message: "Không có quyền truy cập." });
    }
    next();
  } catch {
    res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};
