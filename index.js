import { Vimeo } from "@vimeo/vimeo";
import dotenv from 'dotenv'
import {APIChain} from 'langchain/chains'

dotenv.config()

const client = new Vimeo(process.env.VIMEO_CLIENT, process.env.VIMEO_SECRET, process.env.PAT);



// client.request({
//     method: 'GET',
//     path: '/me/videos'
//   }, function (error, body, status_code, headers) {
//     if (error) {
//       console.log(error);
//     }

//     console.log(body);
//   })