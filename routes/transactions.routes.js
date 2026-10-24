const express = require("express");
const controller = require("../controllers/transactions.controller");
const validate = require("../middleware/validate");
const {
  transactionSchema,
  transactionPatchSchema,
} = require("../validators/transaction.schema");

const router = express.Router();

router.get("/", controller.getAll);

router.get("/:id", controller.getOne);

router.post("/", validate(transactionSchema), controller.create);

router.put("/:id", validate(transactionSchema), controller.update);

router.patch("/:id", validate(transactionPatchSchema), controller.update);

router.delete("/:id", controller.remove);

module.exports = router;
