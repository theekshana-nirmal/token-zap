import { tokenZap } from "../index.js";

const text = `This is the line one.
This is  a   The      line two.


This is a line  an An  three.`;

tokenZap(text, { removeArticles: true });
