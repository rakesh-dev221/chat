import express from "express";
import { OpenAI } from "langchain/llms/openai";
import { RetrievalQAChain } from "langchain/chains";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";


import * as fs from "fs";
import dotenv from "dotenv";
import { Vimeo } from "@vimeo/vimeo";

const DATA = fs.readFileSync('./document/page-page-2.json',"utf8");  


const client = new Vimeo(
    process.env.VIMEO_CLIENT,
    process.env.VIMEO_SECRET,
    process.env.PAT
);

dotenv.config();

const app = express();

const vectorStoreName = "document";
const VECTOR_STORE_PATH = `${vectorStoreName}.index`;

const model = new OpenAI({ modelName: "text-davinci-003" });

app.use(express.json());

const updateDocument = (fileName, R) => {
    const tags = R.tags.map(t => t.name).join(', ');
    const categories = R.categories.map(t => t.name).join(', ');
    const content = `
  ###############  
    Name: ${R.name}
    Vide Link: ${R.link}
    Image Link: ${R.pictures?.base_link}
    Descriptions: ${R.description}
    Tags: ${tags}
    Category: ${categories}
  ###############

  `;
    fs.writeFileSync(`./documents/${fileName}.txt`, content, { flag: "a+" }, (e) => {
        console.log(e);
    });
    console.log(`/document/${fileName}.txt updated`);
};

const data = JSON.parse(DATA).data[0]


// data.map(d => updateDocument('source',d));

const updateGPTModal = async (endpoint = "/me/videos?page=1&per_page=100") => {
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

            updateDocument(`document.txt`, response);

            if (paging.next) {
                // fetch next page
                // updateGPTModal(paging.next);
            }
        }
    );
};

app.get("/fetch-data", async (req, res) => {
    try {
        await updateGPTModal();
        res.json({ status: "ok", message: "model updated" });
    } catch (e) {
        console.log(e);
    }
});


app.get("/test", async (req, res) => {
    const question = 'what is Vicinity Studio';
    const vectorStore = await HNSWLib.load(VECTOR_STORE_PATH, new OpenAIEmbeddings());
    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

    const response = await chain.call({
        query: question
    });

    res.json({ response })

});

const trainModel = async () => {
    console.log("start training");
    try {
        
            const text = fs.readFileSync('./documents/source.txt', 'utf8');
            const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
            const docs = await textSplitter.createDocuments([text]);
            const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
            await vectorStore.save(VECTOR_STORE_PATH);
            console.log("end training");
    } catch (e) {
        console.log(e);
    }
};

// await trainModel();

app.listen(process.env.PORT || 3000, () => {
    console.log("server is up on http://localhost:" + process.env.PORT || 3000);
});
