import jwt from "jsonwebtoken";

export function jwtVerifyAndGetPayload(jwtToken) {
  return jwt.verify(jwtToken, process.env.JWT_SECRET);
}

export { default as createReadModel } from "./read-model";
export { default as createViewModel } from "./view-model";
export { default as createFacade } from "./facade";
