const express = require("express");
const router = express.Router();
const controller = require("../controllers/pages.controller");
const fakeAuth = require("../middleware/fakeAuth");

router.get("/login", controller.login);

router.get("/", fakeAuth, controller.index);
router.get("/item/:id", fakeAuth, controller.item);
router.get("/add", fakeAuth, controller.addForm);
router.post("/add", fakeAuth, controller.addSubmit);
router.get("/admin/logs", fakeAuth, controller.logs);

module.exports = router;