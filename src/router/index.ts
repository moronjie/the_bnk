import { Router } from "express";
import authRouter from "./auth.router";
import accountRouter from "./account.router";

const router = Router();

router.use('/auth', authRouter);
router.use('/accounts', accountRouter);

export default router;