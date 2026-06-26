import { createRouter, publicQuery } from "./middleware";
import { pinyinRouter } from "./routers/pinyin";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  pinyin: pinyinRouter,
});

export type AppRouter = typeof appRouter;
