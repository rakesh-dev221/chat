import { Vimeo } from "@vimeo/vimeo";
import dotenv from "dotenv";
import { APIChain } from "langchain/chains";
import express from "express";
import * as fs from 'fs'

dotenv.config();

const app = express();

const client = new Vimeo(
    process.env.VIMEO_CLIENT,
    process.env.VIMEO_SECRET,
    process.env.PAT
);

app.use(express.json());


const updateDocument = (fileName, json) => {
    fs.writeFileSync(`./document/${fileName}.json`, json, {flag: 'w'}, (e) => {
        console.log(e)
    });
    console.log(`/document/${fileName}.json created`);
}

const updateGPTModal = async (endpoint = '/me/videos?page=1&per_page=100') => {
    client.request(
        {
            method: "GET",
            path: endpoint,

        },
        function (error, body) {
            if (error) {
                console.log(error);
                return;
            }

            const { paging, data } = body;

            const response = { data: [] };
            response.data.push(data);
            
            const q = paging.next ? paging.next.split('?') : '-?page=last&'.split('?');
            const fileName = q[1].split('&')[0];

            updateDocument(`page-${fileName}`, JSON.stringify(response));

            if (paging.next) {
                // fetch next page
                updateGPTModal(paging.next)
            }
        }
    );
}

app.get("/fetch-data", async (req, res) => {

    try {
        await updateGPTModal();
        res.json({ status: 'ok', message: 'model updated' });
    } catch (e) {
        console.log(e)
    }

});

app.listen(process.env.PORT || 3000, () => {
    console.log("server is up on http://localhost:" + process.env.PORT || 3000);
});
