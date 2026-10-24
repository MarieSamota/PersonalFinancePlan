const express = require("express");
const controller = require("../controllers/goals.controller");
const validate = require("../middleware/validate");
const {
  goalSchema,
  goalPatchSchema,
  contributionSchema,
  contributionPatchSchema,
  tagSchema,
} = require("../validators/goal.schema");

const router = express.Router();

router.get("/", controller.getAll);

router.get("/stats", controller.stats);

router.get("/:id", controller.getOne);

router.post("/", validate(goalSchema), controller.create);

router.put("/:id", validate(goalSchema), controller.update);

router.patch("/:id", validate(goalPatchSchema), controller.update);

router.delete("/:id", controller.remove);

router.post(
  "/:id/contributions",
  validate(contributionSchema),
  controller.addContribution,
);

router.patch(
  "/:id/contributions/:contributionId",
  validate(contributionPatchSchema),
  controller.updateContribution,
);

router.delete(
  "/:id/contributions/:contributionId",
  controller.removeContribution,
);

router.post("/:id/tags", validate(tagSchema), controller.addTag);

router.delete("/:id/tags/:tag", controller.removeTag);

module.exports = router;
