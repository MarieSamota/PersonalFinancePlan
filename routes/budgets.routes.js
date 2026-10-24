const express = require("express");
const controller = require("../controllers/budgets.controller");
const validate = require("../middleware/validate");
const {
  budgetSchema,
  budgetPatchSchema,
} = require("../validators/budget.schema");

const router = express.Router();

router.get("/", controller.getAll);

router.get("/:id", controller.getOne);

router.post("/", validate(budgetSchema), controller.create);

router.put("/:id", validate(budgetSchema), controller.update);

router.patch("/:id", validate(budgetPatchSchema), controller.update);

router.delete("/:id", controller.remove);

module.exports = router;
