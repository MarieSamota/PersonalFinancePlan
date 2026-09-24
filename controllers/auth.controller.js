const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../models/index");

const { User } = db;

function validateCredentials(body) {
  const errors = [];

  if (body.email === undefined) {
    errors.push("Поле email обязательно");
  } else if (
    typeof body.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
  ) {
    errors.push("Поле email должно быть корректным адресом почты");
  }

  if (body.password === undefined) {
    errors.push("Поле password обязательно");
  } else if (typeof body.password !== "string" || body.password.length === 0) {
    errors.push("Поле password должно быть непустой строкой");
  }

  return errors;
}

async function register(req, res) {
  const errors = validateCredentials(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }

  const { email, password } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res
      .status(400)
      .json({ error: "Пользователь с таким email уже зарегистрирован" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const emailVerificationToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    email,
    passwordHash,
    isVerified: false,
    emailVerificationToken,
  });

  console.log(
    `Подтверждение email для ${email}: http://localhost:3000/auth/verify-email/${emailVerificationToken}`,
  );

  res
    .status(201)
    .json({ id: user.id, email: user.email, isVerified: user.isVerified });
}

async function login(req, res) {
  const errors = validateCredentials(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Неверный email или пароль" });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Неверный email или пароль" });
  }

  if (!user.isVerified) {
    return res.status(403).json({ error: "Email не подтверждён" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  res.status(200).json({ token });
}

async function profile(req, res) {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  res.status(200).json({
    id: user.id,
    email: user.email,
    isVerified: user.isVerified,
  });
}

async function verifyEmail(req, res) {
  const { token } = req.params;

  const user = await User.findOne({
    where: { emailVerificationToken: token },
  });
  if (!user) {
    return res
      .status(400)
      .json({ error: "Неверный или уже использованный токен подтверждения" });
  }

  user.isVerified = true;
  user.emailVerificationToken = null;
  await user.save();

  res.status(200).json({ message: "Email подтверждён, теперь можно войти" });
}

module.exports = { register, login, profile, verifyEmail };
