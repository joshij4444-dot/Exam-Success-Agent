import { Router, type IRouter } from "express";
import healthRouter from "./health";
import onboardingRouter from "./onboarding";
import profileRouter from "./profile";
import syllabusRouter from "./syllabus";
import plannerRouter from "./planner";
import progressRouter from "./progress";
import dashboardRouter from "./dashboard";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(onboardingRouter);
router.use(profileRouter);
router.use(syllabusRouter);
router.use(plannerRouter);
router.use(progressRouter);
router.use(dashboardRouter);
router.use(aiRouter);

export default router;
