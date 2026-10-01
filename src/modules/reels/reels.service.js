import Reel from "./reels.model.js";
import AppError from "../../utils/AppError.js";
import { deleteFromCloudinary } from "../../utils/cloudinary.js";

async function listActiveReels(storeId) {
  const reels = await Reel.find({ storeId, active: true }).sort({ slot: 1 }).lean();
  return reels.slice(0, 5);
}

async function listAllReels(storeId) {
  return Reel.find({ storeId }).sort({ slot: 1 }).lean();
}

async function getReelById(id, storeId) {
  const reel = await Reel.findOne({ _id: id, storeId });
  if (!reel) throw new AppError("Reel not found.", 404);
  return reel;
}

async function createReel(data, storeId) {
  const slotTaken = await Reel.findOne({ storeId, slot: data.slot });
  if (slotTaken) {
    throw new AppError(`Slot ${data.slot + 1} already has a reel. Edit or delete it first.`, 400);
  }
  return Reel.create({ ...data, storeId });
}

async function updateReel(id, data, storeId) {
  if (data.slot !== undefined) {
    const slotTaken = await Reel.findOne({ storeId, slot: data.slot, _id: { $ne: id } });
    if (slotTaken) {
      throw new AppError(`Slot ${data.slot + 1} already has a reel.`, 400);
    }
  }
  const reel = await Reel.findOneAndUpdate({ _id: id, storeId }, data, { new: true, runValidators: true });
  if (!reel) throw new AppError("Reel not found.", 404);
  return reel;
}

async function deleteReel(id, storeId) {
  const reel = await Reel.findOne({ _id: id, storeId });
  if (!reel) throw new AppError("Reel not found.", 404);
  if (reel.publicId) await deleteFromCloudinary(reel.publicId);
  await reel.deleteOne();
  return reel;
}

export { listActiveReels, listAllReels, getReelById, createReel, updateReel, deleteReel };
