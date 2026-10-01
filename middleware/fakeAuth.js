function fakeAuth(req, res, next) {
  if (req.query.auth !== "1") {
    return res.redirect("/login");
  }

  req.user = { name: "Пользователь" };
  res.locals.authQuery = "?auth=1";
  next();
}

module.exports = fakeAuth;
