import express, { Request, Response } from "express";
import path from "path";
import * as requestIP from "request-ip";
import Log from "./schema/Log";
import { getLocationByIP } from "./util";
import mongoose from "./db";
import bot from "./bot";
import Link from "./schema/Link";
import cron from "cron";
import moment from "moment";

require("dotenv").config();

const app = express();
app.use(require("cors")())
app.use(express.static(path.resolve('./public')));

app.get("/:type/:linkID", async(req:Request,res:Response) => {
  const { linkID, type } = req.params;
  const link = await Link.findById(linkID);
  if (link !== null) {
    const ip = requestIP.getClientIp(req);
    const location = await getLocationByIP(ip);
    await (new Log({ location, dateTime: new Date().toUTCString(), linkID, type })).save()
    return res.redirect(link.link.toString());
  }
  return res.status(404).json({ success: false });
  
  
})

const job = new cron.CronJob('0 * * * *', async () => {
  const before24hours = moment().subtract(24, 'hours');
  await Log.deleteMany({
    dateTime: { $lte: before24hours },
  });
},()=>console.log("Logs for last 24 hours Deleted...."));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Started at PORT ${PORT}`);
  bot.launch().then(() => {
    console.log("Bot is Online")
  })
  job.start();
})