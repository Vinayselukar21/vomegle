import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const port = 3000; // default port to listen

app.use(cors());

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

// start the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
