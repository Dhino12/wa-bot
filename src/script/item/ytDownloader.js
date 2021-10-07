const ytdl = require('ytdl-core');
const { overcomeENOENT, validateUrl } = require('./util');

let startTime = 0;
let percentDownload = 0;
let titleVideo = ''
const cookieYt = 'LOGIN_INFO=AFmmF2swRQIhAOa9HZz5PJq5rsUxqrNFP5Pzf9hLFn8QXqbAD8qseHcFAiB1UkLFZHiOQMjLpehU-WSX8QP0_fXJzSxDGt2BNg84sg:QUQ3MjNmeHVDWVUxWXZzUHRuOGNIdnlMRWhjbnA1alpCRHJRem9ZY1FicEJxUzJlTnZTbEJ1VTF4RTlFOV92MXZBbVhtc0daRlI0dng2LVdSZU1Ra0ZNYTg0cnJkb3l2SjBKWWl0RmItbGNQRWk1M0g5Wm1Dd3FzaWJ6ZDEwdV9GZUlPX1FMdG81S2F4bTBVcFJPRTIzTlZGRWdOaFpYV2dB; VISITOR_INFO1_LIVE=hY4uyJRyYuk; PREF=tz=Asia.Jakarta; SID=CggAK0u6Zh7Oxr8-bSZlv47tgql7k_Q3JHjTHpVHekrRspzwWuUTqcdOPSSQfPK3CU2gbw.; __Secure-1PSID=CggAK0u6Zh7Oxr8-bSZlv47tgql7k_Q3JHjTHpVHekrRspzwLh37J1fWdhm_-oaWGsBLpw.; __Secure-3PSID=CggAK0u6Zh7Oxr8-bSZlv47tgql7k_Q3JHjTHpVHekrRspzwQhZxBddeN9wLnu9jsqXYeA.; HSID=Ay-Ql0STi6eDw2MGm; SSID=AumIMA47UOMwA1NaF; APISID=YPxrSF99A5p2kI8c/AgPobtWPScIpWNn9H; SAPISID=Oaz5GNwhoy5uF6ei/AWvaMRlNVDQxR7rch; __Secure-1PAPISID=Oaz5GNwhoy5uF6ei/AWvaMRlNVDQxR7rch; __Secure-3PAPISID=Oaz5GNwhoy5uF6ei/AWvaMRlNVDQxR7rch; YSC=nEdeRoTG6HA; SIDCC=AJi4QfEiKPPhRusxD1TrjPvB94heHq7FRSXCvwTAKYnIqOsFOlZG8KeJM5eMnP3hkEaj0mUKkg; __Secure-3PSIDCC=AJi4QfFhdrbvwUAoxREMqKqR-ZDuDMUE6nH8kR3K3o9m7nXOTmR2Vxdfj_qTEUsnqaulESi-IA'

async function ytInfo (arg, optionInfo, optionSize) {

    if (!validateUrl(arg)) return
        
    const { videoDetails, formats } = await ytdl.getInfo(arg, {
        requestOptions: {
            header: {
                cookie: cookieYt
            }
        }
    }).catch((e) => {
        return e
    });

    if (arg === 'info' && videoDetails.title !== '') {
        // jika perintahnya /yt info
        return `Video : ${videoDetails.title}\nProses : *${percentDownload}%* downloaded`;
    } 

    if( optionInfo === 'info' || optionSize === 'info') {
        // jika perintahnya /yt <link> info
        console.log(optionSize);
        return `List Size Video\n============== ${infoVideoYt(formats)}`;
    }

    if (videoDetails.lengthSeconds >= 1800) {
        return `Video tidak boleh lebih dari 30menit,\nsedangkan video anda\n` +
        `*${Math.floor(videoDetails.lengthSeconds / 60)}:${Math.floor(videoDetails.lengthSeconds % 60)}*`;
    }
    if ( startTime > 1 ) {
        // jika ingin memulai download baru tetapi proses sebelumnya belum selesai
        return `${percentDownload}% downloaded` + `\nproses download video *${titleVideo}* masih berlangsung, harap 1 per 1`;
    }

    const higher = formats.filter(item => item.qualityLabel === `${
        (optionSize !== undefined)? optionSize : searchVideoBestQuality(formats)[0].qualityLabel
    }` && item.audioQuality !== undefined)[0];

    if (higher === undefined) {
        startTime = 0;
        return `Video youtube dengan size ${optionSize} tidak tersedia, cek dengan /yt <link> info`;
    }
    higher.title = videoDetails.title;

    return higher
}

async function ytDownloader(dataObj, createWriteStream) {
    const { arg, optionInfo, optionSize } = dataObj;

    const higher = await ytInfo(arg, optionInfo, optionSize);
    console.log(`Higher isi : ${higher}`); 

    if (typeof higher === 'string' && higher.startsWith('List')) {
        console.log(`Ya List`);
        return higher; // output = List Size Video\n======= formatVideo

    }  
    
    
    if (typeof higher === 'string' && !higher.startsWith('List')) {
        console.log(`bukan List`);
        throw higher; // output = error video;
    }
    
    ++startTime;
    const filePath = `./media/tmp/video/${overcomeENOENT(higher.title)}.${higher.mimeType.split(';')[0].split('/')[1]}`
    

    return new Promise((resolve,rejcet) => {
        ytdl(arg,  {
            quality: higher.itag
        }) 
        .on('progress', (chunkLength, downloaded, total) => {
            percentDownload = ((downloaded / total) * 100).toFixed(2);
            // console.log(percentDownload); process download
        })
        .pipe(createWriteStream(filePath))
        .on('error', (e) => {
            console.log(e);
            startTime = 0;
            rejcet(e);
        })
        .on('finish', async () => {
            resolve(filePath);
            startTime = 0;
        })    
    })
    
}

function infoVideoYt(formats) {
    return formats.map(video => { 
        if(video.audioQuality !== undefined && video.qualityLabel !== undefined) {
            return `\n${video.qualityLabel}`
        } else {
            if (video.qualityLabel !== undefined) {
                return `\n${video.qualityLabel} hanya video`
            } else {
                return `\n${video.audioSampleRate / 100}/kbps hanya audio`
            }
        }
    });
}

function searchVideoBestQuality (formats) {
    return formats.filter(video => video.qualityLabel !== undefined && video.audioQuality !== undefined)
}

module.exports = { ytDownloader }