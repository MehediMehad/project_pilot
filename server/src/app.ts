import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import { requestLogger, requestTracker } from './app/middlewares/requestLogger';
import router from './app/routes';

const app: Application = express();
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001']
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  }),
);

// Add request tracking middleware
app.use(requestTracker);

// Add request logging middleware
app.use(requestLogger);

//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req: Request, res: Response) => {
  res.send({
    Message: 'Project Pilot Server is running..',
  });
});

app.use('/api/v1', router);

app.use(globalErrorHandler);

app.use((req: Request, res: Response, _next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: 'API NOT FOUND!',
    error: {
      path: req.originalUrl,
      message: 'Your requested path is not found!',
    },
  });
});

export default app;
