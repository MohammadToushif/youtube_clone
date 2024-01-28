import mongoose, { Schema } from "mongoose";

const tweetSchema = Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default Tweet = mongoose.model("Tweet", tweetSchema);
