import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storiesRouter from "./stories";
import podcastsRouter from "./podcasts";
import curriculumRouter from "./curriculum";
import tutorRouter from "./tutor";
import seoRouter from "./seo";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storiesRouter);
router.use(podcastsRouter);
router.use(curriculumRouter);
router.use(tutorRouter);
router.use(seoRouter);

export default router;
