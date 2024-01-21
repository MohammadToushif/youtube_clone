// 'asyncHandler' is a higher order function, means it can accept and return another function as a parameter same as a variable

// const asyncHandler = (fn) => {async ()=> {}};
// const asyncHandler = (func) => async (err, req, res, nxt) => {
//   try {
//     await func(err, req, res, nxt);
//   } catch (error) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//     console.log("Error : ", error);
//   }
// };

const asyncHandler = (requestHandler) => {
  (req, res, nxt) => {
    Promise.resolve(requestHandler(req, res, nxt)).catch((err) => nxt(err));
  };
};

export default asyncHandler;
