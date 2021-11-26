exports.sendRefreshToken = (res, token) => {
  //   console.log({ token });
  res.cookie("cookie", token, {
    maxAge: 900000,
    httpOnly: false,
    path: "/refresh_token",
  });
};
