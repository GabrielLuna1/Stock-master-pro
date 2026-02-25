import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

// 1. Definição dos Dados ()
export interface IUser {
  name: string;
  email: string;
  password: string;
  role: "admin" | "operador";
  active: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

// 2. Definição dos Métodos Customizados
interface IUserMethods {
  matchPassword(enteredPassword: string): Promise<boolean>;
}

// 3. Interface Final
export interface UserDocument extends IUser, Document, IUserMethods {}

// 4. Tipo do Model
type UserModel = Model<UserDocument, {}, IUserMethods>;

const UserSchema = new Schema<UserDocument, UserModel, IUserMethods>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "operador"],
      default: "operador",
    },

    resetPasswordToken: {
      type: String,
      required: false,
    },
    resetPasswordExpires: {
      type: Date,
      required: false,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// 🔒 CRIPTOGRAFIA (Pre-save)
UserSchema.pre("save", async function () {
  const user = this as any;

  if (!user.isModified("password")) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  } catch (error) {
    throw new Error(error as string);
  }
});

// 🔑 MÉTODO DE COMPARAÇÃO
UserSchema.methods.matchPassword = async function (enteredPassword: string) {
  const user = this as any;
  return await bcrypt.compare(enteredPassword, user.password);
};

// Singleton para o Next.js
const User =
  (mongoose.models.User as UserModel) ||
  mongoose.model<UserDocument, UserModel>("User", UserSchema);

export default User;
