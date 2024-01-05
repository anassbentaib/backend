import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authModel from "../model/model";
import * as dotenv from "dotenv";
import Token from "../model/token";
import sendEmail from "../utils/sendMail";
import crypto from "crypto";
dotenv.config();

export const Signup = async (req: any, res: any) => {
  const { username, password, email } = req.body;

  try {
    const user = await authModel.findOne({ email });
    if (user) {
      return res.status(500).send({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await authModel.create({
      username,
      password: hashedPassword,
      email,
    });

    const token = await new Token({
      userId: result._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();

    const url = `http://localhost:5173/users/${result?._id}/verify/${token.token}`;
    const htmlContent = `<p>Click <a href="${url}">here</a> to verify your email.</p></br>
    The token will be expired in 15 min
    `;
    const message = `[Auth App] verify you Email`;

    await sendEmail(result.email, "Verify Email", message, htmlContent);
    res.status(201).send({
      message:
        "An email has been sent to your account. Please verify your email",
      token,
      result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Signup error server-side: " + error);
  }
};

export const Login = async (req: any, res: any) => {
  const { email, password } = req.body;

  try {
    const user = await authModel.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send({ message: "Password is incorrect" });
    }

    if (!user.verified) {
      let token = await Token.findOne({ userId: user._id });

      if (!token) {
        token = await new Token({
          userId: user._id,
          token: crypto.randomBytes(32).toString("hex"),
        }).save();

        const url = `${process.env.BASE_URL}users/${user?._id}/verify/${token.token}`;
        const htmlContent = `<p>Click <a href="${url}">here</a> to verify your email.</p></br>
        The token will be expired in 15 min
        `;
        await sendEmail(user.email, "Verify Email", url, htmlContent);
      }

      return res.status(400).send({
        message:
          "An email has been sent to your account. Please verify your email",
      });
    }

    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.TOKEN_SECRET_KEY!,
      { expiresIn: "1h" }
    );

    res.status(200).send({ token, message: "Logged in successfully" });
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Login error server side", error: error.message });
  }
};

export const Verify = async (req: any, res: any) => {
  try {
    const user = await authModel.findOne({ _id: req.params.id });
    if (!user) return res.status(400).send({ message: "Invalid link" });

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token) return res.status(400).send({ message: "Invalid link" });
    await authModel.updateOne({ _id: user.id }, { $set: { verified: true } });
    setTimeout(async () => {
      await Token.deleteOne({ _id: token._id });
    }, 900000);

    res.status(200).send({ message: "Email Verified successfully" });
  } catch (error) {
    res.status(500).send("Internal server error: " + error);
  }
};
