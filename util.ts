import axios from "axios";
const pdf = require("pdf-creator-node");
import fs from 'fs';
import path from "path"

// Read HTML Template
var html = fs.readFileSync('./templates/dataTable.html', 'utf8');

import { startCase } from "lodash";
import moment from "moment";
import Link from "./schema/Link";
import User from "./schema/User";

export const isExistingUser = async(_id: number) => {
  const userObj = await User.findById(_id);
  return userObj !== null;
}

export const addNewLink = async (uid:number,name:string,link:string) => {
  const domain = process.env.DOMAIN || "http://localhost:5000"
  const linkObj = new Link({ name, link, uid });
  await linkObj.save();

  const linkTypes = ["whatsapp", "linkedin", "facebook", "instagram", "general"]
  const links = linkTypes.map(
    (link) =>
      `<b>${startCase(link)}</b> - <a href='${domain}/${link[0]}/${
        linkObj.id
      }'>${domain}/${link[0]}/${linkObj.id}</a>                               `
  );
  return { linkID:linkObj.id,links}
}

export const getLocationByIP = async (ip: string|null) => {
  try {
    const location = await (
      await axios.get(`http://ip-api.com/json/${ip}`)
    ).data;
    delete location.status;
    return location;
  } catch (e) {
    return {};
  }
};

export const generatePDF = async (id: number, details: ({name:String}),data: ({ dateTime: Date, type: string, location: Object })[]) => {
  var options = {
    format: 'A3',
    orientation: 'portrait',
    border: '10mm',
    header: {
      height: '45mm',
      contents: `<div style="text-align: center;font-size:20px">${details.name}</div>`,
    },
    footer: {
      height: '28mm',
      contents: {
        first: 'Cover page',
        2: 'Second page', // Any page number is working. 1-based index
        default:
          '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
        last: 'Last Page',
      },
    },
  };
  var users = data.map((log, index) => ({
    count: index + 1,
    date: moment(log.dateTime).format('YYYY-MM-DD HH:mm:ss'),
    type: () => {
      switch (log.type) {
        case 'w':
          return 'Whatsapp';
        case 'l':
          return 'LinkedIn';
        case 'f':
          return 'Facebook';
        case 'i':
          return 'Instagram';
        case 'g':
          return 'General'
      }
    },
    // @ts-ignore
    location: log.location
  }));
  // @ts-ignore
  var document = {
    html: html,
    data: {
      users: users,
    },
    path: `./pdf/${id}.pdf`,
    type: 'w',
  };
  await pdf
    .create(document, options)
    .then((res: any) => {
      console.log(res);
    })
    .catch((error: any) => {
      console.error(error);
    });
}


export const removePDF = async(id:number) => {
  await fs.rm(path.join(process.cwd(), `./pdf/${id}.pdf`), () => { 

  });  
}