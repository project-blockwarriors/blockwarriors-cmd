import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { httpAction } from "./_generated/server";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

http.route({
  path: "/hello",
  method: "GET",
  handler: httpAction(async () => {
    return new Response("Hello, world!", {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  }),
});

export default http;

