const { OAuth2Client } = require("google-auth-library");
const { User } = require("../models");
const google = new OAuth2Client(
  "949269482547-lnvejgvma8m9t4rg1hk6jqk2f0q1h9p9.apps.googleusercontent.com"
);

const checkAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({
      success: false,
      message: "Missing Access Token",
    });
  }
  try {
    const token = req.headers.authorization.split(" ")[1];

    const ticket = await google.verifyIdToken({
      idToken: token,
      audience:
        "949269482547-lnvejgvma8m9t4rg1hk6jqk2f0q1h9p9.apps.googleusercontent.com",
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    const isValidUser = await User.findOne({ where: { email } });

    if (isValidUser) {
      req.user = isValidUser;
      next();
    } else {
      res.status(401).json({ success: false, message: "Invalid access." });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { checkAuth };
