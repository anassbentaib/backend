  import mongoose, { Schema } from "mongoose";

  const tokenSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "auth",
      unique: true,
    },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 60 },
  });

  const tokenModel = mongoose.model("token", tokenSchema);

  export default tokenModel;
