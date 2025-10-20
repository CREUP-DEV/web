import { defineEventHandler } from "h3";
import mockData from "../../../data/mock.json";

export default defineEventHandler(async (event) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockData);
    }, 2000); // Simulate a 2-second delay
  });
});
