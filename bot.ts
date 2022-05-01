
import { Composer, Context, Markup, Scenes, session, Telegraf } from "telegraf";
import fs from "fs";
import path from "path";
import axios from "axios";
import url from "url";
import isURL from "validator/lib/isURL";
import UserModel from "./schema/User";
import { addNewLink, generatePDF, isExistingUser, removePDF } from "./util";
import moment from "moment";
import Log from "./schema/Log";
import Link from "./schema/Link";
import mongoose from "mongoose";
var util = require('util');
var exec = require('child_process').exec;


const token = '5354900801:AAEj3O8fjI6AnTtj1uG5DGBgBf3XtlAximA';

interface MyWizardSession extends Scenes.WizardSessionData {
  link: string;
  name: string;
}
interface MyContext extends Context {
  // will be available under `ctx.myContextProp`
  myContextProp: string;

  // declare scene type
  scene: Scenes.SceneContextScene<MyContext, MyWizardSession>;
  // declare wizard type
  wizard: Scenes.WizardContextWizard<MyContext>;
}

const stepHandler = new Composer<MyContext>();
stepHandler.use(async (ctx) => {
  return ctx.wizard.selectStep(3);
});

const statsHandler = new Composer<MyContext>();
statsHandler.use(async (ctx) => {
  // @ts-ignore
  const before24hours = moment().subtract(24, 'hours');
  // @ts-ignore
  const id = ctx.message.text;
  const link =mongoose.isValidObjectId(id) ?  await Link.findById(id) : null;
  if (link !== null) {
    const logs = await Log.find({
      dateTime: { $gte: before24hours, $lte: new Date() },
    }).lean();
    await generatePDF(id,link, logs);
    var command = `curl -v -F "chat_id=1444974878" -F document=@${process.env.INIT_CWD}/pdf/${id}.pdf https://api.telegram.org/bot5354900801:AAEj3O8fjI6AnTtj1uG5DGBgBf3XtlAximA/sendDocument`;
    exec(command, (error: any, stdout: any, stderr: any) => {
      console.log("🚀 ~ file: bot.ts ~ line 61 ~ exec ~ error", error)
      if (error === null) {
        // ctx.scene.leave();
        removePDF(id);
      }
    });
  } else {
    // @ts-ignore
    ctx.telegram.sendMessage(ctx.chat?.id, 'LinkID can\'t be found');
  }
});


const superWizard = new Scenes.WizardScene(
  'link-wizard',
  async (ctx) => {
    await ctx.reply('Enter the Link to Track');
    return ctx.wizard.selectStep(2);
  },
  stepHandler,
  async (ctx) => {
    //@ts-ignore
    if (isURL(ctx.message.text,{require_protocol:true})) {
      // @ts-ignore
      ctx.scene.session.link = ctx.message.text;
      await ctx.reply('Enter a suitable name to identify');
      return ctx.wizard.next();
    } else {
      // @ts-ignore
      ctx.telegram.sendMessage(ctx.chat?.id, 'Invalid URL, Retry');
    }
      
  },
  async (ctx) => {
    // @ts-ignore
    ctx.scene.session.name = ctx.message.text;
    console.log(ctx.scene.session);
    const { name,link} = ctx.scene.session;
    const {linkID,links} = await addNewLink(ctx!.from!.id, name, link);
    const reply = `Your Link ID is <b>${linkID}</b> <pre>            </pre>${links.join(
      ''
    )}<pre>            </pre> Use the Link ID to get the statistics of the links in last 24 hours and in the end of the day you will receive statistics of that day automatically`;
    await ctx.replyWithHTML(reply);
    return await ctx.scene.leave();
  },
);

const statsWizard = new Scenes.WizardScene(
  'stats-wizard',
  async (ctx) => {
    await ctx.reply('Enter the Link ID to get the Stats');
    // @ts-ignore
    return ctx.wizard.selectStep(1);
  },
  statsHandler,
  async (ctx) => {
    console.log("End")
  }
);







const bot = new Telegraf<MyContext>(token);
const stage = new Scenes.Stage<MyContext>([superWizard, statsWizard]);
bot.use(session());
bot.use((ctx, next) => {
  const now = new Date();
  ctx.myContextProp = now.toString();
  return next();
});
bot.use(stage.middleware());

bot.command("start", async ctx => {
  const { id: _id, first_name, last_name } = ctx.from;
  let message = `Hi ${first_name}, I know you already!.What can I do for you today?`;
  if (await !isExistingUser(_id)) {
    await (new UserModel({ _id, name: (first_name + " " + last_name) })).save();
    message = `Hi ${first_name}, I'm TrackMyLink Bot. How can I help you ?`;
  }
  bot.telegram.sendMessage(ctx.chat.id, message);
})

bot.command("link", async (ctx) => {
  const { id, first_name } = ctx.from;
    if (await isExistingUser(id)) {
        ctx.scene.enter('link-wizard');
    } else {
      bot.telegram.sendMessage(ctx.chat.id,`Sorry ${first_name}, I don't know you yet. So, use the "Start" command to get to know you.`)
    }
})


bot.command("stats", async (ctx) => {
  ctx.scene.enter('stats-wizard');
})
export default bot;
