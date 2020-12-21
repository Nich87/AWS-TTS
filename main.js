var AWS = require("aws-sdk");
AWS.config.loadFromPath("./config.json");
const config = require('./pre.json')
var fs = require("fs");
const Discord = require("discord.js");
const client = new Discord.Client();

let queue = []
let isPlaying = false


function isOwner(id) {
    const owners = ["484953715225133057"]
    return owners.includes(id)
}

function addAudioToQueue(path, voiceChannel) {
    queue.push(
        { path: path, voiceChannel: voiceChannel }
    );
}

function playAudio() {
    if (queue.length >= 1 && !isPlaying ) {
        queue[0].voiceChannel.join().then(connection => {
            const dispatcher = connection.play(queue[0].path)
            dispatcher.on('finish', () => {
                queue.shift()
                playAudio()
                isPlaying = true
            })
        })
    } else {
        isPlaying = false
    }
}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (message) => {
    const authorChannelId = message.member.voice.channel.id
    const connection = message.client.voice.connections.find(connection => connection.channel.id === authorChannelId)

    if (message.user == message.client.user || authorChannelId == null) {
        return;
    }
if(message.content.indexOf(config.prefix) !== 0) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
  /*
    if (message.content.startsWith(prefix)) {
        const input = message.content.replace(prefix, "").split(" ")
        const command = input[0]
        const args = input.slice(1)*/

        if (command === "s") {
            await message.member.voice.channel.join()
        } else if (command === "shutdown" && isOwner(message.member.id)) {
            message.client.voice.connections.each(connection => {
                connection.disconnect()
            })
            process.exit()
        }
     else if (connection != null) {

        var polly = new AWS.Polly();

        polly.synthesizeSpeech(
            {
                OutputFormat: "mp3",
                Text: message.content,
                VoiceId: "Mizuki",
                SampleRate: "22050",
                TextType: "text",
            },
            (err, data) => {
                if (err) console.log(err, err.stack);
                else {

                    if (connection != null) {
                        fs.writeFileSync(
                            `audio/${message.id}.mp3`,
                            data.AudioStream
                        );
                        addAudioToQueue(`audio/${message.id}.mp3`, message.member.voice.channel)

                        if (!isPlaying) {
                            playAudio()
                        }
                    } else {
                        console.log(message.client.voice.connections)
                        console.log(message.member.voice.channel.id)
                    }
                    
                }
            }
        );
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);