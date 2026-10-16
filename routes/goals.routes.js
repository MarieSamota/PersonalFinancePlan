const express = require("express");
const controller = require("../controllers/goals.controller");

const router = express.Router();

router.get("/", controller.getAll);

router.get("/stats", controller.stats);

router.get("/:id", controller.getOne);

router.post("/", controller.create);

router.put("/:id", controller.update);

router.delete("/:id", controller.remove);

router.post("/:id/contributions", controller.addContribution);

router.patch(
  "/:id/contributions/:contributionId",
  controller.updateContribution,
);

router.delete(
  "/:id/contributions/:contributionId",
  controller.removeContribution,
);

router.post("/:id/tags", controller.addTag);

router.delete("/:id/tags/:tag", controller.removeTag);

module.exports = router;
