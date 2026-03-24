import jwt from "jsonwebtoken";

const decodeUserFromAuthHeader = (req) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return null;
  }

  const token = auth.split(" ")[1];
  return jwt.verify(token, process.env.JWT_SECRET);
};

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

export const requireAuth = (req, res, next) => {
  try {
    const user = decodeUserFromAuthHeader(req);
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập." });
    }

    if (normalizeRole(user.role) === "guest") {
      return res.status(403).json({ message: "Tài khoản guest không có quyền truy cập." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Chưa đăng nhập." });
  }
};

export const requireStaff = (req, res, next) => {
  try {
    const user = decodeUserFromAuthHeader(req);
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập." });
    }

    req.user = user;
    const role = normalizeRole(req.user.role);
    if (!["staff", "admin"].includes(role)) {
      return res.status(403).json({ message: "Không có quyền truy cập." });
    }

    next();
  } catch {
    res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};

export const requireAdmin = (req, res, next) => {
  try {
    const user = decodeUserFromAuthHeader(req);
    if (!user) {
      return res.status(401).json({ message: "Chưa đăng nhập." });
    }

    req.user = user;
    if (normalizeRole(req.user.role) !== "admin") {
      return res.status(403).json({ message: "Không có quyền truy cập." });
    }

    next();
  } catch {
    res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};
