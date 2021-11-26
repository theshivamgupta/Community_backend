require("dotenv").config();
// import { sign } from "jsonwebtoken";
const sign = require("jsonwebtoken").sign;

exports.createTokens = (user) => {
  let id = user.id,
    cnt = user.count;
  const refreshToken = sign(
    { userId: id, count: cnt },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "7d",
    }
  );
  const accessToken = sign({ userId: id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1d",
  });

  return { refreshToken, accessToken };
};
