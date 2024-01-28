import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      trype: String,
      required: true,
    },
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    creater: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default Playlist = mongoose.model("Plylist", playlistSchema);
