const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");

const Admin = require("../models/Admin");

const resend = new Resend(process.env.RESEND_API_KEY);

/*
========================================
LOGIN ADMIN
========================================
*/

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const admin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        adminId: admin._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during login.",
    });
  }
};


/*
========================================
FORGOT PASSWORD
========================================
*/

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const admin = await Admin.findOne({
      email: normalizedEmail,
    });

    /*
    We intentionally return the same response
    whether the email exists or not.
    This prevents someone from discovering
    the admin account email.
    */

    if (!admin) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    /*
    Generate a secure random token.
    */

    const resetToken = crypto.randomBytes(32).toString("hex");

    /*
    Store only the HASH of the token in MongoDB.
    */

    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    /*
    Token expires after 15 minutes.
    */

    const resetTokenExpiry = new Date(
      Date.now() + 15 * 60 * 1000
    );

    admin.resetPasswordToken = hashedResetToken;
    admin.resetPasswordExpires = resetTokenExpiry;

    await admin.save();

    /*
    Create frontend reset URL.
    */

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      console.error("FRONTEND_URL is missing in .env");

      admin.resetPasswordToken = null;
      admin.resetPasswordExpires = null;

      await admin.save();

      return res.status(500).json({
        success: false,
        message: "Server configuration error.",
      });
    }

    const resetUrl =
      `${frontendUrl}/admin/reset-password/${resetToken}`;


    /*
    Send password reset email.
    */

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [admin.email],
      subject: "Reset Your Admin Dashboard Password",

      html: `
        <!DOCTYPE html>

        <html>
          <head>
            <meta charset="UTF-8" />

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />

            <title>Password Reset</title>
          </head>

          <body
            style="
              margin:0;
              padding:0;
              background:#f5f3ff;
              font-family:Arial,Helvetica,sans-serif;
            "
          >

            <div
              style="
                max-width:600px;
                margin:40px auto;
                background:#ffffff;
                border-radius:18px;
                overflow:hidden;
                box-shadow:0 10px 35px rgba(0,0,0,0.08);
              "
            >

              <!-- HEADER -->

              <div
                style="
                  background:linear-gradient(
                    135deg,
                    #6d28d9,
                    #8b5cf6
                  );
                  padding:35px 30px;
                  text-align:center;
                  color:#ffffff;
                "
              >

                <div
                  style="
                    width:55px;
                    height:55px;
                    margin:0 auto 15px;
                    border-radius:15px;
                    background:rgba(255,255,255,0.18);
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:25px;
                    font-weight:bold;
                  "
                >
                  A
                </div>

                <h1
                  style="
                    margin:0;
                    font-size:27px;
                  "
                >
                  Admin Panel
                </h1>

                <p
                  style="
                    margin:8px 0 0;
                    font-size:14px;
                    opacity:0.9;
                  "
                >
                  Portfolio Management
                </p>

              </div>


              <!-- CONTENT -->

              <div
                style="
                  padding:40px 35px;
                  color:#1f2937;
                "
              >

                <h2
                  style="
                    margin:0 0 15px;
                    font-size:24px;
                  "
                >
                  Reset Your Password
                </h2>

                <p
                  style="
                    font-size:16px;
                    line-height:1.7;
                    color:#4b5563;
                  "
                >
                  We received a request to reset the password
                  for your administrator account.
                </p>

                <p
                  style="
                    font-size:16px;
                    line-height:1.7;
                    color:#4b5563;
                  "
                >
                  Click the button below to create a new password.
                </p>


                <!-- BUTTON -->

                <div
                  style="
                    text-align:center;
                    margin:35px 0;
                  "
                >

                  <a
                    href="${resetUrl}"
                    style="
                      display:inline-block;
                      padding:15px 30px;
                      background:#7c3aed;
                      color:#ffffff;
                      text-decoration:none;
                      border-radius:10px;
                      font-size:16px;
                      font-weight:bold;
                    "
                  >
                    Reset Password
                  </a>

                </div>


                <p
                  style="
                    font-size:14px;
                    line-height:1.6;
                    color:#6b7280;
                  "
                >
                  This password reset link will expire in
                  <strong>15 minutes</strong>.
                </p>

                <p
                  style="
                    font-size:14px;
                    line-height:1.6;
                    color:#6b7280;
                  "
                >
                  If you did not request this password reset,
                  you can safely ignore this email.
                </p>


                <!-- FALLBACK URL -->

                <div
                  style="
                    margin-top:25px;
                    padding:15px;
                    background:#f9fafb;
                    border-radius:8px;
                    word-break:break-all;
                  "
                >

                  <p
                    style="
                      margin:0 0 7px;
                      font-size:12px;
                      color:#6b7280;
                    "
                  >
                    If the button does not work, open this link:
                  </p>

                  <a
                    href="${resetUrl}"
                    style="
                      font-size:12px;
                      color:#7c3aed;
                    "
                  >
                    ${resetUrl}
                  </a>

                </div>

              </div>


              <!-- FOOTER -->

              <div
                style="
                  padding:22px 30px;
                  background:#f9fafb;
                  text-align:center;
                  border-top:1px solid #eeeeee;
                "
              >

                <p
                  style="
                    margin:0;
                    font-size:12px;
                    color:#9ca3af;
                  "
                >
                  This is an automated security email.
                  Please do not reply.
                </p>

              </div>

            </div>

          </body>
        </html>
      `,
    });


    /*
    If Resend returns an error,
    remove the reset token from database.
    */

    if (error) {
      console.error("Resend email error:", error);

      admin.resetPasswordToken = null;
      admin.resetPasswordExpires = null;

      await admin.save();

      return res.status(500).json({
        success: false,
        message:
          "Unable to send reset email. Please try again later.",
      });
    }


    console.log(
      "Password reset email sent:",
      data?.id
    );


    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });

  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong. Please try again later.",
    });
  }
};



/*
========================================
REGISTER ADMIN
========================================
*/

const registerAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Admin with this email already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin
    const admin = await Admin.create({
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully.",
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Register admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during admin registration.",
    });
  }
};



/*
========================================
RESET PASSWORD
========================================
*/

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "New password is required.",
      });
    }


    /*
    Basic password validation.
    */

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long.",
      });
    }


    /*
    Hash the token received from the URL
    and compare it with the database.
    */

    const hashedResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");


    /*
    Find admin with:
    1. Matching token
    2. Token not expired
    */

    const admin = await Admin.findOne({
      resetPasswordToken: hashedResetToken,
      resetPasswordExpires: {
        $gt: new Date(),
      },
    });


    if (!admin) {
      return res.status(400).json({
        success: false,
        message:
          "This reset link is invalid or has expired.",
      });
    }


    /*
    Hash new password.
    */

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );


    /*
    Update password.
    */

    admin.password = hashedPassword;


    /*
    Very important:
    invalidate reset token after use.
    */

    admin.resetPasswordToken = null;
    admin.resetPasswordExpires = null;


    await admin.save();


    /*
    Automatically create a new JWT.
    This allows frontend to directly log
    the admin into the dashboard after
    successful password reset.
    */

    const tokenForLogin = jwt.sign(
      {
        adminId: admin._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );


    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully.",
      token: tokenForLogin,
    });

  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while resetting your password.",
    });
  }
};


module.exports = {
  loginAdmin,
  forgotPassword,
  resetPassword,
  registerAdmin
};