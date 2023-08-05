const express = require("express");
const fs = require("fs");
const dotenv = require("dotenv");

const { Vimeo } = require("@vimeo/vimeo");
const cors = require("cors");
const { OpenAI } = require("langchain/llms/openai");
const { RetrievalQAChain } = require("langchain/chains");
const { HNSWLib } = require("langchain/vectorstores/hnswlib");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const user = require("./route/user");
const db = require("./models");
const { checkAuth } = require("./middleware/auth");

const DATA = [
  ...JSON.parse(fs.readFileSync("./document/page-page-2.json", "utf8")).data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=3.json", "utf8")).data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=4.json", "utf8")).data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=5.json", "utf8")).data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=6.json", "utf8")).data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=7.json", "utf8")).data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=8.json", "utf8")).data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=9.json", "utf8")).data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=10.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=11.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=12.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=13.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=14.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=15.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=16.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=17.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=18.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=19.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=20.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=21.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=22.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=23.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=24.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=25.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=26.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=27.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=28.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=29.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=30.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=31.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=32.json", "utf8"))
    .data[0],
  ...JSON.parse(fs.readFileSync("./document/page-page=last.json", "utf8"))
    .data[0],
];

const client = new Vimeo(
  process.env.VIMEO_CLIENT,
  process.env.VIMEO_SECRET,
  process.env.PAT
);

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const vectorStoreName = "document";
const VECTOR_STORE_PATH = `${vectorStoreName}.index`;

const model = new OpenAI({ modelName: "text-davinci-003" });

const updateDocument = (fileName, R) => {
  const tags = R.tags?.map((t) => t.name).join(", ");
  const categories = R.categories?.map((t) => t.name).join(", ");
  const userSkills = R.user?.skills?.map((t) => t.name).join(", ");
  const content = `
  ###############  
    Name: ${R.name}
    Vide Link: ${R.link}
    Image Link: ${R.pictures?.base_link}
    Descriptions: ${R.description}
    Tags: ${tags}
    Category: ${categories}
    Duration: ${Math.round(R.duration / 60)} minutes
    Language: ${R.language}
    Owner Name: ${R.user?.name}
    Owner Info: ${R.user?.bio}
    Skill: ${userSkills}
    Status: ${R.status}
  ###############

  `;
  fs.writeFileSync(
    `./documents/${fileName}.txt`,
    content,
    { flag: "a+" },
    (e) => {
      console.log(e);
    }
  );
  console.log(`/document/${fileName}.txt updated`);
};

// DATA.map(d => updateDocument('source',d));

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

app.post("/ask", checkAuth, async (req, res) => {
  try {

    const { room_id, q } = req.body

    const vectorStore = await HNSWLib.load(
      VECTOR_STORE_PATH,
      new OpenAIEmbeddings()
    );
    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

    const response = await chain.call({
      query: q,
    });

    await db.Chat.create({
      room_id: room_id,
      sender: "user",
      message: q
    });

    if (response) {
      await db.Chat.create({
        room_id: room_id,
        sender: "bot",
        message: response.text
      });

      return res.json({
        room_id: room_id,
        sender: 'bot',
        message: response.text
      })
    }
  } catch (e) {
    console.log(e);
  }
});

const trainModel = async () => {
  console.log("start training");
  try {
    const text = fs.readFileSync("./documents/source.txt", "utf8");
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });
    const docs = await textSplitter.createDocuments([text]);
    const vectorStore = await HNSWLib.fromDocuments(
      docs,
      new OpenAIEmbeddings()
    );
    await vectorStore.save(VECTOR_STORE_PATH);
    console.log("end training");
  } catch (e) {
    console.log(e);
  }
};

app.use("/user", user);

app.listen(process.env.PORT || 3000, () => {
  console.log("server is up on http://localhost:" + process.env.PORT || 3000);
});
