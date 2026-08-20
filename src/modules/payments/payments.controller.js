import asyncHandler from "../../utils/asyncHandler.js";
import { sendResponse } from "../../utils/ApiResponse.js";
import * as paymentService from "./payments.service.js";

const listPaymentMethods = asyncHandler(async (_req, res) => {
  const methods = await paymentService.listPaymentMethods({ enabledOnly: true });
  return sendResponse(res, 200, "Payment methods fetched successfully.", methods);
});

const listAllPaymentMethods = asyncHandler(async (_req, res) => {
  const methods = await paymentService.listPaymentMethods();
  return sendResponse(res, 200, "Payment methods fetched successfully.", methods);
});

const updatePaymentMethod = asyncHandler(async (req, res) => {
  const method = await paymentService.updatePaymentMethod(req.params.id, req.body);
  return sendResponse(res, 200, "Payment method updated successfully.", method);
});

const listTransactions = asyncHandler(async (req, res) => {
  const { transactions, meta } = await paymentService.listTransactions(req.query);
  return sendResponse(res, 200, "Transactions fetched successfully.", transactions, meta);
});

const updateTransactionStatus = asyncHandler(async (req, res) => {
  const transaction = await paymentService.updateTransactionStatus(req.params.id, req.body.status);
  return sendResponse(res, 200, "Transaction updated successfully.", transaction);
});

export {
  listPaymentMethods,
  listAllPaymentMethods,
  updatePaymentMethod,
  listTransactions,
  updateTransactionStatus,
};
