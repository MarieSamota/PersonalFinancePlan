const mongoose = require("mongoose");

const contributionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, "Сумма взноса обязательна"],
    min: [0.01, "Сумма взноса должна быть больше нуля"],
    cast: "Сумма взноса должна быть числом",
  },
  date: {
    type: Date,
    default: Date.now,
    cast: "Дата взноса должна быть в формате ГГГГ-ММ-ДД",
  },
  note: {
    type: String,
    trim: true,
    maxlength: [200, "Комментарий к взносу – не длиннее 200 символов"],
    default: "",
  },
});

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: [true, "Название цели обязательно"],
      trim: true,
      maxlength: [100, "Название цели – не длиннее 100 символов"],
    },
    targetAmount: {
      type: Number,
      required: [true, "Сумма цели обязательна"],
      min: [1, "Сумма цели должна быть не меньше 1"],
      cast: "Сумма цели должна быть числом",
    },
    deadline: {
      type: Date,
      cast: "Срок должен быть в формате ГГГГ-ММ-ДД",
    },
    tags: {
      type: [String],
      default: [],
    },
    contributions: {
      type: [contributionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

goalSchema.index({ userId: 1, deadline: 1 });

goalSchema.virtual("savedAmount").get(function () {
  const total = this.contributions.reduce((sum, c) => sum + c.amount, 0);
  return Math.round(total * 100) / 100;
});

goalSchema.virtual("progress").get(function () {
  return Math.min(100, Math.round((this.savedAmount / this.targetAmount) * 100));
});

goalSchema.virtual("status").get(function () {
  return this.isReached() ? "reached" : "active";
});

goalSchema.methods.isReached = function () {
  return this.savedAmount >= this.targetAmount;
};

goalSchema.statics.findOwn = function (id, userId) {
  return this.findOne({ _id: id, userId });
};

const Goal = mongoose.model("Goal", goalSchema);

module.exports = Goal;
